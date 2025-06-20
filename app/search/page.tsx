"use client"

import { useState, Suspense, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SearchInterface } from "@/components/search-interface"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"
import { useSearch } from "@/lib/hooks/use-search"
import { useNoteDetail } from "@/lib/hooks/use-note-detail"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { SearchConfig, Note } from "@/lib/types"
import { useCreditsContext } from "@/components/credits-context"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  
  // 使用认证Hook获取用户信息
  const { profile } = useMySQLAuth()
  
  // 使用搜索Hook
  const { searchResults, isLoading, error, searchNotes, clearError } = useSearch()
  
  // 使用笔记详情Hook
  const { 
    noteDetail, 
    isLoading: isLoadingDetail, 
    error: detailError, 
    fetchNoteDetail, 
    clearError: clearDetailError,
    clearNoteDetail 
  } = useNoteDetail()
  
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
      console.log('🔍 [搜索页面] 检测到URL查询参数，开始搜索:', query)
      setSearchQuery(query)
      
      // 执行搜索，使用默认配置
      const performInitialSearch = async () => {
        try {
          await searchNotes(query.trim(), {
            noteType: 0, // 默认全部类型
            sort: 0, // 默认综合排序
            totalNumber: 20 // 默认20条
          })
          console.log('✅ [搜索页面] 初始搜索完成')
        } catch (error) {
          console.error('❌ [搜索页面] 初始搜索失败:', error)
        }
      }
      
      // 延迟执行搜索，确保组件完全初始化
      const timer = setTimeout(performInitialSearch, 100)
      return () => clearTimeout(timer)
    }
  }, [searchParams?.get("q")]) // 只依赖查询参数值，避免函数依赖导致的无限循环

  useEffect(() => {
    console.log(`📄 [页面] 搜索页面组件已挂载`)
    console.timeEnd('页面切换-/search')
  }, [])

  console.log(`🎨 [渲染] 搜索页面组件正在渲染...`)

  // 处理搜索请求
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      clearError()
      await searchNotes(query.trim(), searchConfig)
    }
  }, [searchConfig, clearError, searchNotes])

  // 处理配置变化
  const handleConfigChange = useCallback((newConfig: SearchConfig) => {
    setSearchConfig(newConfig)
    
    // 如果有搜索词，重新搜索
    if (searchQuery.trim()) {
      searchNotes(searchQuery.trim(), newConfig)
    }
  }, [searchQuery, searchNotes])

  // 获取要显示的笔记列表（优先显示搜索结果）
  const displayNotes = useMemo(() => {
    return searchResults.length > 0 ? searchResults : []
  }, [searchResults])

  // 处理笔记选择（用于批量操作）
  const handleNoteSelect = useCallback((noteId: string, selected: boolean) => {
    if (selected) {
      setSelectedNotes(prev => [...prev, noteId])
    } else {
      setSelectedNotes(prev => prev.filter((id) => id !== noteId))
    }
  }, [])

  // 处理查看笔记详情
  const handleNoteView = useCallback(async (note: Note) => {
    // 设置当前选中的笔记
    setSelectedNoteForDetail(note)

    // 从原始数据中获取笔记URL
    const noteUrl = note.originalData?.note_url
    if (!noteUrl) {
      console.error('笔记URL未找到，无法获取详情')
      return
    }

    try {
      // 清除之前的错误
      clearDetailError()
      
      // 获取笔记详情 - API会自动使用用户的Cookie
      await fetchNoteDetail(noteUrl, '')
    } catch (error) {
      console.error('获取笔记详情失败:', error)
    }
  }, [clearDetailError, fetchNoteDetail])

  // 关闭笔记详情模态框
  const handleCloseNoteDetail = useCallback(() => {
    setSelectedNoteForDetail(null)
    clearNoteDetail()
    clearDetailError()
  }, [clearNoteDetail, clearDetailError])

  // 优化内联函数
  const handleBatchGenerate = useCallback(() => {
    setShowBatchModal(true)
  }, [])

  const handleCloseBatchModal = useCallback(() => {
    setShowBatchModal(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      <Header />
      <div className="pt-20">
        {/* 搜索界面 */}
        <SearchInterface
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchConfig={searchConfig}
          onConfigChange={handleConfigChange}
          selectedCount={selectedNotes.length}
          onBatchGenerate={handleBatchGenerate}
          onSearch={handleSearch}
          isLoading={isLoading}
          error={error}
        />

        {/* 笔记网格 */}
        <div className="relative">
          <NoteGrid
            notes={displayNotes}
            selectedNotes={selectedNotes}
            onNoteSelect={handleNoteSelect}
            onNoteView={handleNoteView}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* 批量配置模态框 */}
        <BatchConfigModal
          open={showBatchModal}
          onClose={handleCloseBatchModal}
          selectedNotes={selectedNotes}
          searchKeywords={searchQuery} // 传递搜索关键词
          notesData={displayNotes} // 传递笔记数据
        />

        {/* 笔记详情模态框 */}
        <NoteDetailModal 
          note={noteDetail} 
          open={!!selectedNoteForDetail && !isLoadingDetail} 
          onClose={handleCloseNoteDetail}
          selectedNotes={selectedNotes}
          onNoteSelect={handleNoteSelect}
        />

        {/* 笔记详情加载提示 */}
        {isLoadingDetail && selectedNoteForDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300">正在获取笔记详情...</p>
            </div>
          </div>
        )}

        {/* 笔记详情错误提示 */}
        {detailError && selectedNoteForDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-2">获取详情失败</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{detailError}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleNoteView(selectedNoteForDetail)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  重试
                </button>
                <button
                  onClick={handleCloseNoteDetail}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
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
