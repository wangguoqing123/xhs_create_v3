"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, Sparkles, ChevronDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { SearchConfig } from "@/lib/types"

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
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [tempConfig, setTempConfig] = useState<SearchConfig>(searchConfig)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // 同步外部配置变化
  useEffect(() => {
    setTempConfig(searchConfig)
  }, [searchConfig])

  // 清理timeout
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  const handleSearch = async () => {
    if (onSearch) {
      await onSearch(searchQuery)
    } else {
      console.log("Searching for:", searchQuery)
    }
  }

  // 应用筛选配置
  const applyFilter = () => {
    onConfigChange(tempConfig)
    setShowFilterPanel(false)
    // 如果有搜索词，重新搜索
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery)
    }
  }

  // 重置临时配置
  const resetTempConfig = () => {
    // 重置为默认配置而不是当前配置
    const defaultConfig: SearchConfig = {
      noteType: 0, // 默认全部类型
      sort: 0, // 默认综合排序
      totalNumber: 20 // 默认20条
    }
    setTempConfig(defaultConfig)
  }

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setShowFilterPanel(true)
  }

  // 处理鼠标离开
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowFilterPanel(false)
    }, 200) // 200ms延迟
    setHoverTimeout(timeout)
  }

  return (
    <div className="sticky top-20 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-6 max-w-4xl mx-auto">
          {/* 搜索输入框 - 缩小版 */}
          <div className="flex-1 relative">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
              <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-600/50 shadow-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="搜索笔记内容、标签或作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSearch()}
                  disabled={isLoading}
                  className="h-12 pl-12 pr-4 text-base border-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* 筛选按钮 */}
          <div className="relative">
            <Button
              variant="outline"
              className="w-32 h-12 rounded-xl border-gray-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              筛选
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {/* 筛选面板 */}
                         {showFilterPanel && (
               <div
                 className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-600/50 shadow-xl z-50 p-6"
                 onMouseEnter={handleMouseEnter}
                 onMouseLeave={handleMouseLeave}
               >
                {/* 综合排序 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">排序依据</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 0, label: '综合' },
                      { value: 1, label: '最新' },
                      { value: 2, label: '最热' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTempConfig({ ...tempConfig, sort: option.value as 0 | 1 | 2 })}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          tempConfig.sort === option.value
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {tempConfig.sort === option.value && <Check className="h-3 w-3 inline mr-1" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 笔记类型 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">笔记类型</h3>
                  <div className="grid grid-cols-3 gap-2">
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
                            ? 'bg-indigo-500 text-white shadow-md'
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
                    {[20, 40, 100, 200].map((number) => (
                      <button
                        key={number}
                        onClick={() => setTempConfig({ ...tempConfig, totalNumber: number })}
                        className={`px-2 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center min-h-[36px] ${
                          tempConfig.totalNumber === number
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          {tempConfig.totalNumber === number && <Check className="h-3 w-3 mb-1" />}
                          <span>{number}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={applyFilter}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg"
                  >
                    确定
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTempConfig}
                    className="px-4 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                    重置
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 批量生成按钮 */}
          <Button
            onClick={onBatchGenerate}
            className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl shadow-lg hover:shadow-xl relative transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            批量生成
            {selectedCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
