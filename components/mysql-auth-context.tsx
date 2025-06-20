"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import type { Profile } from '@/lib/types'

interface AuthUser {
  id: string
  email: string
  display_name?: string
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  sendVerificationCode: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 本地存储的键名
const STORAGE_KEYS = {
  USER: 'xhs_mysql_user',
  PROFILE: 'xhs_mysql_profile',
  LAST_VERIFIED: 'xhs_mysql_last_verified'
}

// 验证间隔时间（30分钟）
const VERIFICATION_INTERVAL = 30 * 60 * 1000

// 本地存储工具
const storage = {
  getItem: function<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof window === 'undefined') return defaultValue || null
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : (defaultValue || null)
    } catch {
      return defaultValue || null
    }
  },
  setItem: function<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error('localStorage写入失败:', error)
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('localStorage删除失败:', error)
    }
  }
}

export function MySQLAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // 状态变化日志
  const prevStateRef = useRef<{hasUser: boolean, hasProfile: boolean, loading: boolean} | null>(null)
  useEffect(() => {
    const currentState = { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      loading
    }
    
    if (!prevStateRef.current || 
        prevStateRef.current.hasUser !== currentState.hasUser ||
        prevStateRef.current.hasProfile !== currentState.hasProfile ||
        prevStateRef.current.loading !== currentState.loading) {
      console.log(`🔐 [MySQL认证] 用户状态变化:`, currentState)
      prevStateRef.current = currentState
    }
  }, [user, profile, loading])

  // 从本地存储读取数据
  const loadFromStorage = () => {
    try {
      const storedUser = storage.getItem<AuthUser>(STORAGE_KEYS.USER)
      const storedProfile = storage.getItem<Profile>(STORAGE_KEYS.PROFILE)
      const lastVerified = storage.getItem<number>(STORAGE_KEYS.LAST_VERIFIED, 0)

      if (storedUser && storedProfile && lastVerified) {
        // 如果数据不太旧，直接使用
        if (Date.now() - lastVerified < VERIFICATION_INTERVAL) {
          setUser(storedUser)
          setProfile(storedProfile)
          setLoading(false)
          return true
        }
      }
    } catch (error) {
      console.error('localStorage读取失败:', error)
    }
    return false
  }

  // 保存到本地存储
  const saveToStorage = (userData: AuthUser | null, profileData: Profile | null) => {
    if (userData && profileData) {
      storage.setItem(STORAGE_KEYS.USER, userData)
      storage.setItem(STORAGE_KEYS.PROFILE, profileData)
      storage.setItem(STORAGE_KEYS.LAST_VERIFIED, Date.now())
    } else {
      clearStorage()
    }
  }

  // 清除本地存储
  const clearStorage = () => {
    storage.removeItem(STORAGE_KEYS.USER)
    storage.removeItem(STORAGE_KEYS.PROFILE)
    storage.removeItem(STORAGE_KEYS.LAST_VERIFIED)
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      console.log('🔍 [认证上下文] 开始获取用户信息')
      
      // 增加超时时间，给数据库连接更多时间
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // 确保包含Cookie
        signal: controller.signal,
        cache: 'no-store' // 不缓存认证请求
      })
      
      clearTimeout(timeoutId)
      console.log('🔍 [认证上下文] API响应状态:', response.status)
      
      const data = await response.json()
      console.log('🔍 [认证上下文] API响应数据:', data)
      
      if (data.success && data.user) {
        console.log('✅ [认证上下文] 获取用户信息成功')
        return { user: data.user, error: null }
      } else {
        console.log('❌ [认证上下文] 获取用户信息失败:', data.error)
        return { user: null, error: data.error }
      }
    } catch (error) {
      console.error('❌ [认证上下文] 获取用户信息异常:', error)
      
      // 检查是否是超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        return { user: null, error: '请求超时，请稍后重试' }
      }
      
      return { user: null, error: '获取用户信息失败' }
    }
  }

  // 后台验证用户状态
  const verifyUserInBackground = useCallback(async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser()
      
      if (!currentUser || error) {
        // 用户已登出或验证失败，清除本地数据
        if (user || profile) {
          setUser(null)
          setProfile(null)
          clearStorage()
        }
        return
      }

      // 验证成功，更新本地存储的验证时间
      if (user && profile) {
        storage.setItem(STORAGE_KEYS.LAST_VERIFIED, Date.now())
      }
    } catch (error) {
      console.error('后台验证失败:', error)
      // 验证失败，可能网络问题，保持当前状态
    }
  }, [user, profile])

  // 刷新用户资料
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { user: currentUser } = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setProfile(currentUser as Profile)
        saveToStorage(currentUser, currentUser as Profile)
      }
    } catch (error) {
      console.error('刷新用户资料失败:', error)
    }
  }, [user])

  // 发送验证码
  const sendVerificationCode = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      return {
        success: data.success,
        error: data.error,
        code: data.code // 开发环境会返回验证码
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      return {
        success: false,
        error: '发送验证码失败'
      }
    }
  }, [])

  // 验证邮箱验证码
  const verifyCode = useCallback(async (email: string, code: string) => {
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      })
      
      const data = await response.json()
      
      if (data.success && data.user) {
        // 登录成功，更新状态
        setUser(data.user)
        setProfile(data.user as Profile)
        saveToStorage(data.user, data.user as Profile)
        setLoading(false)
        
        return { success: true }
      } else {
        return {
          success: false,
          error: data.error || '验证失败'
        }
      }
    } catch (error) {
      console.error('验证码验证失败:', error)
      return {
        success: false,
        error: '验证失败'
      }
    }
  }, [])

  // 登出
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('登出请求失败:', error)
    }
    
    // 无论请求是否成功，都清除本地状态
    setUser(null)
    setProfile(null)
    clearStorage()
  }, [])

  // 客户端hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 初始化认证状态
  useEffect(() => {
    if (!isHydrated) return

    const initializeAuth = async () => {
      console.log('🔐 [MySQL认证] 开始初始化认证状态')
      
      try {
        // 先尝试从本地存储加载
        const hasLocalData = loadFromStorage()
        
        if (hasLocalData) {
          console.log('✅ [MySQL认证] 从本地存储加载用户数据成功')
          // 后台验证
          verifyUserInBackground()
        } else {
          console.log('🔍 [MySQL认证] 本地存储无数据，检查服务器状态')
          // 检查服务器认证状态
          const { user: currentUser } = await getCurrentUser()
          
          if (currentUser) {
            console.log('✅ [MySQL认证] 服务器验证成功')
            setUser(currentUser)
            setProfile(currentUser as Profile)
            saveToStorage(currentUser, currentUser as Profile)
          } else {
            console.log('❌ [MySQL认证] 用户未登录')
          }
        }
      } catch (error) {
        console.error('❌ [MySQL认证] 初始化失败:', error)
        // 清理可能损坏的数据
        clearStorage()
      }
      
      // 无论如何都要设置loading为false
      setLoading(false)
    }

    initializeAuth()
  }, [isHydrated])

  // 定期后台验证
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      verifyUserInBackground()
    }, VERIFICATION_INTERVAL)

    return () => clearInterval(interval)
  }, [user, verifyUserInBackground])

  // 避免hydration不匹配
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={{
        user: null,
        profile: null,
        loading: true,
        signOut: async () => {},
        refreshProfile: async () => {},
        sendVerificationCode: async () => ({ success: false }),
        verifyCode: async () => ({ success: false })
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      sendVerificationCode,
      verifyCode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useMySQLAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useMySQLAuth必须在MySQLAuthProvider内部使用')
  }
  return context
} 