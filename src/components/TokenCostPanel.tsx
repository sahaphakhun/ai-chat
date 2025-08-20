import React, { useMemo } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useChat } from '../contexts/ChatContext'
import { countTokensConversation } from '../utils/token'
import { costUSD, costFromUsage, formatUSD } from '../utils/cost'
import type { PricingTier } from '../types'

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
    let totalCached = 0
    let totalConversations = 0
    let actualUsageInput = 0
    let actualUsageOutput = 0
    let actualUsageCached = 0
    let conversationsWithActualUsage = 0
    
    index.sessionIds.forEach((id: string) => {
      const conversation = conversations[id]
      if (conversation?.messages?.length > 0) {
        totalConversations++
        
        if (conversation.totalUsage) {
          // Use actual usage data
          actualUsageInput += conversation.totalUsage.prompt_tokens
          actualUsageOutput += conversation.totalUsage.completion_tokens
          actualUsageCached += conversation.totalUsage.cached_tokens || 0
          conversationsWithActualUsage++
        } else {
          // Fall back to estimated usage
          const convStats = countTokensConversation(conversation.messages)
          totalInput += convStats.input
          totalOutput += convStats.output
        }
      }
    })
    
    return { 
      totalInput, 
      totalOutput, 
      totalCached,
      totalConversations,
      actualUsageInput,
      actualUsageOutput,
      actualUsageCached,
      conversationsWithActualUsage
    }
  }, [conversations, index.sessionIds])

  // Calculate costs combining actual and estimated usage
  const actualInCost = costUSD(allStats.actualUsageInput, settings.inPricePerK)
  const actualOutCost = costUSD(allStats.actualUsageOutput, settings.outPricePerK)
  const actualCachedCost = settings.cachedInPricePerK ? costUSD(allStats.actualUsageCached, settings.cachedInPricePerK) : 0
  const actualTotal = actualInCost + actualOutCost + actualCachedCost
  
  const estimatedInCost = costUSD(allStats.totalInput, settings.inPricePerK)
  const estimatedOutCost = costUSD(allStats.totalOutput, settings.outPricePerK)
  const estimatedTotal = estimatedInCost + estimatedOutCost
  
  const grandTotal = actualTotal + estimatedTotal

  return (
    <div className="space-y-6">
      {/* Pricing Tier Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pricing Tier</label>
        <select
          value={settings.pricingTier}
          onChange={e => setSettings(s => ({ ...s, pricingTier: e.target.value as PricingTier }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="standard">Standard (Real-time)</option>
          <option value="flex">Flex (Lower cost, higher latency)</option>
          <option value="batch">Batch (Lowest cost, async)</option>
        </select>
      </div>

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

      {/* Cached Input Pricing (if applicable) */}
      {settings.cachedInPricePerK !== undefined && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ราคา/1K tokens (Cached Input)</label>
          <input 
            type="number" 
            step="0.001"
            value={settings.cachedInPricePerK}
            onChange={e => setSettings(s => ({ ...s, cachedInPricePerK: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Current Conversation Stats */}
      {currentId && conv && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
            <span className="mr-2">💬</span>
            ห้องสนทนาปัจจุบัน
          </h4>
          
          {/* Show actual usage if available */}
          {conv.totalUsage ? (
            <div className="space-y-3">
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">✅ Actual Usage (จาก OpenAI API)</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Input Tokens</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {conv.totalUsage.prompt_tokens.toLocaleString()} = {formatUSD(costUSD(conv.totalUsage.prompt_tokens, settings.inPricePerK))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Output Tokens</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {conv.totalUsage.completion_tokens.toLocaleString()} = {formatUSD(costUSD(conv.totalUsage.completion_tokens, settings.outPricePerK))}
                  </div>
                </div>
              </div>
              {conv.totalUsage.cached_tokens && settings.cachedInPricePerK && (
                <div className="text-sm">
                  <div className="text-gray-600 dark:text-gray-400">Cached Input Tokens</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {conv.totalUsage.cached_tokens.toLocaleString()} = {formatUSD(costUSD(conv.totalUsage.cached_tokens, settings.cachedInPricePerK))}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ค่าใช้จ่ายจริง:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    {formatUSD(costFromUsage(conv.totalUsage, settings.inPricePerK, settings.outPricePerK, settings.cachedInPricePerK))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-orange-700 dark:text-orange-400 font-medium">⚠️ Estimated Usage (คำนวณโดยประมาณ)</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Input Tokens (ประมาณ)</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{stats.input.toLocaleString()} = {formatUSD(inCost)}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Output Tokens (ประมาณ)</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{stats.output.toLocaleString()} = {formatUSD(outCost)}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ค่าใช้จ่ายประมาณ:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">{formatUSD(currentTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total Stats Across All Conversations */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
          <span className="mr-2">📊</span>
          สถิติรวมทั้งหมด
        </h4>
        
        {/* Actual Usage Stats */}
        {allStats.conversationsWithActualUsage > 0 && (
          <div className="mb-4">
            <div className="text-xs text-green-700 dark:text-green-400 font-medium mb-2">
              ✅ Actual Usage ({allStats.conversationsWithActualUsage} ห้อง)
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Input Tokens</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {allStats.actualUsageInput.toLocaleString()} = {formatUSD(actualInCost)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Output Tokens</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {allStats.actualUsageOutput.toLocaleString()} = {formatUSD(actualOutCost)}
                </div>
              </div>
            </div>
            {allStats.actualUsageCached > 0 && settings.cachedInPricePerK && (
              <div className="mt-2 text-sm">
                <div className="text-gray-600 dark:text-gray-400">Cached Input Tokens</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {allStats.actualUsageCached.toLocaleString()} = {formatUSD(actualCachedCost)}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Estimated Usage Stats */}
        {allStats.totalConversations > allStats.conversationsWithActualUsage && (
          <div className="mb-4">
            <div className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-2">
              ⚠️ Estimated Usage ({allStats.totalConversations - allStats.conversationsWithActualUsage} ห้อง)
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Input Tokens (ประมาณ)</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {allStats.totalInput.toLocaleString()} = {formatUSD(estimatedInCost)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Output Tokens (ประมาณ)</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {allStats.totalOutput.toLocaleString()} = {formatUSD(estimatedOutCost)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-3 border-t border-green-200 dark:border-green-700">
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
