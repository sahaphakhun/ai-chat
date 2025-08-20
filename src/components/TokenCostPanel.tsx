import React, { useMemo } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useChat } from '../contexts/ChatContext'
import { countTokensConversation } from '../utils/token'
import { costUSD, formatUSD } from '../utils/cost'

export const TokenCostPanel: React.FC = () => {
  const { settings, setSettings } = useSettings()
  const { state } = useChat()
  const { conversations, currentId, index } = state
  const conv = currentId ? conversations[currentId] : undefined
  const stats = useMemo(() => countTokensConversation(conv?.messages ?? []), [conv?.messages])

  // Calculate costs for current conversation
  const inCost = costUSD(stats.input, settings.inPricePerK)
  const outCost = costUSD(stats.output, settings.outPricePerK)
  const currentTotal = inCost + outCost

  // Calculate total costs across all conversations
  const allStats = useMemo(() => {
    let totalInput = 0
    let totalOutput = 0
    let totalConversations = 0
    
    index.sessionIds.forEach((id: string) => {
      const conversation = conversations[id]
      if (conversation?.messages?.length > 0) {
        const convStats = countTokensConversation(conversation.messages)
        totalInput += convStats.input
        totalOutput += convStats.output
        totalConversations++
      }
    })
    
    return { totalInput, totalOutput, totalConversations }
  }, [conversations, index.sessionIds])

  const totalInCost = costUSD(allStats.totalInput, settings.inPricePerK)
  const totalOutCost = costUSD(allStats.totalOutput, settings.outPricePerK)
  const grandTotal = totalInCost + totalOutCost

  return (
    <div className="space-y-6">
      {/* Pricing Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ราคา/1K tokens (Input)</label>
          <input 
            type="number" 
            step="0.001"
            value={settings.inPricePerK}
            onChange={e => setSettings(s => ({ ...s, inPricePerK: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ราคา/1K tokens (Output)</label>
          <input 
            type="number" 
            step="0.001"
            value={settings.outPricePerK}
            onChange={e => setSettings(s => ({ ...s, outPricePerK: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Current Conversation Stats */}
      {currentId && conv && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
            <span className="mr-2">💬</span>
            ห้องสนทนาปัจจุบัน
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Input Tokens</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{stats.input.toLocaleString()} = {formatUSD(inCost)}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Output Tokens</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{stats.output.toLocaleString()} = {formatUSD(outCost)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">ค่าใช้จ่ายห้องนี้:</span>
              <span className="font-bold text-blue-900 dark:text-blue-300">{formatUSD(currentTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Total Stats Across All Conversations */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
          <span className="mr-2">📊</span>
          สถิติรวมทั้งหมด
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total Input Tokens</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{allStats.totalInput.toLocaleString()} = {formatUSD(totalInCost)}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total Output Tokens</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{allStats.totalOutput.toLocaleString()} = {formatUSD(totalOutCost)}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">จำนวนห้องสนทนา:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{allStats.totalConversations} ห้อง</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">ค่าใช้จ่ายรวมทั้งหมด:</span>
            <span className="font-bold text-lg text-green-900 dark:text-green-300">{formatUSD(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Average Cost Per Conversation */}
      {allStats.totalConversations > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center">
            <span className="mr-2">📈</span>
            ค่าเฉลี่ย
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">เฉลี่ยต่อห้อง</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{formatUSD(grandTotal / allStats.totalConversations)}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">เฉลี่ยต่อ Token</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {allStats.totalInput + allStats.totalOutput > 0 
                  ? formatUSD(grandTotal / (allStats.totalInput + allStats.totalOutput) * 1000) + '/1K'
                  : '$0.000/1K'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
