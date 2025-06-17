"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

// 验证间隔时间（5分钟）
const VERIFICATION_INTERVAL = 5 * 60 * 1000

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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // 从本地存储读取数据
  const loadFromStorage = () => {
    perf.start('本地存储加载')
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
        
        // 开发环境下显示缓存命中信息
        if (process.env.NODE_ENV === 'development') {
          const cacheAge = Math.round((Date.now() - lastVerified) / 1000)
          console.log(`✅ [缓存命中] 使用本地数据，缓存年龄: ${cacheAge}秒`)
        }
        
        return true
      } else {
        // 开发环境下显示缓存过期信息
        if (process.env.NODE_ENV === 'development') {
          const cacheAge = Math.round((Date.now() - lastVerified) / 1000)
          console.log(`⏰ [缓存过期] 缓存年龄: ${cacheAge}秒，需要重新验证`)
        }
      }
    } else {
      // 开发环境下显示缓存未命中信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ [缓存未命中] 本地无有效数据`)
      }
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
  const verifyUserInBackground = async () => {
    try {
      perf.start('后台验证')
      const { user: currentUser } = await getCurrentUser()
      
      if (!currentUser) {
        // 用户已登出，清除本地数据
        setUser(null)
        setProfile(null)
        clearStorage()
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
  }

  // 完整加载用户数据（用于首次登录或验证失败时）
  const loadUserData = async (userId: string) => {
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
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await loadUserData(user.id)
      if (profileData) {
        saveToStorage(user, profileData)
      }
    }
  }

  useEffect(() => {
    // 1. 首先尝试从本地存储加载
    const hasLocalData = loadFromStorage()

    // 2. 如果有本地数据，跳过认证初始化，直接在后台验证
    if (hasLocalData) {
      // 延迟执行后台验证，不阻塞UI
      setTimeout(() => {
        verifyUserInBackground()
      }, 100)
      return
    }

    // 3. 没有本地数据时才执行完整的认证初始化
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

    initializeAuth()

    // 4. 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      const userData = authUser as AuthUser | null
      
      if (userData) {
        // 用户登录，加载完整数据
        const profileData = await loadUserData(userData.id)
        if (profileData) {
          setUser(userData)
          setProfile(profileData)
          saveToStorage(userData, profileData)
        }
      } else {
        // 用户登出
        setUser(null)
        setProfile(null)
        clearStorage()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 定期后台验证（每5分钟）
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut: handleSignOut,
      refreshProfile 
    }}>
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