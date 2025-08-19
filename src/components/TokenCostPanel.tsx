import React, { useMemo } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useChat } from '../contexts/ChatContext'
import { countTokensConversation } from '../utils/token'
import { costUSD, formatUSD } from '../utils/cost'

export const TokenCostPanel: React.FC = () => {
  const { settings, setSettings } = useSettings()
  const { conversations, currentId } = useChat()
  const conv = currentId ? conversations[currentId] : undefined
  const stats = useMemo(() => countTokensConversation(conv?.messages ?? []), [conv?.messages])

  const inCost = costUSD(stats.input, settings.inPricePerK)
  const outCost = costUSD(stats.output, settings.outPricePerK)
  const total = inCost + outCost

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-sm">ราคา/1K tokens (input)</label>
        <input type="number" value={settings.inPricePerK}
          onChange={e => setSettings(s => ({ ...s, inPricePerK: parseFloat(e.target.value) || 0 }))}
          className="w-full border dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-900"/>
        <div className="text-sm">Input tokens: <b>{stats.input}</b> = {formatUSD(inCost)}</div>
      </div>
      <div className="space-y-1">
        <label className="text-sm">ราคา/1K tokens (output)</label>
        <input type="number" value={settings.outPricePerK}
          onChange={e => setSettings(s => ({ ...s, outPricePerK: parseFloat(e.target.value) || 0 }))}
          className="w-full border dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-900"/>
        <div className="text-sm">Output tokens: <b>{stats.output}</b> = {formatUSD(outCost)}</div>
      </div>
      <div className="col-span-2 text-right text-sm">รวมโดยประมาณ: <b>{formatUSD(total)}</b></div>
    </div>
  )
}
