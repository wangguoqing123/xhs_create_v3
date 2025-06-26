"use client"

import { useState, Suspense, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { AuthorSearchInterface } from "@/components/author-search-interface"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"
import { SearchStatusPrompt } from "@/components/search-status-prompt"
import { AuthModal } from "@/components/auth-modal"
import { CookieSettingsModal } from "@/components/cookie-settings-modal"
import { useAuthorNotes } from "@/lib/hooks/use-author-notes"
import { useNoteDetail } from "@/lib/hooks/use-note-detail"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { Note, AuthorInfo } from "@/lib/types"
import { useCreditsContext } from "@/components/credits-context"

function AuthorCopyPageContent() {
  const searchParams = useSearchParams()
  const [userProfileUrl, setUserProfileUrl] = useState(searchParams?.get("url") || "")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false) // 登录弹框状态
  const [showCookieModal, setShowCookieModal] = useState(false) // Cookie配置弹框状态
  const [hasSearched, setHasSearched] = useState(false) // 是否已经执行过获取
  
  // 使用认证Hook获取用户信息
  const { user, profile, loading: authLoading } = useMySQLAuth()
  
  // 使用作者笔记获取Hook
  const { 
    authorInfo, 
    authorNotes, 
    isLoading, 
    error, 
    fetchAuthorNotes, 
    clearError 
  } = useAuthorNotes()
  
  // 使用笔记详情Hook
  const { 
    noteDetail, 
    isLoading: isLoadingDetail, 
    error: detailError, 
    fetchNoteDetail, 
    clearError: clearDetailError,
    clearNoteDetail 
  } = useNoteDetail()

  // 初始化时执行获取（如果有URL参数）
  useEffect(() => {
    const url = searchParams?.get("url")
    if (url && url.trim()) {
      console.log('🔍 [作者复制页面] 检测到URL参数，设置作者链接:', url)
      setUserProfileUrl(url)
      
      // 标记已经尝试过获取（用于显示状态提示）
      setHasSearched(true)
      
      // 执行获取，使用默认配置（需要检查登录状态）
      const performInitialFetch = async () => {
        try {
          // 检查用户登录状态
          if (!user) {
            console.log('🔐 [作者复制页面] 初始获取：用户未登录，显示登录提示')
            return
          }
          
          // 检查Cookie配置
          if (!profile?.user_cookie) {
            console.log('🍪 [作者复制页面] 初始获取：Cookie未配置，显示配置提示')
            return
          }
          
          // 执行获取
          await fetchAuthorNotes(url.trim())
          console.log('✅ [作者复制页面] 初始获取完成')
        } catch (error) {
          console.error('❌ [作者复制页面] 初始获取失败:', error)
        }
      }
      
      // 延迟执行获取，确保组件完全初始化和认证状态加载完成
      const timer = setTimeout(performInitialFetch, 200)
      return () => clearTimeout(timer)
    }
  }, [searchParams?.get("url"), user, profile?.user_cookie, fetchAuthorNotes]) // 添加用户和Cookie依赖

  useEffect(() => {
    console.log(`📄 [页面] 作者复制页面组件已挂载`)
    console.timeEnd('页面切换-/author-copy')
  }, [])

  console.log(`🎨 [渲染] 作者复制页面组件正在渲染...`)

  // 处理获取请求
  const handleFetch = useCallback(async (url: string) => {
    if (url.trim()) {
      // 标记已经执行过获取
      setHasSearched(true)
      
      // 检查用户登录状态
      if (!user) {
        console.log('🔐 [作者复制] 用户未登录，显示登录提示')
        return
      }
      
      // 检查Cookie配置
      if (!profile?.user_cookie) {
        console.log('🍪 [作者复制] Cookie未配置，显示配置提示')
        return
      }
      
      // 执行获取
      clearError()
      await fetchAuthorNotes(url.trim())
    }
  }, [clearError, fetchAuthorNotes, user, profile])

  // 获取要显示的笔记列表
  const displayNotes = useMemo(() => {
    return authorNotes.length > 0 ? authorNotes : []
  }, [authorNotes])

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
    console.log('🔐 [作者复制] 打开登录弹框')
    setShowAuthModal(true)
  }, [])

  const handleCloseAuthModal = useCallback(() => {
    console.log('🔐 [作者复制] 关闭登录弹框')
    setShowAuthModal(false)
  }, [])

  // 处理Cookie配置弹框
  const handleOpenCookieModal = useCallback(() => {
    console.log('🍪 [作者复制] 打开Cookie配置弹框')
    setShowCookieModal(true)
  }, [])

  const handleCloseCookieModal = useCallback(() => {
    console.log('🍪 [作者复制] 关闭Cookie配置弹框')
    setShowCookieModal(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 transition-colors duration-300">
      <Header />
      <div className="pt-20">
        {/* 作者搜索界面 */}
        <AuthorSearchInterface
          userProfileUrl={userProfileUrl}
          setUserProfileUrl={setUserProfileUrl}
          authorInfo={authorInfo}
          selectedCount={selectedNotes.length}
          onBatchGenerate={handleBatchGenerate}
          onSearch={handleFetch}
          isLoading={isLoading}
          error={error}
        />

        {/* 状态提示区域 - 在获取后显示 */}
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
          searchKeywords={authorInfo?.nick_name || ''} // 传递作者名称作为关键词
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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
    </div>
  )
}

export default function AuthorCopyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthorCopyPageContent />
    </Suspense>
  )
} 