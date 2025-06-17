"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye } from "lucide-react"
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

interface NoteCardProps {
  note: Note
  selected: boolean
  onSelect: (noteId: string, selected: boolean) => void
  onView: (note: Note) => void
}

export function NoteCard({ note, selected, onSelect, onView }: NoteCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative">
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(note.id, !!checked)}
            className="bg-white/80 backdrop-blur-sm"
          />
        </div>
        <div onClick={() => onView(note)}>
          <Image
            src={note.cover || "/placeholder.svg"}
            alt={note.title}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
        </div>
      </div>
      <CardContent className="p-4" onClick={() => onView(note)}>
        <h3 className="font-medium text-sm line-clamp-2 mb-3">{note.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{note.author}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{note.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{note.views}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
