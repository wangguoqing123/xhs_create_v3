"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from 'react'
import { AuthUser, getCurrentUser, onAuthStateChange, getProfile, updateLastLogin } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { storage } from '@/lib/utils'

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 本地存储的键名
const STORAGE_KEYS = {
  USER: 'xhs_user',
  PROFILE: 'xhs_profile',
  LAST_VERIFIED: 'xhs_last_verified'
}

// 验证间隔时间（30分钟）
const VERIFICATION_INTERVAL = 30 * 60 * 1000

// 性能监控工具（仅开发环境）
const perf = {
  start: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`)
    }
  },
  end: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      const measure = performance.getEntriesByName(label)[0]
      console.log(`🚀 [性能] ${label}: ${measure.duration.toFixed(2)}ms`)
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // 为了避免hydration不匹配，服务端和客户端都使用相同的初始状态
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 添加状态变化日志 - 优化：减少日志频率
  const prevStateRef = useRef<{hasUser: boolean, hasProfile: boolean, loading: boolean, isHydrated: boolean, isInitialized: boolean} | null>(null)
  useEffect(() => {
    const currentState = { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      loading, 
      isHydrated, 
      isInitialized 
    }
    
    // 只在状态真正变化时才打印日志
    if (!prevStateRef.current || 
        prevStateRef.current.hasUser !== currentState.hasUser ||
        prevStateRef.current.hasProfile !== currentState.hasProfile ||
        prevStateRef.current.loading !== currentState.loading ||
        prevStateRef.current.isHydrated !== currentState.isHydrated ||
        prevStateRef.current.isInitialized !== currentState.isInitialized) {
      console.log(`🔐 [认证] 用户状态变化:`, currentState)
      prevStateRef.current = currentState
    }
  }, [user, profile, loading, isHydrated, isInitialized])

  // 从本地存储读取数据
  const loadFromStorage = () => {
    perf.start('本地存储加载')
    
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
          perf.end('本地存储加载')
          return true
        }
      }
    } catch (error) {
      console.error(`❌ [性能监控] localStorage读取失败`, error)
    }
    
    perf.end('本地存储加载')
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
    storage.removeItems([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.LAST_VERIFIED
    ])
  }

  // 后台验证用户状态
  const verifyUserInBackground = useCallback(async () => {
    try {
      perf.start('后台验证')
      const { user: currentUser } = await getCurrentUser()
      
      if (!currentUser) {
        // 用户已登出，清除本地数据
        if (user || profile) { // 只有在状态真正需要更新时才更新
          setUser(null)
          setProfile(null)
          clearStorage()
        }
        perf.end('后台验证')
        return
      }

      // 验证成功，更新本地存储的验证时间
      if (user && profile) {
        storage.setItem(STORAGE_KEYS.LAST_VERIFIED, Date.now())
        
        // 减少频率：只在距离上次登录超过1小时时才更新
        const lastLoginTime = profile.last_login_at ? new Date(profile.last_login_at).getTime() : 0
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        
        if (lastLoginTime < oneHourAgo) {
          updateLastLogin(currentUser.id).catch(console.error)
        }
      }
      perf.end('后台验证')
    } catch (error) {
      console.error('后台验证失败:', error)
      perf.end('后台验证')
      // 验证失败，可能网络问题，保持当前状态
    }
  }, [user, profile])

  // 完整加载用户数据（用于首次登录或验证失败时）
  const loadUserData = useCallback(async (userId: string) => {
    try {
      perf.start('加载用户数据')
      const { data: profileData } = await getProfile(userId)
      if (profileData) {
        setProfile(profileData)
        
        // 只在首次加载时更新最后登录时间，避免频繁数据库写入
        const lastLoginTime = profileData.last_login_at ? new Date(profileData.last_login_at).getTime() : 0
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        
        if (lastLoginTime < oneHourAgo) {
          // 异步更新，不等待结果
          updateLastLogin(userId).catch(console.error)
        }
        
        perf.end('加载用户数据')
        return profileData
      }
      perf.end('加载用户数据')
    } catch (error) {
      console.error('加载用户资料失败:', error)
      perf.end('加载用户数据')
    }
    return null
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profileData = await loadUserData(user.id)
      if (profileData) {
        saveToStorage(user, profileData)
      }
    }
  }, [user, loadUserData])

  // 处理客户端hydration - 立刻标记为已hydrated并预加载数据
  useEffect(() => {
    // 立即标记为已hydrated
    setIsHydrated(true)
    
    // 预加载本地数据，减少闪烁
    const hasLocalData = loadFromStorage()
    if (!hasLocalData) {
      // 如果没有本地数据，立即设置loading为false，避免长时间的loading状态
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 只在客户端hydration完成后执行，且未初始化时才执行
    if (!isHydrated || isInitialized) return

    setIsInitialized(true)

    // 1. 如果已经有本地数据，直接在后台验证
    if (user && profile) {
      // 延迟后台验证，避免阻塞UI
      setTimeout(() => {
        verifyUserInBackground()
      }, 1000) // 增加延迟到1秒
      return
    }

    // 2. 没有本地数据时才执行完整的认证初始化
    const initializeAuth = async () => {
      try {
        perf.start('认证初始化')
        const { user: currentUser } = await getCurrentUser()
        
        if (currentUser) {
          const userData = currentUser as AuthUser
          
          // 没有本地数据，需要完整加载
          const profileData = await loadUserData(userData.id)
          if (profileData) {
            setUser(userData)
            setProfile(profileData)
            saveToStorage(userData, profileData)
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error)
      } finally {
        setLoading(false)
        perf.end('认证初始化')
      }
    }

    // 延迟初始化，让页面先渲染
    setTimeout(() => {
      initializeAuth()
    }, 100)
  }, [isHydrated, isInitialized, user, profile, loadUserData, verifyUserInBackground])

  // 独立的认证状态监听器 - 确保总是注册
  useEffect(() => {
    if (!isHydrated) return

    console.log('🎯 [认证上下文] 注册认证状态监听器')
    
    // 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      const userData = authUser as AuthUser | null
      console.log('🔄 [认证上下文] 认证状态变化:', { 
        hasUser: !!userData, 
        userId: userData?.id,
        email: userData?.email 
      })
      
      if (userData) {
        // 用户登录，立即更新用户状态，然后加载完整数据
        console.log('✅ [认证上下文] 用户登录，更新状态')
        setUser(userData)
        setLoading(false) // 立即停止loading状态
        
        // 异步加载profile数据
        const profileData = await loadUserData(userData.id)
        if (profileData) {
          console.log('📝 [认证上下文] Profile数据加载完成')
          setProfile(profileData)
          saveToStorage(userData, profileData)
        }
      } else {
        // 用户登出
        console.log('🚪 [认证上下文] 用户登出，清除状态')
        setUser(null)
        setProfile(null)
        clearStorage()
        setLoading(false)
      }
    })

    return () => {
      console.log('🎯 [认证上下文] 取消认证状态监听器')
      subscription.unsubscribe()
    }
  }, [isHydrated, loadUserData])

  // 定期后台验证（每30分钟）
  useEffect(() => {
    if (user) {
      const interval = setInterval(verifyUserInBackground, VERIFICATION_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleSignOut = async () => {
    const { signOut } = await import('@/lib/supabase')
    await signOut()
    setUser(null)
    setProfile(null)
    clearStorage()
  }

  // 使用useMemo缓存context值，避免每次渲染都创建新对象
  const contextValue = useMemo(() => ({
    user, 
    profile, 
    loading, 
    signOut: handleSignOut,
    refreshProfile 
  }), [user, profile, loading, refreshProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 