"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, X, ChevronLeft, ChevronRight, User, Calendar, MessageCircle, Share2, Bookmark } from "lucide-react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
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

  // 获取图片列表，过滤掉空的图片URL
  const images = note?.images && note.images.length > 0 
    ? note.images.filter(img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null') 
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
      <DialogContent className="max-w-5xl h-[80vh] overflow-hidden p-0 bg-white dark:bg-slate-900 rounded-2xl border-0 z-[999]">
        {/* 隐藏的标题和描述，用于可访问性 */}
        <DialogTitle className="sr-only">笔记详情 - {note.title}</DialogTitle>
        <DialogDescription className="sr-only">
          查看 {note.author} 发布的笔记详情，包含 {images.length} 张图片
        </DialogDescription>
        
        {/* 关闭按钮和多选框 */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <Checkbox 
              className="w-5 h-5 border-gray-300 dark:border-gray-600" 
              checked={isSelected} 
              onCheckedChange={handleCheckboxChange}
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

        <div className="flex h-full">
          {/* 左侧：图片展示区域 - 按3:4比例设置，使用更兼容的方式 */}
          <div className="relative bg-black overflow-hidden flex-shrink-0" style={{ width: '52%', minWidth: '320px', maxWidth: '580px' }}>
            <div className="w-full" style={{ paddingBottom: '133.33%', position: 'relative' }}>
              {images.length > 0 && images[currentImageIndex] ? (
                <>
                  {/* 主图片展示区域 - 保持3:4比例 */}
                  <div className="absolute inset-0 w-full h-full">
                    <Image 
                      src={images[currentImageIndex]} 
                      alt={`${note.title} - 图片 ${currentImageIndex + 1}`} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 768px) 100vw, 52vw"
                      priority={currentImageIndex === 0}
                      onError={(e) => {
                        console.error('图片加载失败:', images[currentImageIndex])
                        // 如果当前图片加载失败，尝试显示下一张有效图片
                        const nextValidIndex = images.findIndex((img, index) => 
                          index > currentImageIndex && img && img.trim() !== ''
                        )
                        if (nextValidIndex !== -1) {
                          setCurrentImageIndex(nextValidIndex)
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

          {/* 右侧：详情内容区域 - 使用更稳定的布局 */}
          <div className="flex-1 bg-white dark:bg-slate-900 min-w-0" style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
            {/* 作者信息区域 */}
            <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-slate-700" style={{ height: '64px' }}>
              <div className="flex items-center gap-3 h-full">
                <div className="relative flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                  {note.authorAvatar && note.authorAvatar.trim() !== '' ? (
                    <Image
                      src={note.authorAvatar}
                      alt={note.author}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                      onError={(e) => {
                        console.error('作者头像加载失败:', note.authorAvatar)
                      }}
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
            <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-slate-700" style={{ minHeight: '48px' }}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight overflow-hidden">
                <span className="line-clamp-2">{note.title}</span>
              </h2>
            </div>

            {/* 正文内容区域 - 可滚动区域 */}
            <div className="flex-1 p-4 border-b border-gray-100 dark:border-slate-700 overflow-y-auto" style={{ minHeight: '200px', maxHeight: '400px' }}>
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>
            </div>

            {/* 标签区域 */}
            <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-slate-700" style={{ maxHeight: '120px' }}>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">话题标签</h3>
              <div className="flex flex-wrap gap-1 overflow-y-auto" style={{ maxHeight: '80px' }}>
                {note.tags && note.tags.length > 0 ? (
                  note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:bg-opacity-40 dark:hover:bg-blue-900 dark:hover:bg-opacity-60 text-blue-700 dark:text-blue-300 rounded-full cursor-pointer transition-colors flex-shrink-0"
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
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-4" style={{ height: '64px' }}>
              {/* 互动按钮 */}
              <div className="grid grid-cols-4 gap-2 h-full">
                <button className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors">
                  <Heart className={`h-4 w-4 ${note.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  <span className="text-xs font-medium">{note.likeCount.toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 rounded-lg transition-colors">
                  <Bookmark className={`h-4 w-4 ${note.isCollected ? 'text-blue-500 fill-blue-500' : ''}`} />
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
