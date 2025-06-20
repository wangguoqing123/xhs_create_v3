"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Mail, KeyRound, Timer } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useMySQLAuth } from "@/components/mysql-auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const { user, sendVerificationCode, verifyCode } = useMySQLAuth()

  // 组件挂载时的调试信息
  useEffect(() => {
    console.log('🚀 [登录页面] 组件已挂载')
    return () => {
      console.log('🚀 [登录页面] 组件即将卸载')
    }
  }, [])

  useEffect(() => {
    console.log('🔐 [登录页面] 认证状态变化:', { user: !!user, isVerifying })
    if (user && isVerifying) {
      console.log('✅ [登录页面] 用户已登录，准备跳转到首页')
      // 用户已登录且正在验证过程中，跳转到首页
      router.push("/")
    }
  }, [user, isVerifying, router])

  // 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📧 [登录页面] 开始发送验证码:', email)
    if (!email) {
      setError("请输入邮箱地址")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await sendVerificationCode(email)
      console.log('📧 [登录页面] 验证码发送结果:', result)
      if (result.error) {
        setError(result.error || "发送验证码失败")
      } else {
        setIsCodeSent(true)
        setError("")
        console.log('✅ [登录页面] 验证码发送成功')
        // 开始60秒倒计时
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
    } catch (err) {
      console.error('❌ [登录页面] 发送验证码异常:', err)
      setError("发送验证码失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 验证登录
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔑 [登录页面] 开始验证登录:', { email, code: verificationCode })
    if (!verificationCode) {
      setError("请输入验证码")
      return
    }

    setIsLoading(true)
    setIsVerifying(true)
    setError("")

    try {
      const result = await verifyCode(email, verificationCode)
      console.log('🔑 [登录页面] 验证结果:', result)
      
      if (result.error) {
        console.error('❌ [登录页面] 验证失败:', result.error)
        setError(result.error || "验证码错误")
        setIsVerifying(false)
      } else if (result.success) {
        console.log('✅ [登录页面] 验证成功，等待认证状态更新')
        // 验证成功，等待认证状态更新
        setError("")
      } else {
        console.error('❌ [登录页面] 验证返回空数据')
        setError("登录失败，请重试")
        setIsVerifying(false)
      }
    } catch (err) {
      console.error('❌ [登录页面] 验证异常:', err)
      setError("登录失败，请重试")
      setIsVerifying(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 重新发送验证码
  const handleResendCode = () => {
    setIsCodeSent(false)
    setVerificationCode("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300 flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <CardHeader className="text-center pb-8 pt-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
            {isCodeSent ? "输入验证码" : "欢迎回来"}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {isCodeSent ? `验证码已发送至 ${email}` : "登录您的灵感矩阵账户"}
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          {!isCodeSent ? (
            // 第一步：输入邮箱
            <form onSubmit={handleSendCode} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  邮箱地址
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入您的邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 pr-4 text-base border-gray-200 dark:border-slate-600 rounded-2xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Send Code Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? "发送中..." : "发送验证码"}
              </Button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">或者</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  还没有账户？{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                  >
                    立即注册
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            // 第二步：输入验证码
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  验证码
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="请输入6位验证码"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="h-12 pl-12 pr-4 text-base border-gray-200 dark:border-slate-600 rounded-2xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center tracking-widest"
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  {error}
                </div>
              )}
              {isVerifying && !error && (
                <div className="text-green-600 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                  验证成功！正在登录...
                </div>
              )}

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                    <Timer className="h-4 w-4 mr-2" />
                    {countdown}秒后可重新发送
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm"
                  >
                    没收到验证码？重新发送
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                disabled={isLoading || isVerifying}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isVerifying ? "登录中..." : isLoading ? "验证中..." : "验证登录"}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                className="w-full h-12 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                返回修改邮箱
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
