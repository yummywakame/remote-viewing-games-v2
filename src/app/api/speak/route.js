import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

const VALID_VOICES = new Set([
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer',
])
const DEFAULT_VOICE = 'coral'
const MAX_TEXT_LENGTH = 500

export async function POST(request) {
  try {
    const body = await request.json()
    const { text, voice = DEFAULT_VOICE, speed = 1.0 } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }

    const safeVoice = VALID_VOICES.has(voice) ? voice : DEFAULT_VOICE
    const safeSpeed = Math.max(0.25, Math.min(4.0, Number(speed) || 1.0))

    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: safeVoice,
      input: text.trim(),
      speed: safeSpeed,
      response_format: 'mp3',
      instructions:
        'Speak in a warm, curious, and encouraging tone — like a supportive coach ' +
        'who is genuinely excited to help someone develop their intuition. ' +
        'Be clear and calm, with a sense of wonder.',
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('[/api/speak]', error)
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 })
  }
}
