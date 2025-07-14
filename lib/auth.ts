import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import type { AuthUser } from './mysql'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = '7d' // JWT令牌有效期

// JWT载荷类型
export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

// 生成JWT令牌
export const generateToken = (user: AuthUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

// 验证JWT令牌
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT验证失败:', error)
    return null
  }
}

// 从请求头中提取令牌
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null
  
  // 支持 "Bearer token" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // 直接返回令牌
  return authHeader
}

// 从cookies中提取令牌
export const extractTokenFromCookies = (cookies: { [key: string]: string }): string | null => {
  return cookies.auth_token || null
}

// 检查JWT密钥是否配置
export const isJWTConfigured = (): boolean => {
  return JWT_SECRET !== 'fallback-secret-key' && JWT_SECRET.length >= 32
}

// 生成随机密钥（用于开发环境）
export const generateRandomSecret = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export default {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  extractTokenFromCookies,
  isJWTConfigured,
  generateRandomSecret
} 