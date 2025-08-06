'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Clock, Sparkles } from 'lucide-react'
import type { CreativeInspirationTopic, CreativeInspirationSession } from '@/lib/types'

interface TopicThemesSidebarProps {
  topics: CreativeInspirationTopic[]
  selectedTopic: string | null
  onSelectTopic: (topicId: string) => void
  isAnalyzing: boolean
  historySessions?: CreativeInspirationSession[]
  onSelectHistorySession?: (session: CreativeInspirationSession) => void
  currentSessionId?: string | null
  historyTotal?: number
  onLoadMoreHistory?: () => void
  isLoadingMoreHistory?: boolean
}

export default function TopicThemesSidebar({ 
  topics, 
  selectedTopic, 
  onSelectTopic, 
  isAnalyzing,
  historySessions = [],
  onSelectHistorySession,
  currentSessionId,
  historyTotal = 0,
  onLoadMoreHistory,
  isLoadingMoreHistory = false
}: TopicThemesSidebarProps) {

  // 历史记录下拉状态
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  
  // 生成骨架屏加载状态
  const renderSkeletonCards = useMemo(() => {
    return Array.from({ length: 10 }).map((_, index) => (
      <div 
        key={`skeleton-${index}`}
        className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg dark:shadow-xl dark:shadow-black/20 animate-pulse"
      >
        {/* 头部信息骨架 */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        
        {/* 标题骨架 */}
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded mb-3 w-3/4"></div>
        
        {/* 描述骨架 */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
        
        {/* 关键词骨架 */}
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-12"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-14"></div>
        </div>
      </div>
    ))
  }, [])

  // 生成主题卡片
  const renderTopicCard = useMemo(() => {
    const TopicCard = (topic: CreativeInspirationTopic) => {
      const isSelected = selectedTopic === topic.id
      
      return (
        <div
          key={topic.id}
          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
            isSelected
              ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-900/30 shadow-xl ring-2 ring-purple-200 dark:ring-purple-600 backdrop-blur-sm'
              : 'border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 hover:border-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-900/20 backdrop-blur-sm'
          }`}
          onClick={() => onSelectTopic(topic.id)}
        >
          {/* 标题和热度 */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className={`font-semibold text-base line-clamp-2 flex-1 ${
              isSelected 
                ? 'text-purple-900 dark:text-purple-100' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {topic.title}
            </h3>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className={`text-xs ${
                isSelected 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                🔥
              </span>
              <span className={`text-sm font-semibold ${
                isSelected 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-purple-500 dark:text-purple-400'
              }`}>
                {topic.popularity_score}
              </span>
            </div>
          </div>
          
          {/* 描述 */}
          <p className={`text-sm mb-4 line-clamp-3 leading-relaxed ${
            isSelected 
              ? 'text-purple-700 dark:text-purple-200' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {topic.description}
          </p>
          
          {/* 关键词标签 */}
          <div className="flex flex-wrap gap-1">
            {topic.keywords.slice(0, 4).map((keyword, keywordIndex) => (
              <span
                key={keywordIndex}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  isSelected
                    ? 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {keyword}
              </span>
            ))}
            {topic.keywords.length > 4 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                isSelected
                  ? 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                +{topic.keywords.length - 4}
              </span>
            )}
          </div>
          
          {/* 选中指示器 */}
          {isSelected && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-600">
              <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                <span className="text-sm">✨</span>
                <span className="text-xs font-medium">已选中，点击右侧查看相关内容</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    
    TopicCard.displayName = 'TopicCard'
    return TopicCard
  }, [selectedTopic, onSelectTopic])

  return (
    <div className="w-80 flex-shrink-0">
      {/* 分析中状态 */}
      {isAnalyzing && (
        <>
          <div className="mb-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI分析中...
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              正在生成创作主题，请稍候
            </p>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {renderSkeletonCards}
          </div>
        </>
      )}

      {/* 无主题状态 */}
      {!isAnalyzing && topics.length === 0 && (
        <div className="h-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            暂无选题主题
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
            输入行业关键词开始分析，<br />
            获取AI生成的创作主题
          </p>
        </div>
      )}

      {/* 主题列表 */}
      {!isAnalyzing && topics.length > 0 && (
        <>
          {/* 标题栏 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>选题主题</span>
              </h2>
              <div className="flex items-center space-x-2">
                {/* 主题数量标签 */}
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full shadow-lg">
                  {topics.length}
                </span>
                
                {/* 历史记录切换按钮 */}
                {historySessions.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      <span>历史</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* 历史记录下拉列表 */}
                    {showHistoryDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                        <div className="p-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                            历史分析记录
                          </div>
                          {historySessions.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => {
                                onSelectHistorySession?.(session)
                                setShowHistoryDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                currentSessionId === session.id 
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="font-medium text-sm truncate">
                                {session.industry}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(session.created_at).toLocaleDateString('zh-CN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </button>
                          ))}
                          
                          {/* 加载更多按钮 */}
                          {historySessions.length < historyTotal && (
                            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={() => onLoadMoreHistory?.()}
                                disabled={isLoadingMoreHistory}
                                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoadingMoreHistory ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span>加载中...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>加载更多</span>
                                    <span className="text-xs">({historySessions.length}/{historyTotal})</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              点击主题查看相关创作内容
            </p>
          </div>
          
          {/* 主题卡片列表 */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {topics.map((topic) => renderTopicCard(topic))}
          </div>
          
          {/* 底部提示 */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700/50 backdrop-blur-sm">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center space-x-2 mb-1">
                <span>💡</span>
                <span className="font-semibold">创作提示</span>
              </div>
              <p>选择感兴趣的主题，系统将为您搜索20个相关的热门内容作为创作参考</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}