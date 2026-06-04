#!/usr/bin/env node
// Finds and deletes a phrase's .mp3 file(s) so generate-audio.mjs will re-fetch them.
// Leaves manifest entries intact — the generate script re-fetches any phrase whose file is missing.
//
// Usage:
//   node scripts/delete-phrase.mjs "it's a circle" --voice alloy
//   node scripts/delete-phrase.mjs "its a circle"  --voice all

import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { VOICES } from './phraseList.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AUDIO_DIR = join(ROOT, 'public', 'audio')

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const maxLen = Math.max(na.length, nb.length)
  return maxLen === 0 ? 1 : 1 - levenshtein(na, nb) / maxLen
}

function loadManifest(voice) {
  const path = join(AUDIO_DIR, voice, 'manifest.json')
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8'))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const voiceIdx = args.indexOf('--voice')

  if (voiceIdx === -1 || !args[voiceIdx + 1]) {
    console.error('\nError: --voice <name|all> is required.')
    console.error(`  Available voices: ${VOICES.join(', ')}`)
    console.error('  Use --voice all to target all voices.\n')
    process.exit(1)
  }

  const voice = args[voiceIdx + 1]
  const searchParts = args.filter((_, i) => i !== voiceIdx && i !== voiceIdx + 1)
  const search = searchParts.join(' ').trim()

  if (!search) {
    console.error('\nError: please provide a search term.\n')
    process.exit(1)
  }

  if (voice !== 'all' && !VOICES.includes(voice)) {
    console.error(`\nError: unknown voice "${voice}".`)
    console.error(`  Available voices: ${VOICES.join(', ')}\n`)
    process.exit(1)
  }

  return { search, voice }
}

function findPhrase(search) {
  let allPhrases = null
  for (const voice of VOICES) {
    const manifest = loadManifest(voice)
    if (manifest?.phrases) {
      allPhrases = Object.keys(manifest.phrases)
      break
    }
  }

  if (!allPhrases) {
    console.error('\nError: no manifests found. Run generate-audio.mjs first.\n')
    process.exit(1)
  }

  const normSearch = normalize(search)

  // 1. Exact normalized match
  const exact = allPhrases.filter(p => normalize(p) === normSearch)
  if (exact.length === 1) return { match: exact[0], type: 'exact' }
  if (exact.length > 1) return { matches: exact, type: 'multiple' }

  // 2. Substring match
  const sub = allPhrases.filter(p => {
    const np = normalize(p)
    return np.includes(normSearch) || normSearch.includes(np)
  })
  if (sub.length === 1) return { match: sub[0], type: 'substring' }
  if (sub.length > 1) return { matches: sub, type: 'multiple' }

  // 3. Fuzzy — top 5 by similarity score
  const scored = allPhrases
    .map(p => ({ phrase: p, score: similarity(search, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return { suggestions: scored, type: 'no-match' }
}

function deleteForVoice(voice, phrase) {
  const manifest = loadManifest(voice)
  if (!manifest?.phrases) {
    console.log(`  [${voice}] No manifest — skipping`)
    return false
  }

  const filename = manifest.phrases[phrase]
  if (!filename) {
    console.log(`  [${voice}] Phrase not in manifest — skipping`)
    return false
  }

  const filePath = join(AUDIO_DIR, voice, filename)
  if (!existsSync(filePath)) {
    console.log(`  [${voice}] Already missing (${filename}) — will be re-fetched by generate-audio.mjs`)
    return true
  }

  unlinkSync(filePath)
  console.log(`  [${voice}] Deleted ${filename}`)
  return true
}

function main() {
  const { search, voice } = parseArgs()
  const result = findPhrase(search)

  if (result.type === 'no-match') {
    console.log(`\nNo match found for: "${search}"`)
    console.log('\nClosest phrases:')
    for (const { phrase, score } of result.suggestions) {
      console.log(`  ${(score * 100).toFixed(0)}%  "${phrase}"`)
    }
    console.log()
    process.exit(1)
  }

  if (result.type === 'multiple') {
    console.log(`\nMultiple matches found for: "${search}" — please be more specific:\n`)
    for (const phrase of result.matches) console.log(`  "${phrase}"`)
    console.log()
    process.exit(1)
  }

  const { match } = result
  const targetVoices = voice === 'all' ? VOICES : [voice]

  const voiceLabel = targetVoices.length > 1 ? 'Voices: ' : 'Voice:  '
  console.log(`\nPhrase: "${match}"`)
  console.log(`${voiceLabel} ${targetVoices.join(', ')}\n`)

  let actioned = 0
  for (const v of targetVoices) {
    if (deleteForVoice(v, match)) actioned++
  }

  if (actioned > 0) {
    console.log(`\nRun to regenerate:`)
    console.log(`  node --env-file=.env.local scripts/generate-audio.mjs\n`)
  }
}

main()
