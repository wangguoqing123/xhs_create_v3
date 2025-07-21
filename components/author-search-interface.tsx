"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { AuthorInfo } from "@/lib/types"
import { useCreditsContext } from "@/components/credits-context"
import { useMySQLAuth } from "@/components/mysql-auth-context"

interface AuthorSearchInterfaceProps {
  userProfileUrl: string // 作者链接
  setUserProfileUrl: (url: string) => void // 设置作者链接
  authorInfo: AuthorInfo | null // 作者信息
  selectedCount: number // 选中的笔记数量
  onBatchGenerate: () => void // 批量生成回调
  onSearch?: (userProfileUrl: string) => Promise<void> // 搜索方法
  isLoading?: boolean // 加载状态
  error?: string | null // 错误状态
}

export function AuthorSearchInterface({
  userProfileUrl,
  setUserProfileUrl,
  authorInfo,
  selectedCount,
  onBatchGenerate,
  onSearch,
  isLoading = false,
  error,
}: AuthorSearchInterfaceProps) {
  
  // 获取积分Context和认证状态
  const { refreshBalance } = useCreditsContext()
  const { user, loading } = useMySQLAuth()
  
  // 使用ref保存refreshBalance函数，避免依赖问题
  const refreshBalanceRef = useRef(refreshBalance)
  refreshBalanceRef.current = refreshBalance

  // 页面焦点时刷新积分（智能检测用户返回）- 只有在用户已登录时才执行
  useEffect(() => {
    // 如果还在加载认证状态或用户未登录，不设置监听器
    if (loading || !user) return

    const handleFocus = () => {
      console.log('🔄 [作者复制页面] 页面获得焦点，刷新积分')
      refreshBalanceRef.current()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [作者复制页面] 页面变为可见，刷新积分')
        refreshBalanceRef.current()
      }
    }

    // 监听页面焦点和可见性变化
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loading, user]) // 依赖用户登录状态

  const handleSearch = async () => {
    if (onSearch) {
      await onSearch(userProfileUrl)
    } else {
      console.log("获取作者笔记:", userProfileUrl)
    }
  }

  return (
    <>
      {/* 搜索输入框部分 */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* 移动端：垂直布局，桌面端：水平布局 */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6 max-w-4xl mx-auto">
            {/* 作者链接输入框 */}
            <div className="flex-1 relative order-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-600/50 shadow-lg">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="输入小红书作者主页链接"
                    value={userProfileUrl}
                    onChange={(e) => setUserProfileUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSearch()}
                    disabled={isLoading}
                    className="h-12 pl-12 pr-4 text-sm sm:text-base border-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* 按钮组 - 移动端并排显示，桌面端保持原样 */}
            <div className="flex gap-3 lg:gap-4 order-2">
              {/* 搜索按钮 */}
              <Button
                onClick={handleSearch}
                disabled={!userProfileUrl.trim() || isLoading}
                className="flex-1 lg:flex-none h-12 px-4 lg:px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Search className="h-4 w-4 lg:mr-2" />
                <span className="hidden sm:inline">{isLoading ? '获取中...' : '获取笔记'}</span>
                <span className="sm:hidden">{isLoading ? '获取中' : '获取'}</span>
              </Button>

              {/* 批量生成按钮 */}
              <Button
                onClick={onBatchGenerate}
                disabled={selectedCount === 0}
                className="flex-1 lg:flex-none h-12 px-4 lg:px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative"
              >
                <Sparkles className="h-4 w-4 lg:mr-2" />
                <span className="hidden sm:inline">仿写选中笔记</span>
                <span className="sm:hidden">仿写</span>
                {selectedCount > 0 && (
                  <Badge className="ml-1 lg:ml-2 bg-white/20 text-white hover:bg-white/30 border-0 text-xs">
                    {selectedCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-4xl mx-auto">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 作者信息展示 - 非固定，可滚动 */}
      {authorInfo && (
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-600/50 shadow-lg max-w-4xl mx-auto">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* 作者头像 */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
                  <img
                    src={authorInfo.avatar}
                    alt={authorInfo.nick_name}
                    className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-700"
                    onError={(e) => {
                      // 图片加载失败时显示默认头像
                      (e.target as HTMLImageElement).src = '/placeholder-user.jpg'
                    }}
                  />
                </div>
              </div>

              {/* 作者基本信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {authorInfo.nick_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                      小红书号：{authorInfo.red_id}
                    </p>
                    {authorInfo.desc && (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 sm:line-clamp-3">
                        {authorInfo.desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* 统计数据 - 移动端优化布局 */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">粉丝</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {authorInfo.fans}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">关注</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {authorInfo.follows}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                    <span className="text-gray-500 dark:text-gray-400">获赞与收藏</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {authorInfo.interaction}
                    </span>
                  </div>
                  {authorInfo.ip_location && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400">地区</span>
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {authorInfo.ip_location}
                      </span>
                    </div>
                  )}
                </div>

                {/* 标签 */}
                {authorInfo.tags && Array.isArray(authorInfo.tags) && authorInfo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                    {authorInfo.tags.slice(0, 5).map((tag, index) => {
                      // 确保tag是字符串类型，防止渲染对象导致错误
                      let tagText: string
                      if (typeof tag === 'string') {
                        tagText = tag
                      } else if (tag && typeof tag === 'object') {
                        // 如果是对象，尝试提取字符串属性
                        const tagObj = tag as any
                        tagText = tagObj.name || tagObj.text || tagObj.title || String(tag)
                      } else {
                        tagText = String(tag)
                      }
                      
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 max-w-24 sm:max-w-none truncate"
                        >
                          {tagText}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 