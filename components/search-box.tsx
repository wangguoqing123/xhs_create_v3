"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

export function SearchBox() {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="输入关键词，开启灵感之旅..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-14 text-lg pl-6 pr-32 rounded-full border-2 border-purple-200 focus:border-purple-400 shadow-lg"
        />
        <Button onClick={handleSearch} className="absolute right-2 h-10 px-6 rounded-full" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>
    </div>
  )
}
