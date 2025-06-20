"use client"

import { useState } from 'react'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MySQLStatus } from '@/components/mysql-status'

export default function TestMySQLPage() {
  const { user, profile, loading, sendVerificationCode, verifyCode, signOut } = useMySQLAuth()
  
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')

  const handleSendCode = async () => {
    if (!email) {
      setMessage('请输入邮箱地址')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await sendVerificationCode(email)
      
      if (result.success) {
        setMessage('验证码已发送！')
        setStep('code')
        // 开发环境显示验证码
        if (result.code) {
          setGeneratedCode(result.code)
        }
      } else {
        setMessage(result.error || '发送失败')
      }
    } catch (error) {
      setMessage('发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code) {
      setMessage('请输入验证码')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await verifyCode(email, code)
      
      if (result.success) {
        setMessage('登录成功！')
        setStep('email')
        setEmail('')
        setCode('')
        setGeneratedCode('')
      } else {
        setMessage(result.error || '验证失败')
      }
    } catch (error) {
      setMessage('验证失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setStep('email')
    setEmail('')
    setCode('')
    setGeneratedCode('')
    setMessage('已登出')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">MySQL 数据库测试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 数据库状态 */}
          <MySQLStatus />
          
          {/* 用户状态 */}
          <Card>
            <CardHeader>
              <CardTitle>用户状态</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>加载中...</p>
              ) : user ? (
                <div className="space-y-3">
                  <div>
                    <Badge variant="default">已登录</Badge>
                  </div>
                  <div>
                    <Label>用户ID</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.id}</p>
                  </div>
                  <div>
                    <Label>邮箱</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div>
                    <Label>显示名称</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.display_name || '未设置'}</p>
                  </div>
                  {profile && (
                    <div>
                      <Label>积分</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.credits}</p>
                    </div>
                  )}
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    登出
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary">未登录</Badge>
              )}
            </CardContent>
          </Card>
          
          {/* 登录测试 */}
          {!user && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>登录测试</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {step === 'email' ? (
                    <div className="space-y-3">
                      <Label htmlFor="email">邮箱地址</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="输入邮箱地址"
                      />
                      <Button 
                        onClick={handleSendCode} 
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? '发送中...' : '发送验证码'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="code">验证码</Label>
                      <Input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="输入6位验证码"
                        maxLength={6}
                      />
                      {generatedCode && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            开发环境验证码: <strong>{generatedCode}</strong>
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleVerifyCode} 
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? '验证中...' : '验证登录'}
                        </Button>
                        <Button 
                          onClick={() => setStep('email')} 
                          variant="outline"
                        >
                          返回
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {message && (
                    <div className={`p-3 rounded-lg ${
                      message.includes('成功') 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                      <p className="text-sm">{message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 