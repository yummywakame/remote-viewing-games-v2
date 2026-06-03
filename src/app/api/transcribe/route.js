import { NextResponse } from 'next/server'

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

    if (audioFile.size < 200) {
      return NextResponse.json({ transcript: '' })
    }

    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type,
      },
      body: await audioFile.arrayBuffer(),
    })

    if (!res.ok) {
      console.error('[/api/transcribe] Deepgram error:', await res.text())
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const data = await res.json()
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('[/api/transcribe]', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
