"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import type { UserMembershipStatus } from '@/lib/types'

interface UseMembershipStatusReturn {
  membershipStatus: UserMembershipStatus | null
  loading: boolean
  error: string | null
  refreshMembershipStatus: () => Promise<void>
  // 便捷的状态检查方法
  isActiveMember: boolean
  isLiteMember: boolean
  isProMember: boolean
  isPremiumMember: boolean
  membershipLevel: string | null
  membershipDuration: string | null
  membershipEndDate: Date | null
  daysUntilExpiry: number | null
  // 会员类型显示名称
  membershipDisplayName: string | null
}

/**
 * 获取用户会员状态的Hook
 * @returns UseMembershipStatusReturn 会员状态相关的数据和方法
 */
export function useMembershipStatus(): UseMembershipStatusReturn {
  const { user, loading: authLoading } = useMySQLAuth()
  const [membershipStatus, setMembershipStatus] = useState<UserMembershipStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取会员状态
  const fetchMembershipStatus = useCallback(async () => {
    if (!user || authLoading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/membership/status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          // 认证失败，静默处理
          setMembershipStatus(null)
          return
        }
        throw new Error(errorData.message || '获取会员状态失败')
      }

      const data = await response.json()
      
      if (data.success) {
        setMembershipStatus(data.data)
      } else {
        throw new Error(data.message || '获取会员状态失败')
      }
    } catch (err) {
      console.error('❌ [会员状态Hook] 获取会员状态失败:', err)
      setError(err instanceof Error ? err.message : '获取会员状态失败')
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  // 刷新会员状态
  const refreshMembershipStatus = useCallback(async () => {
    await fetchMembershipStatus()
  }, [fetchMembershipStatus])

  // 初始化时获取会员状态
  useEffect(() => {
    if (user && !authLoading) {
      fetchMembershipStatus()
    } else if (!user) {
      setMembershipStatus(null)
      setError(null)
    }
  }, [user, authLoading, fetchMembershipStatus])

  // 计算便捷的状态属性
  const computedValues = useMemo(() => {
    if (!membershipStatus) {
      return {
        isActiveMember: false,
        isLiteMember: false,
        isProMember: false,
        isPremiumMember: false,
        membershipLevel: null,
        membershipDuration: null,
        membershipEndDate: null,
        daysUntilExpiry: null,
        membershipDisplayName: null
      }
    }

    const endDate = membershipStatus.membership_end ? new Date(membershipStatus.membership_end) : null
    const now = new Date()
    const daysUntilExpiry = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

    // 生成会员等级显示名称
    let membershipDisplayName: string | null = null
    if (membershipStatus.is_active_member && membershipStatus.membership_level && membershipStatus.membership_duration) {
      const levelNames = {
        lite: '入门会员',
        pro: '标准会员', 
        premium: '高级会员'
      }
      const durationNames = {
        monthly: '月',
        yearly: '年'
      }
      membershipDisplayName = `${levelNames[membershipStatus.membership_level as keyof typeof levelNames]}(${durationNames[membershipStatus.membership_duration as keyof typeof durationNames]})`
    }

    return {
      isActiveMember: membershipStatus.is_active_member,
      isLiteMember: membershipStatus.is_lite_member,
      isProMember: membershipStatus.is_pro_member,
      isPremiumMember: membershipStatus.is_premium_member,
      membershipLevel: membershipStatus.membership_level,
      membershipDuration: membershipStatus.membership_duration,
      membershipEndDate: endDate,
      daysUntilExpiry,
      membershipDisplayName
    }
  }, [membershipStatus])

  return {
    membershipStatus,
    loading,
    error,
    refreshMembershipStatus,
    ...computedValues
  }
} 