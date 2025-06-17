"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, X } from "lucide-react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"

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

interface NoteDetailModalProps {
  note: Note | null
  open: boolean
  onClose: () => void
}

export function NoteDetailModal({ note, open, onClose }: NoteDetailModalProps) {
  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl h-[600px] overflow-hidden p-0 bg-white dark:bg-slate-900 rounded-3xl border-0">
        {/* Close Button and Checkbox */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <Checkbox className="w-5 h-5 border-gray-300 dark:border-gray-600" />
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

        <div className="grid md:grid-cols-2 h-full">
          {/* Left: Image */}
          <div className="relative h-[600px]">
            <Image src={note.cover || "/placeholder.svg"} alt={note.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Right: Content */}
          <div className="p-6 overflow-y-auto">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight pr-20">{note.title}</h2>

            {/* Author & Stats - 缩小版 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {note.author} · {note.publishTime}
              </div>
            </div>

            {/* Content - 重点突出 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">内容</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{note.content}</p>
              </div>
            </div>

            {/* Tags - 移到后面 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-0 rounded-full"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats - 底部统计 */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-around text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{note.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span className="text-sm">收藏</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm">评论</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
