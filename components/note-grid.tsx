"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Heart, User, Loader2, Search } from "lucide-react"
import Image from "next/image"
import { getProxiedImageUrl, createFastFallbackImageHandler } from "@/lib/image-utils"

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

interface NoteGridProps {
  notes: Note[]
  selectedNotes: string[]
  onNoteSelect: (noteId: string, selected: boolean) => void
  onNoteView: (note: Note) => void
  isLoading?: boolean // 新增加载状态
  error?: string | null // 新增错误状态
  context?: 'search' | 'author-copy' | 'note-rewrite' // 新增：使用场景标识，默认为搜索场景
  // 分页相关属性
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function NoteGrid({ 
  notes, 
  selectedNotes, 
  onNoteSelect, 
  onNoteView, 
  isLoading = false, 
  error, 
  context = 'search',
  hasMore = false,
  isLoadingMore = false,
  onLoadMore
}: NoteGridProps) {
  // 加载状态显示
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">正在搜索小红书笔记...</p>
        </div>
      </div>
    )
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">搜索出错了</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  // 无结果状态显示
  if (notes.length === 0) {
    // 作者复刻场景的空状态
    if (context === 'author-copy') {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center py-12">
            {/* 主标题 */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                开始您的<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">作者复刻</span>之旅
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                三步轻松完成，学习优秀作者的创作技巧，生成您的原创内容
              </p>
            </div>

            {/* 步骤流程图 */}
            <div className="relative max-w-5xl mx-auto">
              {/* 连接线 */}
              <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                <svg className="w-full h-2" viewBox="0 0 400 8" fill="none">
                  <path 
                    d="M0 4 L400 4" 
                    stroke="url(#gradient)" 
                    strokeWidth="2" 
                    strokeDasharray="8,4"
                    className="animate-pulse"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
                {/* 步骤1：输入作者链接 */}
                <div className="relative group">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    {/* 步骤标识 */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    
                    {/* 图标 */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">输入作者链接</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      输入您想要学习的小红书作者主页链接，系统将获取其优质笔记内容
                    </p>
                    
                    {/* 示例链接 */}
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-mono break-all">
                        https://www.xiaohongshu.com/user/profile/xxx
                      </p>
                    </div>
                  </div>
                </div>

                {/* 步骤2：系统抓取作者笔记 */}
                <div className="relative group">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    {/* 步骤标识 */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    
                    {/* 图标 */}
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="relative">
                        <div className="w-8 h-8 border-2 border-pink-600 dark:border-pink-400 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">智能抓取笔记</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      AI系统自动获取该作者的优质笔记，分析其创作风格和内容特点
                    </p>
                    
                    {/* 数据指标 */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-pink-600 dark:text-pink-400">全量</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">笔记获取</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-pink-600 dark:text-pink-400">智能</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">风格分析</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 步骤3：仿写生成原创 */}
                <div className="relative group">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    {/* 步骤标识 */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                    
                    {/* 图标 */}
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="flex">
                        <div className="w-6 h-6 bg-amber-600 dark:bg-amber-400 rounded opacity-80 -mr-2"></div>
                        <div className="w-6 h-6 bg-amber-600 dark:bg-amber-400 rounded opacity-90 -mr-2"></div>
                        <div className="w-6 h-6 bg-amber-600 dark:bg-amber-400 rounded"></div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">仿写生成原创</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      选择优质笔记进行仿写，学习其结构和技巧，生成您的原创内容
                    </p>
                    
                    {/* 成果展示 */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">学习创作技巧</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">保持原创风格</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">提升内容质量</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部CTA */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-full border border-purple-100 dark:border-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">开始在上方输入作者主页链接吧！</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 爆文仿写场景的空状态
    if (context === 'note-rewrite') {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            {/* 主标题 */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                开始您的<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">爆文仿写</span>之旅
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                选择筛选条件，找到优质的行业爆款内容进行仿写
              </p>
            </div>

            {/* 提示信息 */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-8 border border-purple-100 dark:border-slate-600">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">暂无匹配的爆款内容</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    请尝试调整筛选条件，或者清空搜索关键词重新搜索
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300">更换行业分类</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300">调整内容形式</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300">修改搜索关键词</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300">清空所有筛选</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 搜索场景的空状态（原有逻辑）
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          {/* 主标题 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              开始您的<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">爆文创作</span>之旅
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              三步轻松完成，让AI帮您批量生成高质量小红书笔记
            </p>
          </div>

          {/* 步骤流程图 */}
          <div className="relative max-w-5xl mx-auto">
            {/* 连接线 */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
              <svg className="w-full h-2" viewBox="0 0 400 8" fill="none">
                <path 
                  d="M0 4 L400 4" 
                  stroke="url(#gradient)" 
                  strokeWidth="2" 
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
              {/* 步骤1：搜索关键词 */}
              <div className="relative group">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  {/* 步骤标识 */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  
                  {/* 图标 */}
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Search className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">搜索关键词</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    输入您想要创作的领域关键词，如&quot;护肤&quot;、&quot;美食&quot;、&quot;旅行&quot;等
                  </p>
                  
                  {/* 示例关键词 */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['护肤', '美食', '旅行'].map((keyword) => (
                      <span key={keyword} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 步骤2：系统抓取爆款内容 */}
              <div className="relative group">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  {/* 步骤标识 */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  
                  {/* 图标 */}
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-purple-600 dark:border-purple-400 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">智能抓取爆款</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    AI系统自动搜索并筛选出该关键词下的热门爆款笔记内容
                  </p>
                  
                  {/* 数据指标 */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">1000+</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">热门笔记</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">99%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">准确度</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 步骤3：批量生成笔记 */}
              <div className="relative group">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  {/* 步骤标识 */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  
                  {/* 图标 */}
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="flex">
                      <div className="w-6 h-6 bg-pink-600 dark:bg-pink-400 rounded opacity-80 -mr-2"></div>
                      <div className="w-6 h-6 bg-pink-600 dark:bg-pink-400 rounded opacity-90 -mr-2"></div>
                      <div className="w-6 h-6 bg-pink-600 dark:bg-pink-400 rounded"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">批量生成笔记</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    选择心仪的爆款内容，一键批量生成属于您的原创笔记
                  </p>
                  
                  {/* 成果展示 */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">自动标题优化</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">智能内容改写</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">热门标签推荐</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部CTA */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-full border border-purple-100 dark:border-slate-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">开始在上方搜索框输入关键词吧！</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white dark:bg-slate-800 dark:border dark:border-slate-700/50 rounded-2xl shadow-md dark:shadow-lg dark:shadow-black/20"
          >
            <div className="relative">
              {/* Selection Checkbox - 扩大点击区域 */}
              <div 
                className="absolute top-1 left-1 z-10 w-16 h-16 flex items-center justify-center cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation()
                  onNoteSelect(note.id, !selectedNotes.includes(note.id))
                }}
              >
                <div className="w-8 h-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all duration-200 dark:border dark:border-slate-600/50">
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={() => {}} // 空函数，因为点击由父级处理
                    className="w-4 h-4 border-gray-300 dark:border-gray-500 dark:data-[state=checked]:bg-purple-500 dark:data-[state=checked]:border-purple-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Cover Image with 3:4 ratio */}
              <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 rounded-t-2xl overflow-hidden cursor-pointer" onClick={() => onNoteView(note)}>
                <Image
                  src={getProxiedImageUrl(note.cover || "/placeholder.svg")} // 使用代理URL
                  alt={note.title}
                  width={240}
                  height={320}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={createFastFallbackImageHandler(note.cover, "/placeholder.svg")} // 添加快速降级错误处理
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            <CardContent className="p-4 bg-white dark:bg-slate-800" onClick={() => onNoteView(note)}>
              {/* Title */}
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 sm:mb-3 text-sm sm:text-base leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors cursor-pointer">
                {note.title}
              </h3>

              {/* Author and Likes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">{note.author}</span>
                </div>

                <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                  <Heart className="h-3 w-3" />
                  <span className="font-semibold text-xs">{note.likes > 999 ? `${(note.likes/1000).toFixed(1)}k` : note.likes}</span>
                </div>
              </div>
            </CardContent>

            {/* Stats */}
            {/*
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-red-500">
                    <Heart className="h-4 w-4" />
                    <span className="font-semibold">{note.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Eye className="h-4 w-4" />
                    <span className="font-semibold">{note.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            */}

            {/* Tags */}
            {/*
              <div className="flex flex-wrap gap-2">
                {note.tags.slice(0, 2).map((tag, index) => (
                  <Badge
                    key={index}
                    className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
                {note.tags.length > 2 && (
                  <Badge className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0 rounded-full">
                    +{note.tags.length - 2}
                  </Badge>
                )}
              </div>
            */}
          </Card>
        ))}
      </div>
      
      {/* 加载更多区域 */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                加载更多
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* 没有更多数据提示 */}
      {!hasMore && notes.length > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">已加载全部数据</span>
          </div>
        </div>
      )}
    </div>
  )
}
