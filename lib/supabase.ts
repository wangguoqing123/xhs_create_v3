import { createClient } from '@supabase/supabase-js'
import type { Database, Profile, ProfileUpdate, UserCookie } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 检查环境变量是否已正确配置
const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 认证相关类型定义
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
  }
}

// 发送邮箱验证码
export const sendVerificationCode = async (email: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // 如果用户不存在则自动创建
    },
  })
  
  return { data, error }
}

// 验证邮箱验证码并登录/注册
export const verifyOtpCode = async (email: string, token: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  
  return { data, error }
}

// 获取当前用户
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// 登出
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 监听认证状态变化
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as AuthUser | null)
  })
}

// Profile 相关操作
export const getProfile = async (userId: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

// 更新Profile
export const updateProfile = async (userId: string, updates: ProfileUpdate) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// 更新用户Cookie
export const updateUserCookie = async (userId: string, userCookie: UserCookie) => {
  return updateProfile(userId, { user_cookie: userCookie })
}

// 添加任务索引
export const addTaskIndex = async (userId: string, taskIndex: number) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }

  // 首先获取当前的任务索引
  const { data: profile, error: fetchError } = await getProfile(userId)
  if (fetchError || !profile) {
    return { data: null, error: fetchError }
  }

  const currentIndices = profile.task_indices || []
  const newIndices = [...currentIndices, taskIndex]

  return updateProfile(userId, { task_indices: newIndices })
}

// 移除任务索引
export const removeTaskIndex = async (userId: string, taskIndex: number) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: { message: '请先配置 Supabase 环境变量' } 
    }
  }

  // 首先获取当前的任务索引
  const { data: profile, error: fetchError } = await getProfile(userId)
  if (fetchError || !profile) {
    return { data: null, error: fetchError }
  }

  const currentIndices = profile.task_indices || []
  const newIndices = currentIndices.filter((index: number) => index !== taskIndex)

  return updateProfile(userId, { task_indices: newIndices })
}

// 更新最后登录时间
export const updateLastLogin = async (userId: string) => {
  return updateProfile(userId, { last_login_at: new Date().toISOString() })
} 