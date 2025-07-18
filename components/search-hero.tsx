"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function SearchHero() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (query.trim()) {
      // 直接跳转到搜索页面，不在首页调用API
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const suggestions = [
    "护肤品种草文案", "美食探店攻略", "旅行分享", "智能录像设备", 
    "读书打卡日记", "健身励志", "穿搭技巧"
  ]

  return (
    <section className="relative pt-16 pb-12">
      <div className="relative max-w-4xl mx-auto text-center">
        {/* 平台标识 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              AI驱动的内容创作平台
            </span>
          </div>
        </div>

        {/* 主标题 */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-purple-700 via-pink-700 to-red-600 bg-clip-text text-transparent">
            灵感矩阵
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          让AI帮你创作出色的内容，从爆文改写到批量生成，释放你的创作潜能
        </p>

        {/* 粉红色色块包含搜索框和关键词 */}
        <div className="relative">
          {/* 粉红色背景色块 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 opacity-20 dark:opacity-30 rounded-3xl"></div>
          
          <div className="relative px-8 py-12">
            {/* 搜索框 */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-600/50 shadow-xl dark:shadow-2xl dark:shadow-black/20">
                  <div className="flex items-center p-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                      <Input
                        type="text"
                        placeholder="输入关键词，开启创作之旅..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-12 text-base pl-12 pr-4 bg-transparent border-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={!query.trim()}
                      className="h-10 px-6 ml-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      立即搜索
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 热门关键词建议 */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">热门关键词</p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion)
                      router.push(`/search?q=${encodeURIComponent(suggestion)}`)
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200 border border-gray-200 dark:border-slate-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
