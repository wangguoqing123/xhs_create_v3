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
  note: NoteDetail | null
  open: boolean
  onClose: () => void
  selectedNotes?: string[]
  onNoteSelect?: (noteId: string, selected: boolean) => void
}

export function NoteDetailModal({ note, open, onClose, selectedNotes = [], onNoteSelect }: NoteDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const contentScrollRef = useRef<HTMLDivElement>(null)

  // 获取图片列表，过滤掉空的图片URL并应用代理
  const images = note?.images && note.images.length > 0 
    ? getProxiedImageUrls(note.images.filter(img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null'))
    : []
  const hasMultipleImages = images.length > 1

  // 当弹框打开时，重置图片索引到第一张
  useEffect(() => {
    if (open && images.length > 0) {
      setCurrentImageIndex(0)
    }
  }, [open, images.length])

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
      <DialogContent 
        className="
          !max-w-6xl !w-[95vw] !h-[95vh] 
          !p-0 !gap-0 !grid-cols-1 
          overflow-hidden 
          bg-white dark:bg-gray-900 
          rounded-2xl border-0 shadow-2xl
          transition-none
        "
      >
        {/* 可访问性标题和描述 */}
        <DialogTitle className="sr-only">笔记详情 - {note.title}</DialogTitle>
        <DialogDescription className="sr-only">
          查看 {note.author} 发布的笔记详情，包含 {images.length} 张图片
        </DialogDescription>
        
        {/* 顶部操作栏 - 最高z-index */}
        <div className="absolute top-4 right-4 z-[100] flex items-center gap-2">
          {/* 多选框 */}
          <div 
            className="w-10 h-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:scale-105 transition-all duration-200" 
            onClick={() => handleCheckboxChange(!isSelected)}
          >
            <Checkbox 
              className="w-4 h-4 border-gray-400 dark:border-gray-500 pointer-events-none" 
              checked={isSelected} 
              onCheckedChange={() => {}}
            />
          </div>
          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-10 h-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 主要内容区域 - 完全自定义布局 */}
        <div className="w-full h-full flex flex-col lg:flex-row">
          {/* 图片展示区域 */}
          <div className="relative bg-gray-900 flex-shrink-0 w-full lg:w-[420px] xl:w-[480px] h-[45vh] lg:h-full">
            {images.length > 0 && images[currentImageIndex] ? (
              <>
                {/* 主图片 */}
                <div className="absolute inset-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <Image 
                      src={images[currentImageIndex]} 
                      alt={`${note.title} - 图片 ${currentImageIndex + 1}`} 
                      width={480}
                      height={400}
                      className="max-w-full max-h-full object-contain" 
                      sizes="(max-width: 1024px) 100vw, 480px"
                      priority={currentImageIndex === 0}
                      onError={(e) => {
                        console.error('图片加载失败:', images[currentImageIndex])
                        const img = e.currentTarget
                        
                        if (img.src.includes('/api/image-proxy') && note?.images?.[currentImageIndex]) {
                          const originalUrl = note.images[currentImageIndex]
                          if (!originalUrl.includes('/api/image-proxy')) {
                            img.src = originalUrl
                            return
                          }
                        }
                        
                        const nextValidIndex = images.findIndex((img, index) => 
                          index > currentImageIndex && img && img.trim() !== ''
                        )
                        if (nextValidIndex !== -1) {
                          setCurrentImageIndex(nextValidIndex)
                          return
                        }
                        
                        if (img.src !== '/placeholder.svg') {
                          img.src = '/placeholder.svg'
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* 图片导航按钮 - 高z-index确保显示 */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="
                        absolute left-3 top-1/2 transform -translate-y-1/2 
                        w-12 h-12 
                        bg-black/60 hover:bg-black/80 
                        text-white rounded-full 
                        flex items-center justify-center 
                        z-[90] 
                        transition-all duration-200 
                        backdrop-blur-sm
                        shadow-lg
                      "
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="
                        absolute right-3 top-1/2 transform -translate-y-1/2 
                        w-12 h-12 
                        bg-black/60 hover:bg-black/80 
                        text-white rounded-full 
                        flex items-center justify-center 
                        z-[90] 
                        transition-all duration-200 
                        backdrop-blur-sm
                        shadow-lg
                      "
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                
                {/* 图片指示器 */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-[90]">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleImageSelect(index)}
                        className={`
                          w-3 h-3 rounded-full transition-all duration-200
                          ${
                            index === currentImageIndex 
                              ? 'bg-white scale-125 shadow-lg' 
                              : 'bg-white/60 hover:bg-white/80'
                          }
                        `}
                      />
                    ))}
                  </div>
                )}

                {/* 图片计数 */}
                {hasMultipleImages && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm backdrop-blur-sm z-[90] shadow-lg">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              // 无图片占位符
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                  <p>暂无图片</p>
                </div>
              </div>
            )}
          </div>

          {/* 内容信息区域 */}
          <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 h-[55vh] lg:h-full flex flex-col">
            {/* 作者信息区域 - 固定高度 */}
            <div className="flex-shrink-0 px-4 py-3 lg:px-6 lg:py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {note.authorAvatar && note.authorAvatar.trim() !== '' ? (
                    <Image
                      src={getProxiedImageUrl(note.authorAvatar)}
                      alt={note.author}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                      onError={createFastFallbackImageHandler(note.authorAvatar, "/placeholder-user.jpg")}
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

            {/* 标题区域 - 固定高度 */}
            <div className="flex-shrink-0 px-4 py-3 lg:px-6 lg:py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                {note.title}
              </h2>
            </div>

            {/* 可滚动内容区域 - 关键修复 */}
            <div className="flex-1 min-h-0 relative">
              <div 
                ref={contentScrollRef}
                className="
                  absolute inset-0 
                  overflow-y-auto 
                  px-4 py-4 lg:px-6 lg:py-5
                  scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent
                "
              >
                {/* 正文内容 */}
                <div className="mb-6">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
                    {/* 按行分割并渲染文本 */}
                    {note.content.split('\n').map((line, index) => (
                      <p key={index} className="break-words">
                        {line.trim() || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 标签区域 */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">话题标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {note.tags && note.tags.length > 0 ? (
                      note.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-0 rounded-full cursor-pointer transition-colors"
                        >
                          #{tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">暂无标签</span>
                    )}
                  </div>
                </div>

                {/* 底部缓冲区 - 确保内容不被数据区域遮挡 */}
                <div className="h-20"></div>
              </div>
            </div>

            {/* 底部数据区域 - 绝对定位固定在底部 */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 lg:px-6 lg:py-4">
              <div className="grid grid-cols-4 gap-2 lg:gap-4">
                {/* 点赞 */}
                <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Heart className={`h-4 w-4 ${note.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  <span className="text-xs font-medium">{note.likeCount?.toLocaleString() || '0'}</span>
                </button>
                
                {/* 收藏 */}
                <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 dark:text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors">
                  <Bookmark className={`h-4 w-4 ${note.isCollected ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  <span className="text-xs font-medium">{note.collectCount?.toLocaleString() || '0'}</span>
                </button>
                
                {/* 评论 */}
                <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">{note.commentCount?.toLocaleString() || '0'}</span>
                </button>
                
                {/* 分享 */}
                <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs font-medium">{note.shareCount?.toLocaleString() || '0'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
