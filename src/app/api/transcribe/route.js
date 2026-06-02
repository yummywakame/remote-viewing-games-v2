import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

const MAX_AUDIO_BYTES = 1024 * 1024 // 1 MB hard cap

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio')

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio clip too large' }, { status: 413 })
    }

    // Skip clips too small to contain speech
    if (audioFile.size < 200) {
      return NextResponse.json({ transcript: '' })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    console.error('[/api/transcribe]', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
