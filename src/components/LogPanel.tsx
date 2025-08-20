import React, { useEffect, useMemo, useState } from 'react'
import { logger, type LogEntry } from '../utils/logger'

export const LogPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs())
  const [level, setLevel] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const unsub = logger.subscribe((l) => setLogs(l.slice()))
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    return logs.filter(l => (level === 'all' || l.level === level) &&
      (query.trim() === '' || l.msg.toLowerCase().includes(query.toLowerCase()) || l.type.toLowerCase().includes(query.toLowerCase())))
  }, [logs, level, query])

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[640px] bg-white dark:bg-neutral-900 border-l dark:border-neutral-800 transform transition-transform z-50 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-3 border-b dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="font-medium">บันทึกการทำงาน (Logs)</div>
          <span className="text-xs text-neutral-500">{filtered.length} รายการ</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={level} onChange={e => setLevel(e.target.value as any)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
            <option value="all">ทั้งหมด</option>
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหา..." className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
          <button onClick={() => logger.clear()} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ล้าง</button>
          <button onClick={onClose} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ปิด</button>
        </div>
      </div>
      <div className="h-[calc(100vh-48px)] overflow-y-auto p-3 space-y-2">
        {filtered.map(l => (
          <div key={l.id} className="text-xs p-2 rounded border dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-white ${l.level === 'error' ? 'bg-red-600' : l.level === 'warn' ? 'bg-amber-600' : l.level === 'info' ? 'bg-blue-600' : 'bg-neutral-600'}`}>{l.level}</span>
              <span className="text-neutral-500">{new Date(l.ts).toLocaleTimeString()}</span>
              <span className="font-medium">{l.type}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap">{l.msg}</div>
            {l.meta && (
              <pre className="mt-1 bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-x-auto">{JSON.stringify(l.meta, null, 2)}</pre>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-xs text-neutral-500">ไม่มีรายการ</div>
        )}
      </div>
    </div>
  )
}


