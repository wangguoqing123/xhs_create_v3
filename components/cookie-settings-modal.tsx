"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Cookie, Info, Copy, Check } from 'lucide-react'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { Textarea } from '@/components/ui/textarea'

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
          cookie: cookieValue.trim() || null
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

  // 按钮是否应该被禁用：正在保存中 或 Cookie值为空
  const isButtonDisabled = loading || !cookieValue.trim()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
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
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800 dark:text-purple-300">
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
          <div>
            <Label htmlFor="cookie" className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Cookie 值
            </Label>
            <Textarea
              id="cookie"
              placeholder="请粘贴从浏览器获取的Cookie值..."
              value={cookieValue}
              onChange={(e) => setCookieValue(e.target.value)}
              rows={8}
              className="mt-2 resize-none text-sm font-mono"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              * 请确保Cookie值的完整性，不完整的Cookie可能导致功能异常
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isButtonDisabled}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  保存中...
                </div>
              ) : (
                '保存设置'
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
            >
              取消
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 