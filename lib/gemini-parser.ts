import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ParsedDonorData } from './parser'
import { normalizeBloodGroup, normalizePhone, normalizeDate } from './validation'

// ─── Key Rotation & Cooldown (module-level singleton) ────────────────────────

interface KeyState {
  key: string
  cooledUntil: number // epoch ms; 0 = available
}

let keyStates: KeyState[] | null = null
let currentKeyIndex = 0

const COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

function initKeyStates(): KeyState[] {
  const raw = process.env.GEMINI_API_KEYS ?? ''
  const keys = raw
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)

  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEYS is not set or contains no valid keys')
  }

  return keys.map(key => ({ key, cooledUntil: 0 }))
}

function getKeyStates(): KeyState[] {
  if (!keyStates) {
    keyStates = initKeyStates()
  }
  return keyStates
}

function getNextAvailableKey(): KeyState | null {
  const states = getKeyStates()
  const now = Date.now()
  const total = states.length

  for (let i = 0; i < total; i++) {
    const idx = (currentKeyIndex + i) % total
    const state = states[idx]
    if (state.cooledUntil <= now) {
      currentKeyIndex = (idx + 1) % total
      return state
    }
  }

  return null
}

function markKeyCooledDown(keyState: KeyState): void {
  keyState.cooledUntil = Date.now() + COOLDOWN_MS
  console.warn(
    `[gemini-parser] Key ...${keyState.key.slice(-4)} rate-limited. ` +
    `Cooling down for ${COOLDOWN_MS / 60000} minutes.`
  )
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Extract blood donor records from the input and return a JSON array.

INPUT FORMAT: blank-line-separated blocks.
  Line 1: always the REFERRER name
  Line 2: always the DONOR name
  Line 3 onwards: blood group, phone, date, batch, hall in ANY order — identify each by its content, not its position.

HOW TO IDENTIFY EACH FIELD:
- Blood group: looks like A+/B-/AB+/O+ or variants (B(+ve), o+, AB(+ve), O(+) etc). Normalize to A+/A-/B+/B-/AB+/AB-/O+/O-. If line is "Platelet" → skip the entire block.
- Phone: contains digits resembling a Bangladesh number. Strip +880/880/spaces/dashes → must be 11 digits starting 01. "+8801518-983188"→"01518983188", "+8801518 983188"→"01518983188", "01782-014077"→"01782014077"
- Date: DD/MM/YY or DD-MM-YY or DD.MM.YY pattern with a real day+month+year. Expand 2-digit years (26→2026). "5-5-26"→"05-05-2026", "09/04/2026"→"09-04-2026". Return as DD-MM-YYYY.
- Batch: department name and/or academic year range. "Chemistry", "AMATH", "IIT 23-24", "22/23"→"22-23". Year ranges like "22/23" or "23-24" are BATCH not date. If none → "Unknown"
- Hall: residential hall name. Normalize: AEH/AE→"AE Hall", FH→"FH Hall", SH→"SH Hall", SK→"SK Hall", Mohsin hall→"Mohsin Hall", Jagannath hall→"Jagannath Hall", 21 hall→"21 Hall", Surjasen hall→"Surjasen Hall", PG→"PG Hall". If none → ""

OUTPUT: JSON array only, no markdown, no explanation.
[{"name":"","bloodGroup":"","phone":"","date":"","batch":"","referrer":"","hallName":""}]`

// ─── JSON Extraction ──────────────────────────────────────────────────────────

function extractJsonFromResponse(text: string): string {
  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Find raw JSON array bounds
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }

  return text.trim()
}

// ─── Result Normalization ─────────────────────────────────────────────────────

const VALID_BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

function normalizeGeminiResult(raw: unknown): ParsedDonorData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const name = String(r.name ?? '').trim()
  const bloodGroup = normalizeBloodGroup(String(r.bloodGroup ?? '').trim())
  const phone = normalizePhone(String(r.phone ?? '').trim())
  const date = normalizeDate(String(r.date ?? '').trim())
  const batch = String(r.batch ?? '').trim() || 'Unknown'
  const referrer = String(r.referrer ?? '').trim()
  const hallName = String(r.hallName ?? '').trim()

  if (!name || !VALID_BLOOD_GROUPS.has(bloodGroup)) return null

  return { name, bloodGroup, phone, date, batch, referrer, hallName }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Parse donor text using Gemini AI with key rotation and per-key cooldown.
 * Returns null when all keys are unavailable — caller should fall back to regex parser.
 */
export async function parseWithGemini(text: string): Promise<ParsedDonorData[] | null> {
  let states: KeyState[]
  try {
    states = getKeyStates()
  } catch (err: unknown) {
    console.warn('[gemini-parser] No API keys configured:', (err as Error).message)
    return null
  }

  for (let attempt = 0; attempt < states.length; attempt++) {
    const keyState = getNextAvailableKey()
    if (!keyState) {
      console.warn('[gemini-parser] All keys are cooling down. Falling back to regex parser.')
      return null
    }

    try {
      const genAI = new GoogleGenerativeAI(keyState.key)
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `\n\nExtract donor data from this text:\n\n${text}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      })

      const responseText = result.response.text()
      const jsonStr = extractJsonFromResponse(responseText)

      let parsed: unknown[]
      try {
        const rawParsed = JSON.parse(jsonStr)
        parsed = Array.isArray(rawParsed) ? rawParsed : [rawParsed]
      } catch {
        console.error('[gemini-parser] Failed to parse JSON from Gemini response:', jsonStr.substring(0, 300))
        continue
      }

      const donors = parsed
        .map(normalizeGeminiResult)
        .filter((d): d is ParsedDonorData => d !== null)

      if (donors.length === 0) {
        console.warn('[gemini-parser] Gemini returned 0 valid donors after normalization')
        return null
      }

      console.log(`[gemini-parser] Successfully parsed ${donors.length} donor(s) via Gemini`)
      return donors

    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      const status: number =
        err?.status ??
        (err?.message?.includes('429') ? 429 : 0)

      if (status === 429) {
        markKeyCooledDown(keyState)
        continue
      }

      console.error(
        `[gemini-parser] Key ...${keyState.key.slice(-4)} failed (status ${status}):`,
        err?.message ?? error
      )
      continue
    }
  }

  console.warn('[gemini-parser] All Gemini keys exhausted. Falling back to regex parser.')
  return null
}
