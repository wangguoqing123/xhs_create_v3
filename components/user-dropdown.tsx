"use client"

import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Coins,
  Clock,
  Mail,
  Calendar,
  List,
  Cookie,
  FileText
} from 'lucide-react'
import { CookieSettingsModal } from '@/components/cookie-settings-modal'
import { LogoutConfirmModal } from '@/components/logout-confirm-modal'
import { useRouter } from 'next/navigation'


export const UserDropdown = memo(function UserDropdown() {
  const { user, profile, signOut } = useMySQLAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showCookieModal, setShowCookieModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // 清理timeout - 必须在早期返回之前调用
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  // 早期返回必须在所有Hooks之后
  if (!user || !profile) return null

  // 检查Cookie是否已设置
  const isCookieConfigured = profile.user_cookie && profile.user_cookie.trim().length > 0

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setIsOpen(true)
  }

  // 处理鼠标离开
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsOpen(false)
    }, 200) // 200ms延迟
    setHoverTimeout(timeout)
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await signOut()
      setShowLogoutModal(false)
      setIsOpen(false)
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleMenuItemClick = (action: string) => {
    setIsOpen(false)
    
    switch (action) {
      case 'results':
        // 跳转到任务结果页面
        router.push('/results')
        break
      case 'rewrite-history':
        // 跳转到改写记录页面
        router.push('/rewrite-history')
        break
      case 'credits-history':
        // 跳转到积分账单页面
        router.push('/credits-history')
        break
      case 'cookies':
        setShowCookieModal(true)
        break
      case 'logout':
        setShowLogoutModal(true)
        break
    }
  }



  return (
    <>
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 用户信息按钮 - 简洁样式 */}
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.display_name || '用户名'}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* 向上展示的下拉菜单 */}
        {isOpen && (
          <div 
            className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-50 py-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* 用户信息头部 */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {profile?.display_name || '用户'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* 菜单项 */}
            <div className="py-1">
              {/* 任务列表 */}
              <button
                onClick={() => handleMenuItemClick('results')}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <List className="h-4 w-4 mr-3" />
                <span className="flex-1 text-left">任务列表</span>
              </button>

              {/* 改写记录 */}
              <button
                onClick={() => handleMenuItemClick('rewrite-history')}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FileText className="h-4 w-4 mr-3" />
                <span className="flex-1 text-left">改写记录</span>
              </button>

              {/* 积分账单 */}
              <button
                onClick={() => handleMenuItemClick('credits-history')}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Coins className="h-4 w-4 mr-3" />
                <span className="flex-1 text-left">积分账单</span>
              </button>

              {/* Cookie设置 */}
              <button
                onClick={() => handleMenuItemClick('cookies')}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Cookie className="h-4 w-4 mr-3" />
                <span className="flex-1 text-left">Cookie设置</span>
                <Badge 
                  variant={isCookieConfigured ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {isCookieConfigured ? '已设置' : '未设置'}
                </Badge>
              </button>

              {/* 分割线 */}
              <div className="my-1 border-t border-gray-200 dark:border-slate-600" />

              {/* 退出登录 */}
              <button
                onClick={() => handleMenuItemClick('logout')}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cookie设置弹框 */}
      <CookieSettingsModal
        open={showCookieModal}
        onClose={() => setShowCookieModal(false)}
      />

      {/* 退出登录确认弹框 */}
      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  )
}) 