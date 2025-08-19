import { get, set, del } from 'idb-keyval'
import type { Conversation, Settings } from '../types'

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
  const index = loadIndex()
  if (!index) return { index: null, conversations: {} }
  if (index.useDB) {
    const data = ((await get(DB_KEY)) as any) || { conversations: {} }
    return { index, conversations: data.conversations || {} }
  } else {
    const raw = localStorage.getItem(DB_KEY)
    const data = raw ? JSON.parse(raw) : { conversations: {} }
    return { index, conversations: data.conversations || {} }
  }
}

export async function saveAll(index: IndexRecord, conversations: Record<string, Conversation>) {
  // Decide storage
  const payload = { conversations }
  const totalSize = sizeOf(index) + sizeOf(payload)
  const nextUseDB = totalSize > MAX_LOCAL_BYTES
  index.useDB = nextUseDB

  saveIndex(index)
  if (nextUseDB) {
    await set(DB_KEY, payload)
    // keep a tiny stub in localStorage to avoid quota churn
    localStorage.setItem(DB_KEY, JSON.stringify({ _hint: 'see IndexedDB' }))
  } else {
    localStorage.setItem(DB_KEY, JSON.stringify(payload))
    await del(DB_KEY) // clear IDB if existed
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
