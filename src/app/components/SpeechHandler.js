'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { TRANSCRIPTION_ERROR_MESSAGE } from '@/lib/gameConstants'

// VAD tuning constants
const SPEECH_THRESHOLD = 15       // RMS above this → possible speech (lower catches plosive-onset words like "pink")
const MIN_SPEECH_MS = 100         // time since first onset before counting as real speech
const SILENCE_DURATION_MS = 200   // ms of silence after speech → send clip
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
  voiceName = 'echo',
  voiceSpeed = 1.1,
  onTranscript,          // (transcript: string) => void
  onListeningChange,     // (bool) => void
  onSpeakingChange,      // (bool) => void
  onTranscriptionError,  // () => void — called after error message + 1s delay
}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Stable refs for callbacks so effects don't need to re-run when they change
  const onTranscriptRef = useRef(onTranscript)
  const onListeningChangeRef = useRef(onListeningChange)
  const onSpeakingChangeRef = useRef(onSpeakingChange)
  const onTranscriptionErrorRef = useRef(onTranscriptionError)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onListeningChangeRef.current = onListeningChange }, [onListeningChange])
  useEffect(() => { onSpeakingChangeRef.current = onSpeakingChange }, [onSpeakingChange])
  useEffect(() => { onTranscriptionErrorRef.current = onTranscriptionError }, [onTranscriptionError])

  // Voice preference refs so speak() always uses the latest values without needing them in deps
  const voiceNameRef = useRef(voiceName)
  const voiceSpeedRef = useRef(voiceSpeed)
  // TTS cache: text → Blob. Cleared when voice or speed changes so stale audio is never replayed.
  const audioCacheRef = useRef(new Map())
  useEffect(() => { voiceNameRef.current = voiceName; audioCacheRef.current.clear() }, [voiceName])
  useEffect(() => { voiceSpeedRef.current = voiceSpeed; audioCacheRef.current.clear() }, [voiceSpeed])

  // Static audio manifest: maps phrase text → MP3 filename for the current voice.
  // Loaded once per voice change; speak() checks here before calling the API.
  const audioManifestRef = useRef(null)
  useEffect(() => {
    fetch(`/audio/${voiceName}/manifest.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { audioManifestRef.current = data?.phrases ?? null })
      .catch(() => { audioManifestRef.current = null })
  }, [voiceName])

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
  const currentAudioUrlRef = useRef(null)
  const currentFetchControllerRef = useRef(null)

  // State mirror refs (avoids stale closures in intervals/callbacks)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)

  // VAD state
  const hasSpeechRef = useRef(false)
  const silenceStartRef = useRef(null)
  const clipStartRef = useRef(null)
  const speechStartTimeRef = useRef(null)   // when RMS first crossed threshold this burst
  const lastSpeechSentRef = useRef(Date.now()) // for idle timeout

  // STT failure tracking — triggers error message after 2 consecutive failures
  const consecutiveFailuresRef = useRef(0)
  const transcriptionErrorHandlerRef = useRef(null)

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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const fd = new FormData()
      fd.append('audio', blob, 'clip.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd, signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { transcript } = await res.json()
      consecutiveFailuresRef.current = 0  // reset on success
      const clean = transcript?.trim().toLowerCase()
      if (!clean) return
      // Discard if every sentence is a known hallucination (catches repetitions like "thank you. thank you.")
      const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
      if (sentences.length > 0 && sentences.every(s => HALLUCINATIONS.has(s))) {
        console.log('[STT] discarded hallucination:', clean)
        return
      }
      console.log('[STT] heard:', clean)
      onTranscriptRef.current?.(clean)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('[STT] failed:', err.name === 'AbortError' ? 'timeout' : err.message)
      consecutiveFailuresRef.current++
      if (consecutiveFailuresRef.current >= 2) {
        consecutiveFailuresRef.current = 0
        transcriptionErrorHandlerRef.current?.()
      }
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
          // Note first onset of this burst
          if (!speechStartTimeRef.current) speechStartTimeRef.current = Date.now()
          silenceStartRef.current = null
        } else {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now()
          const silenceDuration = Date.now() - silenceStartRef.current
          // Only reset burst timer after sustained silence — brief dips during short
          // crisp words ("pink", "next") must not interrupt accumulation
          if (silenceDuration > 150) speechStartTimeRef.current = null
          if (hasSpeechRef.current && silenceDuration >= SILENCE_DURATION_MS) {
            rotateRecording(stream)
          }
        }

        // Confirm speech based on elapsed time since first onset — checked outside
        // both branches so brief dips below threshold don't block confirmation
        if (speechStartTimeRef.current && !hasSpeechRef.current &&
            Date.now() - speechStartTimeRef.current >= MIN_SPEECH_MS) {
          hasSpeechRef.current = true
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
    if (currentFetchControllerRef.current) {
      currentFetchControllerRef.current.abort()
      currentFetchControllerRef.current = null
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
      currentAudioUrlRef.current = null
    }
    setSpeaking(false)
  }, [setSpeaking])

  const speak = useCallback(async (text) => {
    if (!text) return false

    cancelSpeech()
    stopListening()
    setSpeaking(true)

    const controller = new AbortController()
    currentFetchControllerRef.current = controller

    let success = false
    try {
      const cacheKey = DOMPurify.sanitize(text)
      let blob = audioCacheRef.current.get(cacheKey)

      if (!blob) {
        // Check static pre-generated file first
        const staticFilename = audioManifestRef.current?.[cacheKey]
        if (staticFilename) {
          try {
            const res = await fetch(`/audio/${voiceNameRef.current}/${staticFilename}`, { signal: controller.signal })
            if (res.ok) {
              blob = await res.blob()
              audioCacheRef.current.set(cacheKey, blob)
              console.log('[TTS] static:', cacheKey)
            }
          } catch { /* fall through to API */ }
        }
      }

      if (!blob) {
        // Fall back to API (name-bearing phrases, missing static files, etc.)
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cacheKey,
            voice: voiceNameRef.current,
          }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`TTS ${res.status}`)
        const serverCache = res.headers.get('X-Cache')
        blob = await res.blob()
        audioCacheRef.current.set(cacheKey, blob)
        console.log(`[TTS] ${serverCache === 'HIT' ? 'server-cached' : 'api'}:`, cacheKey)
      }

      // Bail out if cancelled while fetching
      if (controller.signal.aborted) { setSpeaking(false); return false }
      currentFetchControllerRef.current = null

      const url = URL.createObjectURL(blob)
      currentAudioUrlRef.current = url
      const audio = new Audio(url)
      audio.playbackRate = voiceSpeedRef.current
      currentAudioRef.current = audio

      await new Promise((resolve) => {
        const finish = () => {
          URL.revokeObjectURL(url)
          currentAudioUrlRef.current = null
          setSpeaking(false)
          resolve()
        }
        audio.onended = finish
        audio.onerror = finish
        audio.play().catch((err) => { console.error('[TTS] play:', err); finish() })
      })
      success = true
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[TTS]', err)
      setSpeaking(false)
    }

    currentFetchControllerRef.current = null

    // Restart listening unless this speak was actively aborted (another speak is taking over)
    if (!controller.signal.aborted && gameStateRef.current === 'playing') {
      setTimeout(startListening, 300)
    }

    return success
  }, [cancelSpeech, stopListening, setSpeaking, startListening])

  // Wire up the transcription error handler once speak and stopListening are stable
  useEffect(() => {
    transcriptionErrorHandlerRef.current = async () => {
      stopListening()
      await speak(TRANSCRIPTION_ERROR_MESSAGE)
      await new Promise(r => setTimeout(r, 1000))
      onTranscriptionErrorRef.current?.()
    }
  }, [speak, stopListening])

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
