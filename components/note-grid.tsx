"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, User, Loader2, Search } from "lucide-react"
import Image from "next/image"

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
}

export function NoteGrid({ notes, selectedNotes, onNoteSelect, onNoteView, isLoading = false, error }: NoteGridProps) {
  // 加载状态显示
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无搜索结果</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            请尝试其他关键词，或检查您的网络连接和Cookie配置
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white dark:bg-slate-800 rounded-2xl shadow-md"
          >
            <div className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={(checked) => onNoteSelect(note.id, !!checked)}
                    className="w-4 h-4 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Cover Image with 3:4 ratio */}
              <div className="aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => onNoteView(note)}>
                <Image
                  src={note.cover || "/placeholder.svg"}
                  alt={note.title}
                  width={240}
                  height={320}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            <CardContent className="p-4" onClick={() => onNoteView(note)}>
              {/* Title */}
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-3 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                {note.title}
              </h3>

              {/* Author and Likes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">{note.author}</span>
                </div>

                <div className="flex items-center gap-1 text-red-500">
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
                    className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
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
    </div>
  )
}
