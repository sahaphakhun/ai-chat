import type { Conversation, Settings } from '../types'
import { logger } from './logger'

const LOCAL_STORAGE_KEY = 'chatui:index'
const DB_KEY = 'chatui:db'
const MAX_LOCAL_BYTES = 5 * 1024 * 1024 // 5MB

export type IndexRecord = {
  useDB: boolean
  settings: Settings
  sessionIds: string[]
}

function sizeOf(obj: unknown): number {
  try {
    return new Blob([JSON.stringify(obj)]).size
  } catch {
    return Infinity
  }
}

export function loadIndex(): IndexRecord | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  return raw ? (JSON.parse(raw) as IndexRecord) : null
}

function saveIndex(idx: IndexRecord) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(idx))
}

export async function loadAll(): Promise<{ index: IndexRecord | null; conversations: Record<string, Conversation> }> {
  // โหลดจากเซิร์ฟเวอร์เป็นหลัก
  try {
    const res = await fetch('/api/data')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const serverIndex = (json?.index ?? null) as IndexRecord | null
    const serverConvs = (json?.conversations ?? {}) as Record<string, Conversation>
    logger.info('storage', 'loadAll: server', { hasIndex: !!serverIndex, conversations: Object.keys(serverConvs || {}).length })

    if (serverIndex && Object.keys(serverConvs).length > 0) {
      return { index: serverIndex, conversations: serverConvs }
    }

    // ถ้าเซิร์ฟเวอร์ยังว่าง ลอง seed จาก local (สำหรับการย้ายมาใช้ DATABASE_URL ครั้งแรก)
    const localIndex = loadIndex()
    const raw = localStorage.getItem(DB_KEY)
    const localData = raw ? JSON.parse(raw) : { conversations: {} }
    const localConvs = (localData?.conversations ?? {}) as Record<string, Conversation>
    if (localIndex && Object.keys(localConvs).length > 0) {
      logger.info('storage', 'loadAll: seed server from local', { sessions: localIndex.sessionIds.length, conversations: Object.keys(localConvs).length })
      try {
        const saveRes = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: localIndex, conversations: localConvs })
        })
        if (!saveRes.ok) throw new Error(`HTTP ${saveRes.status}`)
      } catch (se) {
        logger.warn('storage', 'seed server failed', { error: String(se) })
      }
      return { index: localIndex, conversations: localConvs }
    }

    return { index: serverIndex, conversations: serverConvs }
  } catch (e) {
    // fallback: อ่านจาก local (กรณี dev ไม่มีเซิร์ฟเวอร์)
    logger.warn('storage', 'loadAll: server failed, fallback local', { error: String(e) })
    const index = loadIndex()
    if (!index) return { index: null, conversations: {} }
    const raw = localStorage.getItem(DB_KEY)
    const data = raw ? JSON.parse(raw) : { conversations: {} }
    return { index, conversations: data.conversations || {} }
  }
}

export async function saveAll(index: IndexRecord, conversations: Record<string, Conversation>) {
  // บันทึกไปที่เซิร์ฟเวอร์เป็นหลัก
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, conversations })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    logger.info('storage', 'saveAll: server ok', { sessions: index.sessionIds.length, conversations: Object.keys(conversations).length })
  } catch (e) {
    // fallback: เขียนลง local เพื่อไม่ให้ผู้ใช้เสียข้อมูล
    logger.error('storage', 'saveAll: server failed, fallback local', { error: String(e) })
    const payload = { conversations }
    const totalSize = sizeOf(index) + sizeOf(payload)
    const nextUseDB = totalSize > MAX_LOCAL_BYTES
    index.useDB = nextUseDB
    saveIndex(index)
    try {
      if (nextUseDB) {
        localStorage.setItem(DB_KEY, JSON.stringify({ _hint: 'see IndexedDB' }))
      } else {
        localStorage.setItem(DB_KEY, JSON.stringify(payload))
      }
    } catch {}
  }
}

export function exportAsJson(conversations: Record<string, Conversation>) {
  const blob = new Blob([JSON.stringify({ conversations }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chatui-export-${new Date().toISOString().slice(0,19)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importFromJson(file: File) {
  const txt = await file.text()
  const parsed = JSON.parse(txt)
  const conversations = (parsed?.conversations ?? {}) as Record<string, Conversation>
  return conversations
}
