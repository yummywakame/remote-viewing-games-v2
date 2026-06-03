#!/usr/bin/env node
// Generates static TTS audio files for all voices and phrases.
// Run with: node --env-file=.env.local scripts/generate-audio.mjs
//
// Safe to re-run — skips files already present in the manifest.
// On credit exhaustion: saves progress and exits with a clear message.
// Re-run after topping up to continue from where it left off.

import { createHash } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { buildPhraseList, VOICES } from './phraseList.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AUDIO_DIR = join(ROOT, 'public', 'audio')
const CONCURRENCY = 5
const MODEL = 'gpt-4o-mini-tts'

function hashPhrase(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

function loadManifest(voice) {
  const path = join(AUDIO_DIR, voice, 'manifest.json')
  if (!existsSync(path)) return { version: 1, voice, phrases: {} }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function saveManifest(voice, manifest) {
  manifest.updatedAt = new Date().toISOString()
  writeFileSync(join(AUDIO_DIR, voice, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

async function fetchPhrase(client, voice, text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.audio.speech.create({
        model: MODEL,
        voice,
        input: text,
        response_format: 'mp3',
      })
      return Buffer.from(await response.arrayBuffer())
    } catch (err) {
      if (err?.status === 429 && attempt < 2) {
        const wait = (attempt + 1) * 3000
        process.stdout.write(`\n  Rate limited, waiting ${wait / 1000}s...`)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      throw err
    }
  }
}

async function processVoice(client, voice, phrases) {
  const voiceDir = join(AUDIO_DIR, voice)
  mkdirSync(voiceDir, { recursive: true })

  const manifest = loadManifest(voice)
  const phraseSet = new Set(phrases)

  // Remove stale entries (phrases no longer in the list)
  let removed = 0
  for (const text of Object.keys(manifest.phrases)) {
    if (!phraseSet.has(text)) {
      const filePath = join(voiceDir, manifest.phrases[text])
      if (existsSync(filePath)) unlinkSync(filePath)
      delete manifest.phrases[text]
      removed++
    }
  }

  // Determine what still needs fetching
  const toFetch = phrases.filter(text => {
    const filename = manifest.phrases[text]
    return !filename || !existsSync(join(voiceDir, filename))
  })

  console.log(`\n[${voice}] ${toFetch.length} to fetch | ${phrases.length - toFetch.length} already done | ${removed} stale removed`)
  if (toFetch.length === 0) {
    saveManifest(voice, manifest)
    return { fetched: 0, failed: 0 }
  }

  let idx = 0
  let fetched = 0
  let failed = 0

  async function worker() {
    while (idx < toFetch.length) {
      const text = toFetch[idx++]
      const filename = hashPhrase(text) + '.mp3'
      const filePath = join(voiceDir, filename)
      try {
        const buffer = await fetchPhrase(client, voice, text)
        writeFileSync(filePath, buffer)
        manifest.phrases[text] = filename
        fetched++
        process.stdout.write('.')
      } catch (err) {
        const msg = err?.message ?? ''
        const isCredit = err?.status === 402 || msg.includes('credit') || msg.includes('quota') || msg.includes('billing')
        if (isCredit) {
          saveManifest(voice, manifest)
          console.error(`\n\n⚠️  OpenAI credit limit reached after ${fetched} new files.`)
          console.error(`   Progress saved. Top up your OpenAI credits and re-run:\n`)
          console.error(`   node --env-file=.env.local scripts/generate-audio.mjs\n`)
          process.exit(1)
        }
        console.error(`\n  ✗ Failed "${text.slice(0, 60)}": ${msg}`)
        failed++
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`\n[${voice}] Complete — fetched: ${fetched}, failed: ${failed}`)

  saveManifest(voice, manifest)
  return { fetched, failed }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('\nError: OPENAI_API_KEY not found.')
    console.error('Run with: node --env-file=.env.local scripts/generate-audio.mjs\n')
    process.exit(1)
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const phrases = buildPhraseList()

  console.log(`\n🎙  MindSight audio sync`)
  console.log(`   Phrases: ${phrases.length} | Voices: ${VOICES.length} | Model: ${MODEL}`)
  console.log(`   Estimated cost: ~$${((phrases.length * VOICES.length * 15) / 1_000_000 * 4).toFixed(2)} (rough upper bound)\n`)

  let totalFetched = 0
  let totalFailed = 0

  for (const voice of VOICES) {
    const { fetched, failed } = await processVoice(client, voice, phrases)
    totalFetched += fetched
    totalFailed += failed
  }

  console.log(`\n✅  All voices complete.`)
  console.log(`   New files: ${totalFetched} | Failed: ${totalFailed}`)
  if (totalFailed > 0) console.log(`   Re-run to retry failed phrases.`)
}

main()
