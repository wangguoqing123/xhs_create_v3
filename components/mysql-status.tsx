"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react'

export function MySQLStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    checkMySQLStatus()
  }, [])

  const checkMySQLStatus = async () => {
    try {
      const response = await fetch('/api/mysql-status')
      const data = await response.json()
      
      if (data.success) {
        setStatus('connected')
      } else if (data.error === '请先配置 MySQL 环境变量') {
        setStatus('not-configured')
      } else {
        setStatus('error')
        setErrorMessage(data.error || '连接失败')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('无法检查数据库状态')
    }
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          icon: AlertCircle,
          color: 'bg-yellow-100 text-yellow-800',
          text: '检查中...',
          description: '正在检查 MySQL 数据库连接状态'
        }
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800',
          text: '已连接',
          description: 'MySQL 数据库连接正常，可以使用所有功能'
        }
      case 'not-configured':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          text: '未配置',
          description: '请在 .env.local 文件中配置 MySQL 数据库连接信息'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          text: '连接失败',
          description: errorMessage || '数据库连接失败，请检查配置'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          MySQL 数据库状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
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
              DB_HOST=your-rds-host.mysql.rds.aliyuncs.com<br />
              DB_USER=app_user<br />
              DB_PASSWORD=your-password<br />
              DB_NAME=xhs_create_v3
            </code>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">
              错误详情: {errorMessage}
            </p>
          </div>
        )}
        {status === 'connected' && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">
              🎉 数据库连接成功！使用阿里云RDS MySQL Serverless
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 