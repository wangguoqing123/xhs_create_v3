"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, User } from "lucide-react"
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
}

export function NoteGrid({ notes, selectedNotes, onNoteSelect, onNoteView }: NoteGridProps) {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 bg-white dark:bg-slate-800 rounded-3xl shadow-lg"
          >
            <div className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={(checked) => onNoteSelect(note.id, !!checked)}
                    className="w-5 h-5 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Cover Image with 3:4 ratio */}
              <div className="aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => onNoteView(note)}>
                <Image
                  src={note.cover || "/placeholder.svg"}
                  alt={note.title}
                  width={300}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            <CardContent className="p-6" onClick={() => onNoteView(note)}>
              {/* Title */}
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-4 text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                {note.title}
              </h3>

              {/* Author and Likes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{note.author}</span>
                </div>

                <div className="flex items-center gap-1 text-red-500">
                  <Heart className="h-4 w-4" />
                  <span className="font-semibold text-sm">{note.likes.toLocaleString()}</span>
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
