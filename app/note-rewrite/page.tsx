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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, Filter, X } from "lucide-react"
import type { Note, ExplosiveContent, NoteTrack, NoteType, NoteTone } from "@/lib/types"

export default function NoteRewritePageNew() {
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
    track_id: [] as number[],
    type_id: [] as number[],
    tone_id: [] as number[],
    search: ''
  })
  
  // 类型数据
  const [noteTrackList, setNoteTrackList] = useState<NoteTrack[]>([])
  const [noteTypeList, setNoteTypeList] = useState<NoteType[]>([])
  const [noteToneList, setNoteToneList] = useState<NoteTone[]>([])
  
  // 分页状态
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true,
    total: 0
  })
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
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
      author: content.author_name || '未知作者',
      likes: content.likes_count,
      views: content.likes_count * 5, // 模拟浏览数
      content: content.content,
      tags: content.tags,
      publishTime: content.published_at || content.created_at,
      // 添加分类ID信息
      track_id: content.track_id,
      type_id: content.type_id,
      tone_id: content.tone_id,
      originalData: {
        note_id: content.note_id || content.id,
        note_display_title: content.title,
        note_cover_url_default: content.cover_image || '/placeholder.jpg',
        auther_nick_name: content.author_name || '未知作者',
        note_liked_count: content.likes_count.toString(),
        note_url: content.note_url || '',
        // 其他必需字段的默认值
        auther_avatar: content.author_avatar || '/placeholder-user.jpg',
        auther_home_page_url: '',
        auther_user_id: content.author_id || '',
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

  // 加载类型数据
  const loadTypeData = useCallback(async () => {
    try {
      const [trackRes, typeRes, toneRes] = await Promise.all([
        fetch('/api/explosive-contents/tracks'),
        fetch('/api/explosive-contents/types'), 
        fetch('/api/explosive-contents/tones')
      ])

      if (trackRes.ok) {
        const trackData = await trackRes.json()
        if (trackData.success) setNoteTrackList(trackData.data)
      }

      if (typeRes.ok) {
        const typeData = await typeRes.json()
        if (typeData.success) setNoteTypeList(typeData.data)
      }

      if (toneRes.ok) {
        const toneData = await toneRes.json()
        if (toneData.success) setNoteToneList(toneData.data)
      }
    } catch (error) {
      console.error('加载类型数据失败:', error)
    }
  }, [])

  // 获取爆款内容列表
  const loadExplosiveContents = useCallback(async (isLoadMore = false, customOffset?: number) => {
    if (!user) return
    
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }
    
    try {
      const params = new URLSearchParams()
      
      // 筛选参数
      if (filters.track_id.length > 0) {
        filters.track_id.forEach(id => params.append('track_id', id.toString()))
      }
      if (filters.type_id.length > 0) {
        filters.type_id.forEach(id => params.append('type_id', id.toString()))
      }
      if (filters.tone_id.length > 0) {
        filters.tone_id.forEach(id => params.append('tone_id', id.toString()))
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      
      // 分页参数
      const currentOffset = customOffset !== undefined ? customOffset : (isLoadMore ? pagination.offset : 0)
      params.append('limit', pagination.limit.toString())
      params.append('offset', currentOffset.toString())
      
      const response = await fetch(`/api/explosive-contents?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        if (isLoadMore) {
          // 加载更多：追加数据，去重处理
          setExplosiveContents(prev => {
            const existingIds = new Set(prev.map((item: ExplosiveContent) => item.id))
            const newItems = data.data.filter((item: ExplosiveContent) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
          setPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit,
            hasMore: data.data.length === prev.limit,
            total: data.total || prev.total
          }))
        } else {
          // 首次加载或筛选：替换数据
          setExplosiveContents(data.data)
          setPagination(prev => ({
            ...prev,
            offset: prev.limit,
            hasMore: data.data.length === prev.limit,
            total: data.total || 0
          }))
        }
      } else {
        setError(data.error || '获取爆款内容失败')
      }
    } catch (error) {
      setError('获取爆款内容失败，请稍后重试')
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [user, filters, pagination.limit])

  // 初始化数据
  useEffect(() => {
    loadTypeData()
  }, [loadTypeData])

  // 初始加载数据
  useEffect(() => {
    if (user && profile?.user_cookie) {
      loadExplosiveContents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.user_cookie])

  // 处理筛选
  const handleFilter = useCallback(() => {
    // 重置分页状态
    setPagination(prev => ({
      ...prev,
      offset: 0,
      hasMore: true
    }))
    loadExplosiveContents(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      loadExplosiveContents(true, pagination.offset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.hasMore, isLoadingMore, pagination.offset])

  // 处理标签选择
  const handleTagSelect = useCallback((type: 'track_id' | 'type_id' | 'tone_id', value: number) => {
    setFilters(prev => {
      const currentValues = prev[type]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [type]: newValues
      }
    })
  }, [])

  // 清除所有筛选
  const handleClearFilters = useCallback(() => {
    setFilters({
      track_id: [],
      type_id: [],
      tone_id: [],
      search: ''
    })
    // 重置分页状态
    setPagination(prev => ({
      ...prev,
      offset: 0,
      hasMore: true
    }))
  }, [])

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

  // 计算已选择的筛选项数量
  const selectedFiltersCount = filters.track_id.length + filters.type_id.length + filters.tone_id.length

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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
              {selectedFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedFiltersCount} 个筛选项
                </Badge>
              )}
            </div>
            {selectedFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                清除筛选
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 笔记赛道筛选 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">笔记赛道</Label>
            <div className="flex flex-wrap gap-2">
              {noteTrackList.map((track) => (
                <Badge
                  key={track.id}
                  variant={filters.track_id.includes(track.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleTagSelect('track_id', track.id)}
                >
                  {track.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* 笔记类型筛选 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">笔记类型</Label>
            <div className="flex flex-wrap gap-2">
              {noteTypeList.map((type) => (
                <Badge
                  key={type.id}
                  variant={filters.type_id.includes(type.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleTagSelect('type_id', type.id)}
                >
                  {type.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* 笔记口吻筛选 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">笔记口吻</Label>
            <div className="flex flex-wrap gap-2">
              {noteToneList.map((tone) => (
                <Badge
                  key={tone.id}
                  variant={filters.tone_id.includes(tone.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleTagSelect('tone_id', tone.id)}
                >
                  {tone.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">搜索关键词</Label>
              <Input
                placeholder="搜索标题或内容..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量生成按钮 */}
      {selectedNotes.length > 0 && (
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
            hasMore={pagination.hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            noteTrackList={noteTrackList}
            noteTypeList={noteTypeList}
            noteToneList={noteToneList}
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
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">获取详情失败</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{detailError}</p>
            <Button onClick={handleCloseNoteDetail} variant="outline">
              关闭
            </Button>
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