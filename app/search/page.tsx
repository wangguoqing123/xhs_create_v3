"use client"

import { useState, Suspense, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { SearchInterface } from "@/components/search-interface"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"
import { SearchStatusPrompt } from "@/components/search-status-prompt"
import { AuthModal } from "@/components/auth-modal"
import { CookieSettingsModal } from "@/components/cookie-settings-modal"
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
  const [showAuthModal, setShowAuthModal] = useState(false) // 登录弹框状态
  const [showCookieModal, setShowCookieModal] = useState(false) // Cookie配置弹框状态
  const [hasSearched, setHasSearched] = useState(false) // 是否已经执行过搜索
  
  // 使用认证Hook获取用户信息
  const { user, profile, loading: authLoading } = useMySQLAuth()
  
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
      console.log('🔍 [搜索页面] 检测到URL查询参数，设置搜索词:', query)
      setSearchQuery(query)
      
      // 标记已经尝试过搜索（用于显示状态提示）
      setHasSearched(true)
      
      // 执行搜索，使用默认配置（需要检查登录状态）
      const performInitialSearch = async () => {
        try {
          // 检查用户登录状态
          if (!user) {
            console.log('🔐 [搜索页面] 初始搜索：用户未登录，显示登录提示')
            return
          }
          
          // 检查Cookie配置
          if (!profile?.user_cookie) {
            console.log('🍪 [搜索页面] 初始搜索：Cookie未配置，显示配置提示')
            return
          }
          
          // 执行搜索
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
      
      // 延迟执行搜索，确保组件完全初始化和认证状态加载完成
      const timer = setTimeout(performInitialSearch, 200)
      return () => clearTimeout(timer)
    }
  }, [searchParams?.get("q"), user, profile?.user_cookie]) // 添加用户和Cookie依赖

  useEffect(() => {
    console.log(`📄 [页面] 搜索页面组件已挂载`)
    console.timeEnd('页面切换-/search')
  }, [])

  console.log(`🎨 [渲染] 搜索页面组件正在渲染...`)

  // 处理搜索请求
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      // 标记已经执行过搜索
      setHasSearched(true)
      
      // 检查用户登录状态
      if (!user) {
        console.log('🔐 [搜索] 用户未登录，显示登录提示')
        return
      }
      
      // 检查Cookie配置
      if (!profile?.user_cookie) {
        console.log('🍪 [搜索] Cookie未配置，显示配置提示')
        return
      }
      
      // 执行搜索
      clearError()
      await searchNotes(query.trim(), searchConfig)
    }
  }, [searchConfig, clearError, searchNotes, user, profile])

  // 处理配置变化
  const handleConfigChange = useCallback((newConfig: SearchConfig) => {
    setSearchConfig(newConfig)
    
    // 如果有搜索词且用户已登录且已配置Cookie，重新搜索
    if (searchQuery.trim() && user && profile?.user_cookie) {
      searchNotes(searchQuery.trim(), newConfig)
    }
  }, [searchQuery, searchNotes, user, profile])

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

  // 处理登录弹框
  const handleOpenAuthModal = useCallback(() => {
    console.log('🔐 [搜索] 打开登录弹框')
    setShowAuthModal(true)
  }, [])

  const handleCloseAuthModal = useCallback(() => {
    console.log('🔐 [搜索] 关闭登录弹框')
    setShowAuthModal(false)
  }, [])

  // 处理Cookie配置弹框
  const handleOpenCookieModal = useCallback(() => {
    console.log('🍪 [搜索] 打开Cookie配置弹框')
    setShowCookieModal(true)
  }, [])

  const handleCloseCookieModal = useCallback(() => {
    console.log('🍪 [搜索] 关闭Cookie配置弹框')
    setShowCookieModal(false)
  }, [])

  return (
    <div className="pt-6 lg:pt-6">
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

      {/* 状态提示区域 - 在搜索后显示 */}
      {hasSearched && !authLoading && (
        <>
          {/* 未登录提示 */}
          {!user && (
            <SearchStatusPrompt
              type="login"
              onLoginClick={handleOpenAuthModal}
              onCookieClick={handleOpenCookieModal}
            />
          )}
          
          {/* 未配置Cookie提示 */}
          {user && !profile?.user_cookie && (
            <SearchStatusPrompt
              type="cookie"
              onLoginClick={handleOpenCookieModal}
              onCookieClick={handleOpenCookieModal}
            />
          )}
        </>
      )}

      {/* 笔记网格 - 只在用户已登录且已配置Cookie时显示 */}
      {user && profile?.user_cookie && (
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
      )}

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
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            {/* 错误图标和标题 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                {detailError.includes('Cookie') ? (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {detailError.includes('Cookie') ? 'Cookie已过期' : '获取详情失败'}
                </h3>
                {detailError.includes('Cookie') && (
                  <p className="text-sm text-blue-600">需要重新设置Cookie</p>
                )}
              </div>
            </div>

            {/* 错误详情和建议 */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                {detailError}
              </p>
              
              {/* 根据错误类型显示建议 */}
              {detailError.includes('Cookie') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">解决方案：</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• 点击右上角头像，选择&quot;Cookie设置&quot;</li>
                    <li>• 重新获取小红书Cookie并设置</li>
                    <li>• 确保Cookie格式正确且完整</li>
                    <li>• 保存后重新尝试获取笔记详情</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseNoteDetail}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => handleNoteView(selectedNoteForDetail)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 登录弹框 */}
      <AuthModal
        open={showAuthModal}
        onClose={handleCloseAuthModal}
      />

      {/* Cookie配置弹框 */}
      <CookieSettingsModal
        open={showCookieModal}
        onClose={handleCloseCookieModal}
      />
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
