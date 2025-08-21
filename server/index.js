import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import pg from 'pg'

const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json({ limit: '2mb' }))

// Database (Postgres) minimal key-value storage
const { Pool } = pg
let pool = null
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' || /railway|render|neon|supabase/i.test(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined
  })
  await pool.query(`CREATE TABLE IF NOT EXISTS app_data (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamptz DEFAULT now()
  )`)
}

// In-memory fallback if no DB
const memoryStore = new Map()

async function getData(key) {
  if (pool) {
    const r = await pool.query('SELECT value FROM app_data WHERE key = $1', [key])
    return r.rows[0]?.value ?? null
  }
  return memoryStore.get(key) ?? null
}

async function setData(key, value) {
  if (pool) {
    await pool.query('INSERT INTO app_data(key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()', [key, value])
    return
  }
  memoryStore.set(key, value)
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

// Persist entire client state (index + conversations)
app.get('/api/data', async (req, res) => {
  const state = await getData('state')
  res.json(state ?? { index: null, conversations: {} })
})

app.post('/api/data', async (req, res) => {
  const { index, conversations } = req.body || {}
  if (!index || typeof conversations !== 'object') {
    return res.status(400).json({ error: 'invalid payload' })
  }
  await setData('state', { index, conversations })
  res.json({ ok: true })
})

// Proxy: list models via server-side OpenAI key (optional)
app.get('/api/models', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY not configured' })
  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    const text = await r.text()
    res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Chat streaming via SSE using server-side OpenAI key
app.post('/api/chat/stream', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY not configured' })
  const { model, systemPrompt, messages } = req.body || {}
  if (!model || !Array.isArray(messages)) return res.status(400).json({ error: 'invalid payload' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  const body = {
    model,
    stream: true,
    stream_options: {
      include_usage: true
    },
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })
    if (!r.ok || !r.body) {
      const errText = await r.text().catch(() => '')
      res.write(`data: ${JSON.stringify({ error: `HTTP ${r.status}: ${errText}` })}\n\n`)
      return res.end()
    }

    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.replace(/^data:\s*/, '')
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n')
          return res.end()
        }
        try {
          const json = JSON.parse(data)
          const delta = json?.choices?.[0]?.delta?.content ?? ''
          const usage = json?.usage // ดึงข้อมูล usage จาก OpenAI response
          
          // ส่ง delta content
          if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`)
          
          // ส่งข้อมูล usage เมื่อได้รับ (มักจะมาในข้อความสุดท้าย)
          if (usage) {
            res.write(`data: ${JSON.stringify({ usage })}\n\n`)
          }
        } catch {
          // ignore keepalive
        }
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: String(e) })}\n\n`)
    res.end()
  }
})

// Static files
const distPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).end()
  try {
    const html = readFileSync(path.join(distPath, 'index.html'), 'utf-8')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch {
    res.status(200).send('OK')
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})


