"use client"

import { useCreditsContext } from '@/components/credits-context'
import { useEffect, memo } from 'react'
import { Gem, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CreditsDisplayProps {
  showRefresh?: boolean
  compact?: boolean
  className?: string
}

export const CreditsDisplay = memo(function CreditsDisplay({ 
  showRefresh = false, 
  compact = false, 
  className = ""
}: CreditsDisplayProps) {
  const { balance, loading, error, refreshBalance, getLatestBalance, isStale } = useCreditsContext()

  if (loading && !balance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Gem className="h-4 w-4 text-red-400" />
        <span className="text-sm text-red-500">加载失败</span>
      </div>
    )
  }

  if (!balance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Gem className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">--</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 ${className}`}
        title={`当前积分: ${balance.current}${isStale ? ' (数据可能已过期)' : ''}`}
      >
        <Gem className={`h-4 w-4 ${isStale ? 'text-purple-400' : 'text-purple-500'}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {balance.current}
          {isStale && <span className="text-xs text-purple-500 ml-1">*</span>}
        </span>
      </div>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <Gem className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">当前积分</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {balance.current}
              </p>
            </div>
          </div>
        </div>
        
        {/* 积分统计 */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">累计获得</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{balance.total_earned}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">累计消耗</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{balance.total_consumed}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}) 