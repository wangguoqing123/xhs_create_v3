"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SearchInterface } from "@/components/search-interface"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"
import { useSearch } from "@/lib/hooks/use-search"
import { SearchConfig } from "@/lib/types"

interface Note {
  id: string
  title: string
  cover: string
  author: string
  likes: number
  views: number
  content: string
  tags: string[]
  publishTime: string
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  
  // 使用搜索Hook
  const { searchResults, isLoading, error, searchNotes, clearError } = useSearch()
  
  // 搜索配置状态
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    noteType: 0, // 默认全部类型
    sort: 0, // 默认综合排序
    totalNumber: 20 // 默认20条
  })

  // 初始化时执行搜索（如果有查询参数）
  useEffect(() => {
    const query = searchParams?.get("q")
    if (query && query.trim()) {
      setSearchQuery(query)
      // 执行搜索，使用默认配置
      searchNotes(query.trim(), {
        noteType: 0, // 默认全部类型
        sort: 0, // 默认综合排序
        totalNumber: 20 // 默认20条
      })
    }
  }, [searchParams, searchNotes]) // 移除searchConfig依赖，避免重复搜索

  // 处理搜索请求
  const handleSearch = async (query: string) => {
    if (query.trim()) {
      clearError()
      await searchNotes(query.trim(), searchConfig)
    }
  }

  // 处理配置变化
  const handleConfigChange = (newConfig: SearchConfig) => {
    setSearchConfig(newConfig)
    
    // 如果有搜索词，重新搜索
    if (searchQuery.trim()) {
      searchNotes(searchQuery.trim(), newConfig)
    }
  }

  // 获取要显示的笔记列表（优先显示搜索结果）
  const displayNotes = searchResults.length > 0 ? searchResults : []

  const handleNoteSelect = (noteId: string, selected: boolean) => {
    if (selected) {
      setSelectedNotes([...selectedNotes, noteId])
    } else {
      setSelectedNotes(selectedNotes.filter((id) => id !== noteId))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      <Header />
      <div className="pt-20">
        {/* Search Interface */}
        <SearchInterface
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchConfig={searchConfig}
          onConfigChange={handleConfigChange}
          selectedCount={selectedNotes.length}
          onBatchGenerate={() => setShowBatchModal(true)}
          onSearch={handleSearch}
          isLoading={isLoading}
          error={error}
        />

        {/* Note Grid */}
        <div className="relative">
          <NoteGrid
            notes={displayNotes}
            selectedNotes={selectedNotes}
            onNoteSelect={handleNoteSelect}
            onNoteView={setSelectedNote}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Modals */}
        <BatchConfigModal
          open={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          selectedNotes={selectedNotes}
        />

        <NoteDetailModal note={selectedNote} open={!!selectedNote} onClose={() => setSelectedNote(null)} />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
