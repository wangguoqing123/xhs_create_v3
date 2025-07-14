"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"
import { SearchStatusPrompt } from "@/components/search-status-prompt"
import { AuthModal } from "@/components/auth-modal"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { useNoteDetail } from "@/lib/hooks/use-note-detail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Sparkles, Filter } from "lucide-react"
import type { Note, ExplosiveContent, IndustryType, ContentFormType } from "@/lib/types"
import { INDUSTRY_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/lib/types"

export default function NoteRewritePage() {
  const router = useRouter()
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 爆款内容数据
  const [explosiveContents, setExplosiveContents] = useState<ExplosiveContent[]>([])
  const [filters, setFilters] = useState({
    industry: 'all',
    content_type: 'all',
    search: ''
  })
  
  // 使用认证Hook获取用户信息
  const { user, profile, loading: authLoading } = useMySQLAuth()
  
  // 使用笔记详情Hook
  const { 
    noteDetail, 
    isLoading: isLoadingDetail, 
    error: detailError, 
    fetchNoteDetail, 
    clearError: clearDetailError,
    clearNoteDetail 
  } = useNoteDetail()

  // 将爆款内容转换为Note格式，以便复用现有组件
  const convertedNotes = useMemo(() => {
    return explosiveContents.map((content): Note => ({
      id: content.id,
      title: content.title,
      cover: content.cover_image || '/placeholder.jpg',
      author: content.author || '未知作者',
      likes: content.likes,
      views: content.views,
      content: content.content,
      tags: content.tags,
      publishTime: content.created_at,
      originalData: {
        note_id: content.id,
        note_display_title: content.title,
        note_cover_url_default: content.cover_image || '/placeholder.jpg',
        auther_nick_name: content.author || '未知作者',
        note_liked_count: content.likes.toString(),
        note_url: content.source_urls[0] || '',
        // 其他必需字段的默认值
        auther_avatar: '/placeholder-user.jpg',
        auther_home_page_url: '',
        auther_user_id: '',
        note_card_type: 'normal' as const,
        note_cover_height: '400',
        note_cover_url_pre: content.cover_image || '/placeholder.jpg',
        note_cover_width: '300',
        note_liked: false,
        note_model_type: 'note' as const,
        note_xsec_token: ''
      }
    }))
  }, [explosiveContents])

  // 获取爆款内容列表
  const loadExplosiveContents = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.industry && filters.industry !== 'all') params.append('industry', filters.industry)
      if (filters.content_type && filters.content_type !== 'all') params.append('content_type', filters.content_type)
      if (filters.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/explosive-contents?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setExplosiveContents(data.data)
      } else {
        setError(data.error || '获取爆款内容失败')
      }
    } catch (error) {
      setError('获取爆款内容失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [user, filters])

  // 初始加载数据
  useEffect(() => {
    if (user && profile?.user_cookie) {
      loadExplosiveContents()
    }
  }, [user, profile?.user_cookie, loadExplosiveContents])

  // 处理筛选
  const handleFilter = useCallback(() => {
    loadExplosiveContents()
  }, [loadExplosiveContents])

  // 处理笔记选择（用于批量操作）
  const handleNoteSelect = useCallback((noteId: string, selected: boolean) => {
    if (selected) {
      setSelectedNotes(prev => [...prev, noteId])
    } else {
      setSelectedNotes(prev => prev.filter(id => id !== noteId))
    }
  }, [])

  // 处理查看笔记详情
  const handleNoteView = useCallback(async (note: Note) => {
    setSelectedNoteForDetail(note)

    // 从转换后的数据中获取笔记URL
    const noteUrl = note.originalData?.note_url
    if (!noteUrl) {
      console.error('笔记URL未找到，无法获取详情')
      return
    }

    try {
      clearDetailError()
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

  // 处理批量生成
  const handleBatchGenerate = useCallback(() => {
    if (selectedNotes.length === 0) {
      alert("请先选择要生成的爆款内容")
      return
    }
    setShowBatchModal(true)
  }, [selectedNotes])

  // 关闭批量配置模态框
  const handleCloseBatchModal = useCallback(() => {
    setShowBatchModal(false)
  }, [])

  // 处理登录弹框
  const handleOpenAuthModal = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  return (
    <div className="pt-6 lg:pt-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          小红书各行业<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">爆文仿写</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          精选各行业优质爆款内容，一键仿写生成您的原创文案
        </p>
      </div>

      {/* 筛选器 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>行业分类</Label>
              <Select
                value={filters.industry}
                onValueChange={(value) => setFilters({ ...filters, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择行业" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部行业</SelectItem>
                  {Object.entries(INDUSTRY_OPTIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>内容形式</Label>
              <Select
                value={filters.content_type}
                onValueChange={(value) => setFilters({ ...filters, content_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择形式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部形式</SelectItem>
                  {Object.entries(CONTENT_TYPE_OPTIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>搜索关键词</Label>
              <Input
                placeholder="搜索标题或内容..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} disabled={isLoading} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量生成按钮 */}
      {selectedNotes.length > 0 && user && profile?.user_cookie && (
        <div className="fixed top-20 right-6 z-40">
          <Button
            onClick={handleBatchGenerate}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            批量生成 ({selectedNotes.length})
          </Button>
        </div>
      )}

      {/* 状态提示区域 */}
      {!authLoading && (
        <>
          {/* 未登录提示 */}
          {!user && (
            <SearchStatusPrompt
              type="login"
              onLoginClick={handleOpenAuthModal}
              onCookieClick={handleOpenAuthModal}
            />
          )}
          
          {/* 未配置Cookie提示 */}
          {user && !profile?.user_cookie && (
            <SearchStatusPrompt
              type="cookie"
              onLoginClick={handleOpenAuthModal}
              onCookieClick={handleOpenAuthModal}
            />
          )}
        </>
      )}

      {/* 爆款内容网格 - 只在用户已登录且已配置Cookie时显示 */}
      {user && profile?.user_cookie && (
        <div className="relative">
          <NoteGrid
            notes={convertedNotes}
            selectedNotes={selectedNotes}
            onNoteSelect={handleNoteSelect}
            onNoteView={handleNoteView}
            isLoading={isLoading}
            error={error}
            context="note-rewrite"
          />
        </div>
      )}

      {/* 批量配置模态框 */}
      <BatchConfigModal
        open={showBatchModal}
        onClose={handleCloseBatchModal}
        selectedNotes={selectedNotes}
        searchKeywords="爆款内容仿写" // 传递关键词
        notesData={convertedNotes} // 传递笔记数据
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
    </div>
  )
} 