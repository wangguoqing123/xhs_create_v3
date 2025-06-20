"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Cookie, Info, Copy, Check } from 'lucide-react'
import { useMySQLAuth } from '@/components/mysql-auth-context'

interface CookieSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function CookieSettingsModal({ open, onClose }: CookieSettingsModalProps) {
  const { user, profile, refreshProfile } = useMySQLAuth()
  const [cookieValue, setCookieValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // 当弹框打开时，加载当前Cookie
  useEffect(() => {
    if (open && profile?.user_cookie) {
      setCookieValue(profile.user_cookie)
    } else if (open) {
      setCookieValue('')
    }
  }, [open, profile])

  const handleSave = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/update-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCookie: cookieValue.trim() || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '保存Cookie失败')
      } else {
        await refreshProfile() // 刷新用户资料
        onClose()
      }
    } catch (err) {
      setError('保存Cookie失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cookieValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setCookieValue('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Cookie className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Cookie 设置
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            设置您的Cookie用于爬虫接口调用
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 说明信息 */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">如何获取Cookie：</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>打开浏览器开发者工具（F12）</li>
                <li>访问目标网站并登录</li>
                <li>在Network标签页找到请求</li>
                <li>复制请求头中的Cookie值</li>
              </ol>
            </div>
          </div>

          {/* Cookie输入框 */}
          <div className="space-y-3">
            <Label htmlFor="cookie" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Cookie 字符串
            </Label>
            <div className="relative">
              <textarea
                id="cookie"
                placeholder="请粘贴您的Cookie字符串，例如：sessionid=abc123; csrftoken=xyz789; ..."
                value={cookieValue}
                onChange={(e) => setCookieValue(e.target.value)}
                className="w-full h-32 px-4 py-3 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                disabled={loading}
              />
              {cookieValue && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>字符数：{cookieValue.length}</span>
              {cookieValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto p-0 text-xs text-red-500 hover:text-red-700"
                >
                  清空
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border-gray-200 dark:border-slate-600"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? '保存中...' : '保存Cookie'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 