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
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const suggestions = ["护肤品种草文案", "职场成长干货", "减肥励志日记", "美食探店攻略"]

  return (
    <section className="relative pt-32 pb-20 px-6">
      <div className="container mx-auto text-center">
        {/* Main Title */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              灵感矩阵
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              AI创作平台
            </span>
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            让每一个灵感都能裂变成无限可能，AI驱动的内容创作新体验
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/10 dark:to-indigo-400/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-3 border border-gray-200/50 dark:border-slate-600/50 shadow-2xl">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="输入关键词，开启灵感之旅..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-16 text-xl pl-16 pr-8 bg-transparent border-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!query.trim()}
                  className="h-12 px-8 mr-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-lg font-medium shadow-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  开始创作
                </Button>
              </div>
            </div>
          </div>

          {/* Search Suggestions */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion)
                  router.push(`/search?q=${encodeURIComponent(suggestion)}`)
                }}
                className="px-6 py-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-slate-600/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">10K+</div>
            <div className="text-gray-600 dark:text-gray-400 text-lg">创作者信赖</div>
          </div>
          <div className="text-center p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">1M+</div>
            <div className="text-gray-600 dark:text-gray-400 text-lg">内容生成</div>
          </div>
          <div className="text-center p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">99%</div>
            <div className="text-gray-600 dark:text-gray-400 text-lg">满意度</div>
          </div>
        </div>
      </div>
    </section>
  )
}
