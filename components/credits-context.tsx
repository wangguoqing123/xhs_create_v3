"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CreditBalance } from '@/lib/types'
import { useMySQLAuth } from '@/components/mysql-auth-context'

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
  const { user, loading: authLoading } = useMySQLAuth()
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

  // 缓存时间：5分钟（减少缓存时间，让积分更新更及时）
  const CACHE_DURATION = 5 * 60 * 1000
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
    // 如果用户未登录或认证正在加载中，直接返回
    if (!user || authLoading) {
      console.log('🔍 [积分Context] 跳过获取积分 - 用户未登录或认证加载中')
      return null
    }

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
      const response = await fetch('/api/credits/balance', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // 如果是认证错误，静默处理，不抛出错误
        if (response.status === 401) {
          console.log('🔍 [积分Context] 认证失败，清除用户状态')
          setError('用户未登录')
          return null
        }
        
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
  }, [user, authLoading, saveToCache])

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

  // 用户变化时重置状态并尝试加载缓存 - 只有在认证完成时才执行
  useEffect(() => {
    // 如果还在加载认证状态，不执行任何操作
    if (authLoading) return
    
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
  }, [user, authLoading, fetchBalance, loadFromCache]) // 添加authLoading依赖

  // 添加跨窗口积分刷新监听器
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    let broadcastChannel: BroadcastChannel | null = null

    // 尝试使用 BroadcastChannel API（现代浏览器支持）
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('credits-updates')
      broadcastChannel.onmessage = (e) => {
        if (e.data?.type === 'USER_CREDITS_UPDATED' && e.data?.userId === user.id) {
          console.log('🔄 [积分Context] BroadcastChannel收到用户积分更新消息，强制刷新积分')
          refreshBalance()
        }
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      // 监听积分缓存的变化
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const { balance: newBalance, userId } = JSON.parse(e.newValue)
          if (userId === user.id && newBalance) {
            console.log('🔄 [积分Context] 检测到跨窗口积分变化，更新显示')
            setBalance(newBalance)
            setLastFetched(Date.now())
          }
        } catch (error) {
          console.error('❌ [积分Context] 解析跨窗口积分数据失败:', error)
        }
      }
    }

    const handleMessage = (e: MessageEvent) => {
      // 监听积分刷新消息
      if (e.data?.type === 'REFRESH_CREDITS') {
        console.log('🔄 [积分Context] 收到积分刷新消息，强制刷新积分')
        refreshBalance()
      }
      
      // 监听特定用户的积分更新消息（PostMessage 备用方案）
      if (e.data?.type === 'USER_CREDITS_UPDATED' && e.data?.userId === user.id) {
        console.log('🔄 [积分Context] PostMessage收到用户积分更新消息，强制刷新积分')
        refreshBalance()
      }
    }

    // 监听页面可见性变化，当页面重新可见时检查积分
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时，检查是否需要刷新积分
        const now = Date.now()
        const timeSinceLastFetch = now - lastFetchedRef.current
        
        // 如果超过2分钟没有更新，强制刷新一次
        if (timeSinceLastFetch > 2 * 60 * 1000) {
          console.log('🔄 [积分Context] 页面重新可见且长时间未更新，刷新积分')
          refreshBalance()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('message', handleMessage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('message', handleMessage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (broadcastChannel) {
        broadcastChannel.close()
      }
    }
  }, [user, refreshBalance])

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