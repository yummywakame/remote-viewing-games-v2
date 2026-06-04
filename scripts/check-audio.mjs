#!/usr/bin/env node
// Audits the static TTS audio cache against the current phrase list.
// Reports missing, stale, and broken entries for each voice.
// Run with: node scripts/check-audio.mjs
// Fix issues with: node --env-file=.env.local scripts/generate-audio.mjs

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { buildPhraseList, VOICES } from './phraseList.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AUDIO_DIR = join(ROOT, 'public', 'audio')

function checkVoice(voice, phraseSet, phrases) {
  const manifestPath = join(AUDIO_DIR, voice, 'manifest.json')

  if (!existsSync(manifestPath)) {
    return { missing: phrases.length, stale: 0, broken: 0, noManifest: true }
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const manifestPhrases = manifest.phrases ?? {}
  const manifestKeys = new Set(Object.keys(manifestPhrases))
  const voiceDir = join(AUDIO_DIR, voice)

  const missing = phrases.filter(p => !manifestKeys.has(p)).length
  const stale = [...manifestKeys].filter(p => !phraseSet.has(p)).length
  const broken = phrases.filter(p => {
    const filename = manifestPhrases[p]
    return filename && !existsSync(join(voiceDir, filename))
  }).length

  return { missing, stale, broken, noManifest: false }
}

function main() {
  const phrases = buildPhraseList()
  const phraseSet = new Set(phrases)

  console.log(`\n🔍  MindSight audio cache check`)
  console.log(`    Phrases in current build: ${phrases.length}`)
  console.log(`    Voices: ${VOICES.length}\n`)

  let totalIssues = 0

  for (const voice of VOICES) {
    const { missing, stale, broken, noManifest } = checkVoice(voice, phraseSet, phrases)
    const issues = missing + stale + broken

    if (noManifest) {
      console.log(`  [${voice}] ✗  No manifest — all ${phrases.length} phrases ungenerated`)
    } else if (issues === 0) {
      console.log(`  [${voice}] ✓  All ${phrases.length} phrases present`)
    } else {
      const parts = []
      if (missing) parts.push(`${missing} missing`)
      if (stale) parts.push(`${stale} stale`)
      if (broken) parts.push(`${broken} broken`)
      console.log(`  [${voice}] ⚠   ${parts.join(', ')}`)
    }

    totalIssues += issues + (noManifest ? phrases.length : 0)
  }

  if (totalIssues > 0) {
    console.log(`\n  Run to fix: node --env-file=.env.local scripts/generate-audio.mjs\n`)
    process.exit(1)
  } else {
    console.log(`\n  ✅  Cache is complete and up to date.\n`)
  }
}

main()
