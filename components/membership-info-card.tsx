"use client"

import { memo } from 'react'
import { useMembershipStatus } from '@/lib/hooks/use-membership-status'
import { Crown, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MembershipInfoCardProps {
  className?: string
}

/**
 * 会员信息卡片组件 - 用于用户下拉菜单
 * 显示格式：logo + xx会员 2025.09.10过期
 */
export const MembershipInfoCard = memo(function MembershipInfoCard({ 
  className = '' 
}: MembershipInfoCardProps) {
  const { 
    isActiveMember, 
    membershipLevel,
    membershipEndDate,
    loading 
  } = useMembershipStatus()

  if (loading) {
    return (
      <div className={cn("animate-pulse p-3 rounded-xl", className)}>
        <div className="h-4 bg-gray-200/50 dark:bg-slate-700/50 rounded w-32"></div>
      </div>
    )
  }

  // 未开会员时不显示
  if (!isActiveMember || !membershipLevel) {
    return null
  }

  // 会员等级配置
  const membershipConfig = {
    lite: {
      name: '入门会员',
      icon: <Star className="h-6 w-6" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200/50 dark:border-blue-700/50'
    },
    pro: {
      name: '标准会员',
      icon: <Crown className="h-6 w-6" />,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-200/50 dark:border-purple-700/50'
    },
    premium: {
      name: '高级会员',
      icon: <Sparkles className="h-6 w-6" />,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-200/50 dark:border-amber-700/50'
    }
  }

  const config = membershipConfig[membershipLevel as keyof typeof membershipConfig]
  
  // 格式化过期时间
  const expiryDate = membershipEndDate ? membershipEndDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.') : null

  return (
    <div className={cn(
      "p-4 rounded-xl border text-center",
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* 会员图标 - 居中放大 */}
      <div className={cn("flex justify-center mb-2", config.textColor)}>
        {config.icon}
      </div>
      
      {/* 会员信息文本 - 两行居中展示 */}
      <div className={cn("text-sm font-medium", config.textColor)}>
        <div>{config.name}</div>
        {expiryDate && (
          <div className="opacity-80 mt-1">
            {expiryDate}过期
          </div>
        )}
      </div>
    </div>
  )
}) 