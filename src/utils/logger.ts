type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  id: string
  ts: number
  level: LogLevel
  type: string
  msg: string
  meta?: Record<string, unknown>
}

const STORAGE_KEY = 'chatui:logs'
const MAX_LOGS = 1000

type Listener = (logs: LogEntry[]) => void
const listeners: Set<Listener> = new Set()

let logs: LogEntry[] = []
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  logs = raw ? (JSON.parse(raw) as LogEntry[]) : []
} catch {
  logs = []
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch {
    // ignore
  }
}

function emit() {
  for (const l of listeners) l(logs)
}

function _log(level: LogLevel, type: string, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = { id: (globalThis as any).crypto?.randomUUID?.() || String(Math.random()).slice(2), ts: Date.now(), level, type, msg, meta }
  logs.push(entry)
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS)
  persist()
  emit()

  // duplicate log to console for DevTools visibility
  try {
    const prefix = `[${new Date(entry.ts).toISOString()}] ${entry.level.toUpperCase()} ${entry.type}: ${entry.msg}`
    if (level === 'error') console.error(prefix, entry.meta ?? '')
    else if (level === 'warn') console.warn(prefix, entry.meta ?? '')
    else if (level === 'info') console.info(prefix, entry.meta ?? '')
    else console.debug(prefix, entry.meta ?? '')
  } catch {}
}

export const logger = {
  debug: (type: string, msg: string, meta?: Record<string, unknown>) => _log('debug', type, msg, meta),
  info: (type: string, msg: string, meta?: Record<string, unknown>) => _log('info', type, msg, meta),
  warn: (type: string, msg: string, meta?: Record<string, unknown>) => _log('warn', type, msg, meta),
  error: (type: string, msg: string, meta?: Record<string, unknown>) => _log('error', type, msg, meta),
  getLogs: () => logs.slice().reverse(),
  clear: () => { logs = []; persist(); emit() },
  subscribe: (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn) },
}

export type { LogLevel }


