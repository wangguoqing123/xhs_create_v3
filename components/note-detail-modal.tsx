"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, X, ChevronLeft, ChevronRight, User, Calendar, MessageCircle, Share2, Bookmark } from "lucide-react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useRef } from "react"
import { getProxiedImageUrl, createFastFallbackImageHandler, getProxiedImageUrls } from "@/lib/image-utils"
import { NoteDetail } from "@/lib/types"

interface NoteDetailModalProps {
  note: NoteDetail | null // 使用NoteDetail类型
  open: boolean
  onClose: () => void
  selectedNotes?: string[] // 新增：当前选中的笔记ID列表
  onNoteSelect?: (noteId: string, selected: boolean) => void // 新增：笔记选择回调
}

export function NoteDetailModal({ note, open, onClose, selectedNotes = [], onNoteSelect }: NoteDetailModalProps) {
  // 当前显示的图片索引
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // 控制滚动提示的显示
  const [showScrollHint, setShowScrollHint] = useState(true)
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 获取图片列表，过滤掉空的图片URL并应用代理
  const images = note?.images && note.images.length > 0 
    ? getProxiedImageUrls(note.images.filter(img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null'))
    : []
  const hasMultipleImages = images.length > 1

  // 当弹框打开时，重置图片索引到第一张
  useEffect(() => {
    if (open && images.length > 0) {
      setCurrentImageIndex(0)
      setShowScrollHint(true) // 重置滚动提示
    }
  }, [open, images.length])

  // 监听滚动事件，滚动后隐藏提示
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 10) {
        setShowScrollHint(false)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [open])

  if (!note) return null

  // 检查当前笔记是否被选中
  const isSelected = selectedNotes.includes(note.id)

  // 处理多选框状态变化
  const handleCheckboxChange = (checked: boolean) => {
    if (onNoteSelect) {
      onNoteSelect(note.id, checked)
    }
  }

  // 切换到上一张图片
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  // 切换到下一张图片
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // 切换到指定图片
  const handleImageSelect = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl w-full h-[90vh] sm:h-[80vh] overflow-hidden p-0 bg-white dark:bg-slate-900 rounded-2xl border-0 z-[999] m-2 sm:m-4">
        {/* 隐藏的标题和描述，用于可访问性 */}
        <DialogTitle className="sr-only">笔记详情 - {note.title}</DialogTitle>
        <DialogDescription className="sr-only">
          查看 {note.author} 发布的笔记详情，包含 {images.length} 张图片
        </DialogDescription>
        
        {/* 关闭按钮和多选框 */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <div 
            className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-white dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200" 
            onClick={() => handleCheckboxChange(!isSelected)}
          >
            <Checkbox 
              className="w-5 h-5 border-gray-300 dark:border-gray-600 pointer-events-none" 
              checked={isSelected} 
              onCheckedChange={() => {}} // 空函数，因为点击由父级处理
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row h-full">
          {/* 图片展示区域 - 移动端在上方，桌面端在左侧 */}
          <div className="relative bg-black overflow-hidden flex-shrink-0 w-full sm:w-[52%] h-1/2 sm:h-full" style={{ minWidth: '280px', maxWidth: '580px' }}>
            <div className="w-full h-full sm:h-auto relative sm:pb-[133.33%]">
              {images.length > 0 && images[currentImageIndex] ? (
                <>
                  {/* 主图片展示区域 - 移动端填满容器，桌面端保持3:4比例 */}
                  <div className="absolute inset-0 w-full h-full sm:absolute sm:inset-0">
                    <Image 
                      src={images[currentImageIndex]} 
                      alt={`${note.title} - 图片 ${currentImageIndex + 1}`} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 768px) 100vw, 52vw"
                      priority={currentImageIndex === 0}
                      onError={(e) => {
                        console.error('图片加载失败:', images[currentImageIndex])
                        const img = e.currentTarget
                        
                        // 如果当前显示的是代理URL且失败了，尝试直接访问原图
                        if (img.src.includes('/api/image-proxy') && note?.images?.[currentImageIndex]) {
                          const originalUrl = note.images[currentImageIndex]
                          if (!originalUrl.includes('/api/image-proxy')) {
                            console.log('🔄 [图片加载] 代理失败，尝试直接访问:', originalUrl)
                            img.src = originalUrl
                            return
                          }
                        }
                        
                        // 尝试显示下一张有效图片
                        const nextValidIndex = images.findIndex((img, index) => 
                          index > currentImageIndex && img && img.trim() !== ''
                        )
                        if (nextValidIndex !== -1) {
                          setCurrentImageIndex(nextValidIndex)
                          return
                        }
                        
                        // 最终降级到占位符图片
                        if (img.src !== '/placeholder.svg') {
                          console.log('🔄 [图片加载] 使用占位符图片')
                          img.src = '/placeholder.svg'
                        }
                      }}
                      onLoad={() => {
                        console.log('图片加载成功:', images[currentImageIndex])
                      }}
                    />
                    
                    {/* 图片导航按钮 */}
                    {hasMultipleImages && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 hover:bg-black hover:bg-opacity-50 text-white rounded-full border-0"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 hover:bg-black hover:bg-opacity-50 text-white rounded-full border-0"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}
                    
                    {/* 图片指示器 */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => handleImageSelect(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === currentImageIndex 
                                ? 'bg-white transform scale-110' 
                                : 'bg-white bg-opacity-50 hover:bg-white hover:bg-opacity-75'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* 图片计数显示 */}
                    {hasMultipleImages && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // 无图片时显示占位符
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-8 w-8" />
                    </div>
                    <p>暂无图片</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 信息内容区域 - 移动端在下方，桌面端在右侧 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 bg-white dark:bg-slate-900 min-w-0 w-full sm:w-auto h-1/2 sm:h-full flex flex-col overflow-y-auto sm:overflow-hidden scrollbar-thin relative"
          >
            {/* 移动端滚动提示 - 仅在小屏幕显示且内容需要滚动时显示 */}
            {showScrollHint && (
              <div className="sm:hidden absolute top-1 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800/20 dark:bg-gray-200/20 rounded-full px-2 py-1 backdrop-blur-sm transition-opacity duration-300">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-600 dark:text-gray-300 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                                 <span className="text-xs text-gray-600 dark:text-gray-300">可滚动</span>
               </div>
             </div>
            )}
            {/* 作者信息区域 */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700" style={{ height: '60px' }}>
              <div className="flex items-center gap-3 h-full">
                <div className="relative flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                  {note.authorAvatar && note.authorAvatar.trim() !== '' ? (
                    <Image
                      src={getProxiedImageUrl(note.authorAvatar)} // 使用代理URL
                      alt={note.author}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                      onError={createFastFallbackImageHandler(note.authorAvatar, "/placeholder-user.jpg")} // 添加快速降级错误处理
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{note.author}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{note.createTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 标题区域 */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight overflow-hidden">
                <span className="line-clamp-2 sm:line-clamp-2">{note.title}</span>
              </h2>
            </div>

            {/* 正文内容区域 - 移动端使用父容器滚动，桌面端独立滚动 */}
            <div className="flex-1 sm:flex-1 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700 overflow-visible sm:overflow-y-auto">
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>
            </div>

            {/* 标签区域 */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">话题标签</h3>
              <div className="flex flex-wrap gap-1 overflow-y-auto max-h-16 sm:max-h-20">
                {note.tags && note.tags.length > 0 ? (
                  note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:bg-opacity-40 dark:hover:bg-purple-900 dark:hover:bg-opacity-60 text-purple-700 dark:text-purple-300 rounded-full cursor-pointer transition-colors flex-shrink-0"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">暂无标签</span>
                )}
              </div>
            </div>

            {/* 底部的互动数据区域 */}
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 sm:p-4">
              {/* 互动按钮 */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors">
                  <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${note.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  <span className="text-xs font-medium">{note.likeCount?.toLocaleString() || '0'}</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900 dark:hover:bg-opacity-20 rounded-lg transition-colors">
                  <Bookmark className={`h-4 w-4 ${note.isCollected ? 'text-purple-500 fill-purple-500' : ''}`} />
                  <span className="text-xs font-medium">{note.collectCount.toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">{note.commentCount.toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs font-medium">{note.shareCount.toLocaleString()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
