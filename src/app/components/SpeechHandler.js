'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

// VAD tuning constants
const SPEECH_THRESHOLD = 20       // RMS above this → possible speech
const MIN_SPEECH_MS = 250         // must stay above threshold this long before counting as real speech (250ms allows short words like "red")
const SILENCE_DURATION_MS = 1500  // ms of silence after speech → send clip
const VAD_INTERVAL_MS = 100
const MAX_CLIP_MS = 10000         // force-rotate recording after this long
const IDLE_TIMEOUT_MS = 5 * 60 * 1000  // stop listening after 5 min of no confirmed speech

// Whisper hallucinates these phrases on silence/ambient noise — discard them
const HALLUCINATIONS = new Set([
  'bye', 'bye.', 'bye bye', 'bye bye.', 'goodbye', 'goodbye.',
  'bye!', 'bye bye!',
  'thank you', 'thank you.', 'thank you!',
  'thanks', 'thanks.',
  'thank you for watching', 'thank you for watching.',
  'see you', 'see you.',
  "you're welcome", "you're welcome.",
])

export default function useSpeech({
  gameState,
  voiceName = 'coral',
  voiceSpeed = 1.0,
  onTranscript,        // (transcript: string) => void
  onListeningChange,   // (bool) => void
  onSpeakingChange,    // (bool) => void
}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Stable refs for callbacks so effects don't need to re-run when they change
  const onTranscriptRef = useRef(onTranscript)
  const onListeningChangeRef = useRef(onListeningChange)
  const onSpeakingChangeRef = useRef(onSpeakingChange)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onListeningChangeRef.current = onListeningChange }, [onListeningChange])
  useEffect(() => { onSpeakingChangeRef.current = onSpeakingChange }, [onSpeakingChange])

  // Voice preference refs so speak() always uses the latest values without needing them in deps
  const voiceNameRef = useRef(voiceName)
  const voiceSpeedRef = useRef(voiceSpeed)
  useEffect(() => { voiceNameRef.current = voiceName }, [voiceName])
  useEffect(() => { voiceSpeedRef.current = voiceSpeed }, [voiceSpeed])

  const gameStateRef = useRef(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // Audio infrastructure
  const micStreamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const vadIntervalRef = useRef(null)

  // Playback
  const currentAudioRef = useRef(null)

  // State mirror refs (avoids stale closures in intervals/callbacks)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)

  // VAD state
  const hasSpeechRef = useRef(false)
  const silenceStartRef = useRef(null)
  const clipStartRef = useRef(null)
  const speechStartTimeRef = useRef(null)   // when RMS first crossed threshold this burst
  const lastSpeechSentRef = useRef(Date.now()) // for idle timeout

  const setListening = useCallback((val) => {
    isListeningRef.current = val
    setIsListening(val)
    onListeningChangeRef.current?.(val)
  }, [])

  const setSpeaking = useCallback((val) => {
    isSpeakingRef.current = val
    setIsSpeaking(val)
    onSpeakingChangeRef.current?.(val)
  }, [])

  // ----- Recording helpers -----

  const sendClip = useCallback(async (chunks, hadSpeech) => {
    if (!hadSpeech || chunks.length === 0) return
    const mimeType = chunks[0]?.type || 'audio/webm'
    const blob = new Blob(chunks, { type: mimeType })
    if (blob.size < 200) return

    lastSpeechSentRef.current = Date.now()

    try {
      const fd = new FormData()
      fd.append('audio', blob, 'clip.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      if (!res.ok) return
      const { transcript } = await res.json()
      const clean = transcript?.trim().toLowerCase()
      if (!clean) return
      // Discard if every sentence is a known Whisper hallucination (catches repetitions like "thank you. thank you.")
      const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
      if (sentences.length > 0 && sentences.every(s => HALLUCINATIONS.has(s))) return
      onTranscriptRef.current?.(clean)
    } catch (err) {
      console.error('[STT]', err)
    }
  }, [])

  const startRecording = useCallback((stream) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/ogg;codecs=opus'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder
    const chunks = []
    chunksRef.current = chunks
    hasSpeechRef.current = false
    silenceStartRef.current = null
    speechStartTimeRef.current = null
    clipStartRef.current = Date.now()

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      sendClip([...chunks], hasSpeechRef.current)
    }
    recorder.start(100)
  }, [sendClip])

  const rotateRecording = useCallback((stream) => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop() // triggers onstop → sendClip
    }
    setTimeout(() => {
      if (isListeningRef.current && !isSpeakingRef.current && gameStateRef.current === 'playing') {
        startRecording(stream)
      }
    }, 200)
  }, [startRecording])

  // ----- Core public API -----

  const stopListening = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current)
      vadIntervalRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setListening(false)
  }, [setListening])

  const startListening = useCallback(async () => {
    if (gameStateRef.current !== 'playing') return
    if (isSpeakingRef.current) return
    if (isListeningRef.current) return

    try {
      // Acquire mic stream once; reuse across recording sessions
      if (!micStreamRef.current) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      }

      // Build AudioContext + analyser once; resume if suspended
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
        const source = audioCtxRef.current.createMediaStreamSource(micStreamRef.current)
        analyserRef.current = audioCtxRef.current.createAnalyser()
        analyserRef.current.fftSize = 512
        source.connect(analyserRef.current)
      } else if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }

      setListening(true)
      startRecording(micStreamRef.current)

      const freqData = new Uint8Array(analyserRef.current.frequencyBinCount)
      const stream = micStreamRef.current

      vadIntervalRef.current = setInterval(() => {
        if (!isListeningRef.current || isSpeakingRef.current) return
        if (gameStateRef.current !== 'playing') { stopListening(); return }

        analyserRef.current.getByteFrequencyData(freqData)
        const rms = Math.sqrt(freqData.reduce((s, v) => s + v * v, 0) / freqData.length)

        if (rms > SPEECH_THRESHOLD) {
          // Start timing this speech burst
          if (!speechStartTimeRef.current) speechStartTimeRef.current = Date.now()
          // Only count as real speech once it's sustained MIN_SPEECH_MS
          if (!hasSpeechRef.current && Date.now() - speechStartTimeRef.current >= MIN_SPEECH_MS) {
            hasSpeechRef.current = true
          }
          silenceStartRef.current = null
        } else {
          // Below threshold: reset the burst timer so a brief noise dip resets
          speechStartTimeRef.current = null
          if (hasSpeechRef.current) {
            if (!silenceStartRef.current) silenceStartRef.current = Date.now()
            if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
              rotateRecording(stream)
            }
          }
        }

        // Idle timeout: stop listening if no speech has been sent in IDLE_TIMEOUT_MS
        if (Date.now() - lastSpeechSentRef.current > IDLE_TIMEOUT_MS) {
          stopListening()
          return
        }

        // Hard cap to prevent runaway recordings
        if (Date.now() - clipStartRef.current > MAX_CLIP_MS) {
          rotateRecording(stream)
        }
      }, VAD_INTERVAL_MS)

    } catch (err) {
      console.error('[STT] startListening:', err)
      setListening(false)
    }
  }, [setListening, startRecording, stopListening, rotateRecording])

  const cancelSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    setSpeaking(false)
  }, [setSpeaking])

  const speak = useCallback(async (text) => {
    if (!text) return

    cancelSpeech()
    stopListening()
    setSpeaking(true)

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: DOMPurify.sanitize(text),
          voice: voiceNameRef.current,
          speed: voiceSpeedRef.current,
        }),
      })

      if (!res.ok) throw new Error(`TTS ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio

      await new Promise((resolve) => {
        const finish = () => { URL.revokeObjectURL(url); setSpeaking(false); resolve() }
        audio.onended = finish
        audio.onerror = finish
        audio.play().catch((err) => { console.error('[TTS] play:', err); finish() })
      })
    } catch (err) {
      console.error('[TTS]', err)
      setSpeaking(false)
    }

    // Auto-restart listening after speech finishes
    if (gameStateRef.current === 'playing') {
      setTimeout(startListening, 300)
    }
  }, [cancelSpeech, stopListening, setSpeaking, startListening])

  // ----- Lifecycle -----

  // Auto-start listening when game enters playing state
  useEffect(() => {
    if (gameState === 'playing') {
      const t = setTimeout(startListening, 500)
      return () => clearTimeout(t)
    }
  }, [gameState, startListening])

  // Stop everything when game leaves playing state
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'intro') {
      cancelSpeech()
      stopListening()
    }
  }, [gameState, cancelSpeech, stopListening])

  // Full teardown on unmount
  useEffect(() => {
    return () => {
      cancelSpeech()
      stopListening()
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [cancelSpeech, stopListening])

  return { speak, startListening, stopListening, cancelSpeech, isListening, isSpeaking }
}
