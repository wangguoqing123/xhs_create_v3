"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking')

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (
      supabaseUrl && 
      supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here'
    ) {
      setStatus('configured')
    } else {
      setStatus('not-configured')
    }
  }, [])

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          icon: AlertCircle,
          color: 'bg-yellow-100 text-yellow-800',
          text: '检查中...',
          description: '正在检查 Supabase 配置状态'
        }
      case 'configured':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800',
          text: '已配置',
          description: 'Supabase 已正确配置，可以使用认证功能'
        }
      case 'not-configured':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          text: '未配置',
          description: '请在 .env.local 文件中配置 Supabase 环境变量'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          Supabase 状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={statusInfo.color}>
            {statusInfo.text}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {statusInfo.description}
        </p>
        {status === 'not-configured' && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              请在 .env.local 文件中添加：
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block">
              NEXT_PUBLIC_SUPABASE_URL=your_project_url<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 