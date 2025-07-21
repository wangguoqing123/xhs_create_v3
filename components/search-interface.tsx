"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, Sparkles, ChevronDown, Check, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { SearchConfig } from "@/lib/types"
import { useCreditsContext } from "@/components/credits-context"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SearchInterfaceProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConfig: SearchConfig // 修改为完整的搜索配置
  onConfigChange: (config: SearchConfig) => void // 配置变化回调
  selectedCount: number
  onBatchGenerate: () => void
  onSearch?: (query: string) => Promise<void> // 新增搜索方法
  isLoading?: boolean // 新增加载状态
  error?: string | null // 新增错误状态
}

export function SearchInterface({
  searchQuery,
  setSearchQuery,
  searchConfig,
  onConfigChange,
  selectedCount,
  onBatchGenerate,
  onSearch,
  isLoading = false,
  error,
}: SearchInterfaceProps) {
  // 筛选面板状态
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [tempConfig, setTempConfig] = useState<SearchConfig>(searchConfig)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 获取积分Context和认证状态
  const { refreshBalance } = useCreditsContext()
  const { user, loading } = useMySQLAuth()
  
  // 使用ref保存refreshBalance函数，避免依赖问题
  const refreshBalanceRef = useRef(refreshBalance)
  refreshBalanceRef.current = refreshBalance

  // 同步外部配置变化
  useEffect(() => {
    setTempConfig(searchConfig)
  }, [searchConfig])

  // 处理筛选应用
  const handleFilterApply = () => {
    onConfigChange(tempConfig)
    setShowFilterPanel(false)
  }

  // 处理搜索
  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 页面焦点时刷新积分（智能检测用户返回）- 只有在用户已登录时才执行
  useEffect(() => {
    // 如果还在加载认证状态或用户未登录，不设置监听器
    if (loading || !user) return

    const handleFocus = () => {
      console.log('🔄 [搜索页面] 页面获得焦点，刷新积分')
      refreshBalanceRef.current()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [搜索页面] 页面变为可见，刷新积分')
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

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* 搜索输入框 - 缩小版 */}
          <div className="flex-1 relative">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
              <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-600/50 shadow-lg dark:shadow-xl dark:shadow-black/20">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="搜索行业关键词，抓取爆文笔记"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSearch()}
                  disabled={isLoading}
                  className="h-10 sm:h-12 pl-12 pr-4 text-sm sm:text-base border-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* 筛选按钮 */}
          <Dialog open={showFilterPanel} onOpenChange={setShowFilterPanel}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 border-gray-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl shadow-md dark:shadow-lg"
              >
                <Filter className="h-5 w-5 mr-2" />
                筛选
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">搜索筛选</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* 笔记类型 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">笔记类型</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { value: 0, label: '全部' },
                      { value: 2, label: '图文' },
                      { value: 1, label: '视频' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTempConfig({ ...tempConfig, noteType: option.value as 0 | 1 | 2 })}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          tempConfig.noteType === option.value
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {tempConfig.noteType === option.value && <Check className="h-3 w-3 inline mr-1" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 查询数量 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">查询数量</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 50, 100, 200].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTempConfig({ ...tempConfig, totalNumber: count })}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          tempConfig.totalNumber === count
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleFilterApply}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    应用筛选
                  </Button>
                  <Button
                    onClick={() => setShowFilterPanel(false)}
                    variant="outline"
                    className="px-6 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 搜索按钮 */}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                搜索中...
              </div>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                搜索
              </>
            )}
          </Button>
        </div>

        {/* 选中数量和批量操作 */}
        {selectedCount > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                已选择 {selectedCount} 篇笔记
              </span>
            </div>
            <Button
              onClick={onBatchGenerate}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              批量生成内容
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
