import React, { useState } from 'react'

export const MessageInput: React.FC<{ onSend: (text: string) => void; disabled?: boolean }> = ({ onSend, disabled }) => {
  const [text, setText] = useState('')
  const submit = () => {
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
  }
  return (
    <div className="p-3 border-t dark:border-neutral-800">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 rounded border dark:border-neutral-700 p-2 h-24 resize-none bg-white dark:bg-neutral-900"
        />
        <button onClick={submit} disabled={disabled} className="px-4 py-2 rounded bg-blue-600 text-white h-10 self-end disabled:opacity-50">
          ส่ง
        </button>
      </div>
    </div>
  )
}
