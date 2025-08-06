'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMySQLAuth } from '@/components/mysql-auth-context'
import { useCreditsContext } from '@/components/credits-context'
import { CreditsDisplay } from '@/components/credits-display'
import IndustryInputSection from '@/components/creative-inspiration/IndustryInputSection'
import TopicThemesSidebar from '@/components/creative-inspiration/TopicThemesSidebar'
import { NoteDetailModal } from '@/components/note-detail-modal'
import type { 
  CreativeInspirationSession, 
  CreativeInspirationTopic,
  CreativeInspirationAnalyzeRequest,
  CreativeInspirationResponse,
  Note,
  NoteDetail
} from '@/lib/types'
import { getProxiedImageUrl, createFastFallbackImageHandler } from '@/lib/image-utils'

export default function CreativeInspirationPage() {
  // Context hooks
  const { user, profile, loading: authLoading } = useMySQLAuth()
  const { refreshBalance } = useCreditsContext()

  // 状态管理
  const [currentSession, setCurrentSession] = useState<CreativeInspirationSession | null>(null)
  const [topics, setTopics] = useState<CreativeInspirationTopic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [contentExamples, setContentExamples] = useState<Note[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 笔记详情弹框状态
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null)
  const [showNoteDetail, setShowNoteDetail] = useState(false)
  
  // 历史记录状态
  const [historySessions, setHistorySessions] = useState<CreativeInspirationSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false)

  // 处理行业分析
  const handleAnalyze = useCallback(async (industry: string) => {
    if (isAnalyzing) return
    
    setIsAnalyzing(true)
    setError(null)
    setTopics([])
    setSelectedTopic(null)
    setContentExamples([])
    setCurrentSession(null)

    try {
      console.log('🚀 [创作灵感页面] 开始分析行业:', industry)

      const requestData: CreativeInspirationAnalyzeRequest = {
        industry: industry.trim()
      }

      const response = await fetch('/api/creative-inspiration/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result: CreativeInspirationResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '分析请求失败')
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || '分析结果无效')
      }

      console.log('✅ [创作灵感页面] 分析成功:', result.data)

      // 更新状态
      setCurrentSession(result.data.session || null)
      setTopics(result.data.topics || [])
      
      // 刷新积分余额
      await refreshBalance()

      // 刷新历史记录（新分析完成后）
      await loadHistorySessions(false)

      console.log('✅ [创作灵感页面] 状态更新完成，主题数量:', result.data.topics?.length || 0)

    } catch (error) {
      console.error('❌ [创作灵感页面] 分析失败:', error)
      
      const errorMessage = error instanceof Error ? error.message : '分析失败，请稍后重试'
      setError(errorMessage)
      
      // 如果是积分不足错误，刷新积分余额
      if (errorMessage.includes('积分')) {
        await refreshBalance()
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, refreshBalance])

  // 处理主题选择
  const handleSelectTopic = useCallback(async (topicId: string) => {
    if (isLoadingContent || !topics.length) return
    
    // 如果点击的是已选中的主题，不重复加载
    if (selectedTopic === topicId) return

    setSelectedTopic(topicId)
    setIsLoadingContent(true)
    setContentExamples([])

    try {
      // 找到选中的主题
      const topic = topics.find(t => t.id === topicId)
      if (!topic) {
        throw new Error('主题不存在')
      }

      console.log('🔍 [创作灵感页面] 开始获取主题内容:', topic.title)

      // 使用主题标题作为搜索关键词
      const searchKeyword = topic.title

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: searchKeyword,
          config: {
            noteType: 0,  // 全部类型
            sort: 0,      // 综合排序
            totalNumber: 20
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取内容失败')
      }

      if (!result.success || !result.data) {
        throw new Error('获取内容结果无效')
      }

      console.log('✅ [创作灵感页面] 内容获取成功，数量:', result.data.length)
      setContentExamples(result.data)

    } catch (error) {
      console.error('❌ [创作灵感页面] 获取内容失败:', error)
      
      // 内容获取失败时不显示全局错误，只在内容区域显示
      setContentExamples([])
    } finally {
      setIsLoadingContent(false)
    }
  }, [isLoadingContent, selectedTopic, topics])

  // 处理点击笔记查看详情
  const handleNoteClick = useCallback(async (note: Note) => {
    try {
      // 从原始数据中获取笔记URL
      const noteUrl = note.originalData?.note_url
      
      if (!noteUrl) {
        console.error('笔记URL不存在:', note)
        return
      }

      // 获取笔记详情
      const response = await fetch('/api/note-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteUrl: noteUrl
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取笔记详情失败')
      }

      if (result.success && result.data) {
        setSelectedNote(result.data)
        setShowNoteDetail(true)
      }
    } catch (error) {
      console.error('获取笔记详情失败:', error)
    }
  }, [])

  // 关闭笔记详情弹框
  const handleCloseNoteDetail = useCallback(() => {
    setShowNoteDetail(false)
    setSelectedNote(null)
  }, [])

  // 加载历史记录
  const loadHistorySessions = useCallback(async (isLoadMore = false) => {
    if (!profile?.id || isLoadingHistory || isLoadingMoreHistory) return

    if (isLoadMore) {
      setIsLoadingMoreHistory(true)
    } else {
      setIsLoadingHistory(true)
      setHistoryOffset(0)
    }

    const currentOffset = isLoadMore ? historyOffset : 0

    try {
      const response = await fetch('/api/creative-inspiration/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: profile.id,
          limit: 20,
          offset: currentOffset,
          status: 'completed'
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const newSessions = result.data.sessions || []
        const total = result.data.total || 0
        
        if (isLoadMore) {
          // 加载更多时追加数据
          setHistorySessions(prev => [...prev, ...newSessions])
          setHistoryOffset(prev => prev + 20)
        } else {
          // 首次加载时替换数据
          setHistorySessions(newSessions)
          setHistoryOffset(20)
          
          // 如果没有当前会话且有历史记录，自动加载最新的一条
          if (!currentSession && newSessions.length > 0) {
            const latestSession = newSessions[0] // 历史记录按创建时间倒序，第一条是最新的
            handleSelectHistorySession(latestSession)
          }
        }
        
        setHistoryTotal(total)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreHistory(false)
      } else {
        setIsLoadingHistory(false)
      }
    }
  }, [profile?.id]) // 简化依赖项

  // 处理历史会话选择
  const handleSelectHistorySession = useCallback(async (session: CreativeInspirationSession) => {
    try {
      // 获取历史会话的主题
      const response = await fetch('/api/creative-inspiration/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 更新当前会话和主题
        setCurrentSession(session)
        setTopics(result.data || [])
        setSelectedTopic(null)
        setContentExamples([])
      }
    } catch (error) {
      console.error('加载历史会话主题失败:', error)
    }
  }, [])

  // 加载更多历史记录
  const loadMoreHistory = useCallback(async () => {
    await loadHistorySessions(true)
  }, [loadHistorySessions])

  // 页面加载时获取历史记录
  useEffect(() => {
    if (profile?.id && !isLoadingHistory) {
      loadHistorySessions()
    }
  }, [profile?.id]) // 移除 loadHistorySessions 依赖，避免无限循环

  // 检查用户是否已登录
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            请先登录
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            使用创作灵感功能需要先登录您的账户
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/10 dark:bg-pink-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-300/5 to-pink-300/5 dark:from-purple-500/5 dark:to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">


        {/* 顶部输入区域 */}
        <IndustryInputSection 
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          error={error}
        />
        
        {/* 主要内容区域 */}
        <div className="flex gap-6 mt-8">
          {/* 左侧选题主题侧边栏 */}
          <TopicThemesSidebar
            topics={topics}
            selectedTopic={selectedTopic}
            onSelectTopic={handleSelectTopic}
            isAnalyzing={isAnalyzing}
            historySessions={historySessions}
            onSelectHistorySession={handleSelectHistorySession}
            currentSessionId={currentSession?.id}
            historyTotal={historyTotal}
            onLoadMoreHistory={loadMoreHistory}
            isLoadingMoreHistory={isLoadingMoreHistory}
          />
          
          {/* 右侧内容示例面板 */}
          <div className="flex-1 min-h-[600px]">
            {/* 分析中状态 - 右侧骨架屏 */}
            {isAnalyzing && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl dark:shadow-black/20 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI正在分析中...
                  </h3>
                </div>
                
                {/* 内容卡片骨架屏 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 animate-pulse">
                      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 未选择主题状态 */}
            {!selectedTopic && !isAnalyzing && topics.length === 0 && (
              <div className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">💭</div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    开始你的创作之旅
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    输入行业关键词，获取AI智能分析的创作主题
                  </p>
                  {historySessions.length > 0 && (
                    <p className="text-sm text-blue-500 dark:text-blue-400">
                      或者从左侧历史记录中选择之前的分析结果
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 内容加载中状态 */}
            {selectedTopic && isLoadingContent && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl dark:shadow-black/20 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    正在获取相关内容...
                  </h3>
                </div>
                
                {/* 内容卡片骨架屏 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 animate-pulse">
                      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 内容示例展示 */}
            {selectedTopic && !isLoadingContent && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl dark:shadow-black/20 p-6">
                {/* 标题栏 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    📚 相关内容示例
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contentExamples.length > 0 
                      ? `找到 ${contentExamples.length} 个相关内容，点击查看详情` 
                      : '暂无相关内容'}
                  </p>
                </div>

                {/* 内容网格 */}
                {contentExamples.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {contentExamples.map((note, index) => (
                      <div 
                        key={note.id || index}
                        onClick={() => handleNoteClick(note)}
                        className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                      >
                        {/* 封面图 */}
                        {note.cover && (
                          <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                            <img 
                              src={getProxiedImageUrl(note.cover)} 
                              alt={note.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={createFastFallbackImageHandler(note.cover)}
                            />
                          </div>
                        )}
                        
                        {/* 标题 */}
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {note.title}
                        </h4>
                        
                        {/* 作者和数据 */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="truncate">{note.author}</span>
                          <div className="flex items-center space-x-2">
                            <span>❤️ {note.likes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-500 dark:text-gray-400">
                      暂无相关内容，请尝试选择其他主题
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 笔记详情弹框 */}
      <NoteDetailModal
        note={selectedNote}
        open={showNoteDetail}
        onClose={handleCloseNoteDetail}
      />
    </div>
  )
} 