"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CreditBalance } from '@/lib/types'
import { useAuth } from '@/components/auth-context'
import { supabase } from '@/lib/supabase'

interface CreditsContextType {
  balance: CreditBalance | null
  loading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  getLatestBalance: () => Promise<CreditBalance | null>
  updateBalance: (newBalance: Partial<CreditBalance>) => void
  isStale: boolean
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

interface CreditsProviderProps {
  children: React.ReactNode
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user } = useAuth()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number>(0)

  // 使用ref来避免闭包问题
  const balanceRef = useRef(balance)
  const lastFetchedRef = useRef(lastFetched)
  const loadingRef = useRef(loading)
  
  // 同步ref的值
  balanceRef.current = balance
  lastFetchedRef.current = lastFetched
  loadingRef.current = loading

  // 缓存时间：30分钟（增加缓存时间）
  const CACHE_DURATION = 30 * 60 * 1000
  const STORAGE_KEY = 'credits_cache'

  // 添加状态变化日志 - 临时注释，减少噪音
  // useEffect(() => {
  //   console.log(`💰 [积分] 积分状态变化:`, { balance, loading, hasUser: !!user })
  // }, [balance, loading, user])

  // 从localStorage加载缓存
  const loadFromCache = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      
      if (cached) {
        const { balance: cachedBalance, lastFetched: cachedTime, userId } = JSON.parse(cached)
        
        // 检查是否是同一用户且缓存未过期
        if (userId === user?.id && (Date.now() - cachedTime < CACHE_DURATION)) {
          setBalance(cachedBalance)
          setLastFetched(cachedTime)
          return cachedBalance
        }
      }
    } catch (error) {
      console.error(`❌ [积分Context] 加载缓存失败:`, error)
    }
    return null
  }, [user?.id, CACHE_DURATION])

  // 保存到localStorage
  const saveToCache = useCallback((balanceData: CreditBalance, fetchTime: number) => {
    if (typeof window === 'undefined' || !user?.id) return
    
    try {
      const cacheData = {
        balance: balanceData,
        lastFetched: fetchTime,
        userId: user.id
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('❌ [积分Context] 保存缓存失败:', error)
    }
  }, [user?.id])

  // 获取积分余额
  const fetchBalance = useCallback(async (force = false): Promise<CreditBalance | null> => {
    if (!user) return null

    // 使用ref来获取最新的状态值
    const currentBalance = balanceRef.current
    const currentLastFetched = lastFetchedRef.current
    const currentLoading = loadingRef.current

    // 如果不是强制刷新，检查缓存是否还有效
    if (!force && currentBalance && (Date.now() - currentLastFetched < CACHE_DURATION)) {
      return currentBalance
    }

    // 防止重复请求
    if (currentLoading) {
      return currentBalance
    }

    setLoading(true)
    setError(null)

    try {
      // 获取当前会话的access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('用户未登录')
      }

      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '获取积分余额失败')
      }

      const data = await response.json()
      const fetchTime = Date.now()
      
      setBalance(data)
      setLastFetched(fetchTime)
      
      // 保存到缓存
      saveToCache(data, fetchTime)
      
      return data
    } catch (err) {
      console.error('❌ [积分Context] 获取积分余额失败:', err)
      setError(err instanceof Error ? err.message : '获取积分余额失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, saveToCache])

  // 强制刷新积分
  const refreshBalance = useCallback(async () => {
    await fetchBalance(true)
  }, [fetchBalance])

  // 获取最新积分（会检查缓存）
  const getLatestBalance = useCallback(async () => {
    return await fetchBalance(false)
  }, [fetchBalance])

  // 更新积分（用于乐观更新）
  const updateBalance = useCallback((newBalance: Partial<CreditBalance>) => {
    setBalance(prev => {
      if (!prev) return null
      const updated = { ...prev, ...newBalance }
      
      // 更新缓存
      const fetchTime = Date.now()
      setLastFetched(fetchTime)
      saveToCache(updated, fetchTime)
      
      return updated
    })
  }, [saveToCache])

  // 用户变化时重置状态并尝试加载缓存
  useEffect(() => {
    if (user) {
      const cached = loadFromCache()
      
      // 如果没有有效缓存，则获取最新数据
      if (!cached) {
        fetchBalance(false)
      }
    } else {
      // 用户登出时清理状态
      setBalance(null)
      setLastFetched(0)
      setError(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [user]) // 只依赖user，避免循环依赖

  const contextValue: CreditsContextType = useMemo(() => ({
    balance,
    loading,
    error,
    refreshBalance,
    getLatestBalance,
    updateBalance,
    isStale: balance ? (Date.now() - lastFetched > CACHE_DURATION) : false
  }), [balance, loading, error, refreshBalance, getLatestBalance, updateBalance, lastFetched])

  return (
    <CreditsContext.Provider value={contextValue}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCreditsContext() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCreditsContext must be used within a CreditsProvider')
  }
  return context
}

// 检查积分是否足够的工具函数
export function checkCredits(currentCredits: number, requiredCredits: number) {
  return {
    sufficient: currentCredits >= requiredCredits,
    current: currentCredits,
    required: requiredCredits,
    shortage: Math.max(0, requiredCredits - currentCredits)
  }
} 