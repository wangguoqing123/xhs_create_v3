"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SearchInterfaceProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  selectedCount: number
  onBatchGenerate: () => void
}

export function SearchInterface({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedCount,
  onBatchGenerate,
}: SearchInterfaceProps) {
  const handleSearch = () => {
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
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
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 pl-12 pr-4 text-base border-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 排序选择 */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-12 rounded-xl border-gray-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-800 shadow-lg">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">按相关性</SelectItem>
              <SelectItem value="likes">按点赞数</SelectItem>
              <SelectItem value="views">按浏览量</SelectItem>
              <SelectItem value="time">按时间</SelectItem>
            </SelectContent>
          </Select>

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
      </div>
    </div>
  )
}
