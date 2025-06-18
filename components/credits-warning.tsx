"use client"

import { AlertTriangle, Coins, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkCredits } from '@/components/credits-context'

interface CreditsWarningProps {
  currentCredits: number
  requiredCredits: number
  className?: string
}

export function CreditsWarning({ 
  currentCredits, 
  requiredCredits, 
  className = "" 
}: CreditsWarningProps) {
  const creditCheck = checkCredits(currentCredits, requiredCredits)

  if (creditCheck.sufficient) {
    return (
      <Alert className={`border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 ${className}`}>
        <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          积分充足！当前积分 <strong>{creditCheck.current}</strong>，
          本次操作需要 <strong>{creditCheck.required}</strong> 积分，
          操作后剩余 <strong>{creditCheck.current - creditCheck.required}</strong> 积分。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className={`border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        <div className="space-y-2">
          <p>
            <strong>积分不足！</strong>当前积分 <strong>{creditCheck.current}</strong>，
            本次操作需要 <strong>{creditCheck.required}</strong> 积分，
            还需要 <strong>{creditCheck.shortage}</strong> 积分。
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            每篇笔记的批量生成需要消耗 1 积分，请减少选择的笔记数量或联系管理员充值。
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface CreditsInfoProps {
  selectedCount: number
  className?: string
}

export function CreditsInfo({ selectedCount, className = "" }: CreditsInfoProps) {
  if (selectedCount === 0) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 ${className}`}>
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          请选择要进行批量生成的笔记。每篇笔记将消耗 1 积分。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className={`border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 ${className}`}>
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        已选择 <strong>{selectedCount}</strong> 篇笔记，
        本次批量生成将消耗 <strong>{selectedCount}</strong> 积分。
        {selectedCount > 1 && (
          <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">
            💡 提示：如果某些笔记处理失败，对应的积分将自动返还。
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
} 