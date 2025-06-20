"use client"

import { useEffect } from 'react'

// 数据库初始化组件 - 在应用启动时预热MySQL连接池
export function DatabaseInitializer() {
  useEffect(() => {
    // 在客户端挂载后立即预热数据库连接池
    const initializeDatabase = async () => {
      try {
        console.log('🔥 [数据库初始化] 开始预热MySQL连接池...')
        
        // 调用预热API端点
        const response = await fetch('/api/mysql-status', {
          method: 'GET',
          cache: 'no-store' // 确保不缓存请求
        })
        
        const data = await response.json()
        
        if (data.mysql?.status === 'connected') {
          console.log('✅ [数据库初始化] MySQL连接池预热成功')
        } else {
          console.warn('⚠️ [数据库初始化] MySQL连接池预热失败:', data.mysql?.message)
        }
      } catch (error) {
        console.error('❌ [数据库初始化] 预热过程中出错:', error)
      }
    }
    
    // 延迟100ms执行，确保组件完全挂载
    const timer = setTimeout(initializeDatabase, 100)
    
    // 清理定时器
    return () => clearTimeout(timer)
  }, []) // 空依赖数组，只在组件挂载时执行一次
  
  // 这个组件不渲染任何内容
  return null
} 