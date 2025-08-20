import React, { useMemo } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useChat } from '../contexts/ChatContext'
import { countTokensConversation, countTokensFromUsage } from '../utils/token'
import { costUSD, formatUSD, calculateCostFromUsage } from '../utils/cost'

export const TokenCostPanel: React.FC = () => {
  const { settings, setSettings } = useSettings()
  const { state } = useChat()
  const { conversations, currentId, index } = state
  const conv = currentId ? conversations[currentId] : undefined
  const stats = useMemo(() => countTokensConversation(conv?.messages ?? []), [conv?.messages])
  const apiStats = useMemo(() => countTokensFromUsage(conv?.messages ?? []), [conv?.messages])

  // Calculate costs for current conversation using API data if available
  const currentCosts = useMemo(() => {
    if (!conv?.messages?.length) return { inputCost: 0, outputCost: 0, totalCost: 0, hasAPIData: false }
    
    // ถ้ามีข้อมูลจาก API ให้ใช้ข้อมูลนั้น
    if (apiStats.hasCompleteAPIData) {
      let totalInputCost = 0
      let totalOutputCost = 0
      
      for (const message of conv.messages) {
        if (message.role === 'assistant' && message.usage) {
          const cost = calculateCostFromUsage(message.usage, settings.model)
          totalInputCost += cost.inputCost
          totalOutputCost += cost.outputCost
        }
      }
      
      return {
        inputCost: totalInputCost,
        outputCost: totalOutputCost,
        totalCost: totalInputCost + totalOutputCost,
        hasAPIData: true
      }
    } else {
      // fallback ไปใช้การคำนวณแบบเดิม
      const inCost = costUSD(stats.input, settings.inPricePerK)
      const outCost = costUSD(stats.output, settings.outPricePerK)
      return {
        inputCost: inCost,
        outputCost: outCost,
        totalCost: inCost + outCost,
        hasAPIData: false
      }
    }
  }, [conv?.messages, apiStats.hasCompleteAPIData, settings.model, settings.inPricePerK, settings.outPricePerK, stats])

  // Calculate total costs across all conversations
  const allStats = useMemo(() => {
    let totalInputCost = 0
    let totalOutputCost = 0
    let totalConversations = 0
    let conversationsWithAPIData = 0
    
    index.sessionIds.forEach((id: string) => {
      const conversation = conversations[id]
      if (conversation?.messages?.length > 0) {
        const apiData = countTokensFromUsage(conversation.messages)
        
        if (apiData.hasCompleteAPIData) {
          // ใช้ข้อมูลจาก API
          for (const message of conversation.messages) {
            if (message.role === 'assistant' && message.usage) {
              const cost = calculateCostFromUsage(message.usage, settings.model)
              totalInputCost += cost.inputCost
              totalOutputCost += cost.outputCost
            }
          }
          conversationsWithAPIData++
        } else {
          // fallback ไปใช้การคำนวณแบบเดิม
          const convStats = countTokensConversation(conversation.messages)
          totalInputCost += costUSD(convStats.input, settings.inPricePerK)
          totalOutputCost += costUSD(convStats.output, settings.outPricePerK)
        }
        totalConversations++
      }
    })
    
    return { 
      totalInputCost, 
      totalOutputCost, 
      totalConversations,
      conversationsWithAPIData
    }
  }, [conversations, index.sessionIds, settings.model, settings.inPricePerK, settings.outPricePerK])

  const grandTotal = allStats.totalInputCost + allStats.totalOutputCost

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
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {apiStats.hasCompleteAPIData ? apiStats.input.toLocaleString() : stats.input.toLocaleString()} = {formatUSD(currentCosts.inputCost)}
                {apiStats.hasCompleteAPIData && apiStats.cached > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    (รวม cached: {apiStats.cached.toLocaleString()})
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Output Tokens</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {apiStats.hasCompleteAPIData ? apiStats.output.toLocaleString() : stats.output.toLocaleString()} = {formatUSD(currentCosts.outputCost)}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ค่าใช้จ่ายห้องนี้:
                {currentCosts.hasAPIData && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">✓ API</span>
                )}
                {!currentCosts.hasAPIData && (
                  <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">~ ประมาณ</span>
                )}
              </span>
              <span className="font-bold text-blue-900 dark:text-blue-300">{formatUSD(currentCosts.totalCost)}</span>
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
            <div className="text-gray-600 dark:text-gray-400">Total Input Cost</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{formatUSD(allStats.totalInputCost)}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total Output Cost</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{formatUSD(allStats.totalOutputCost)}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">จำนวนห้องสนทนา:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {allStats.totalConversations} ห้อง
              {allStats.conversationsWithAPIData > 0 && (
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                  ({allStats.conversationsWithAPIData} ห้องมีข้อมูล API)
                </span>
              )}
            </span>
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
              <div className="text-gray-600 dark:text-gray-400">ความแม่นยำ</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {allStats.conversationsWithAPIData === allStats.totalConversations ? (
                  <span className="text-green-600 dark:text-green-400">✓ ข้อมูลจาก API</span>
                ) : allStats.conversationsWithAPIData > 0 ? (
                  <span className="text-yellow-600 dark:text-yellow-400">~ บางส่วนจาก API</span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">~ ประมาณการ</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
