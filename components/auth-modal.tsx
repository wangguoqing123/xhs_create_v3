"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mail, Sparkles, ArrowLeft, Timer } from 'lucide-react'
import { useMySQLAuth } from '@/components/mysql-auth-context'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const { user, sendVerificationCode, verifyCode } = useMySQLAuth()

  // 如果用户已登录，关闭弹框
  if (user && open) {
    onClose()
  }

  // 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      const result = await sendVerificationCode(email)
      if (result.error) {
        setError(result.error)
      } else {
        setStep('verification')
        startCountdown()
      }
    } catch (err) {
      setError('发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 验证验证码
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode.trim()) return

    setLoading(true)
    setError('')

    try {
      const result = await verifyCode(email, verificationCode)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        // 登录/注册成功
        onClose()
        resetForm()
      }
    } catch (err) {
      setError('验证失败，请检查验证码是否正确')
    } finally {
      setLoading(false)
    }
  }

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) return

    setLoading(true)
    setError('')

    try {
      const result = await sendVerificationCode(email)
      if (result.error) {
        setError(result.error)
      } else {
        startCountdown()
      }
    } catch (err) {
      setError('重新发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 开始倒计时
  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 重置表单
  const resetForm = () => {
    setStep('email')
    setEmail('')
    setVerificationCode('')
    setError('')
    setCountdown(0)
  }

  // 返回上一步
  const handleBack = () => {
    setStep('email')
    setVerificationCode('')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {step === 'email' ? '登录/注册' : '验证邮箱'}
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === 'email' 
              ? '输入邮箱，我们将发送验证码给您' 
              : `验证码已发送至 ${email}`
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  邮箱地址
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入您的邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 pr-4 border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? '发送中...' : '发送验证码'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">返回修改邮箱</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  验证码
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-11 text-center text-lg tracking-widest border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {countdown > 0 ? (
                    <span className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {countdown}秒后可重发
                    </span>
                  ) : (
                    '重新发送验证码'
                  )}
                </Button>
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? '验证中...' : '验证并登录'}
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              继续使用即表示您同意我们的{' '}
              <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                用户协议
              </a>{' '}
              和{' '}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                隐私政策
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 