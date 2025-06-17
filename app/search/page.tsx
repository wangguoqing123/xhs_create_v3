"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SearchInterface } from "@/components/search-interface"
import { NoteGrid } from "@/components/note-grid"
import { BatchConfigModal } from "@/components/batch-config-modal"
import { NoteDetailModal } from "@/components/note-detail-modal"

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

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [sortBy, setSortBy] = useState("relevance")
  const [showBatchModal, setShowBatchModal] = useState(false)

  // 使用真实图片的模拟数据
  const [notes] = useState<Note[]>([
    {
      id: "1",
      title: "超好用的护肤品分享！这些平价好物绝对不踩雷",
      cover: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=400&fit=crop&crop=center",
      author: "美妆小仙女",
      likes: 1234,
      views: 5678,
      content: "今天给大家分享几款超级好用的护肤品，都是我亲测有效的！首先是这款洁面乳...",
      tags: ["护肤", "平价好物", "种草"],
      publishTime: "2024-01-15",
    },
    {
      id: "2",
      title: "职场新人必看！5个让你快速升职的沟通技巧",
      cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=center",
      author: "职场导师Lisa",
      likes: 2341,
      views: 8765,
      content: "在职场中，沟通能力往往比专业技能更重要。今天分享5个实用的沟通技巧...",
      tags: ["职场", "沟通技巧", "升职"],
      publishTime: "2024-01-14",
    },
    {
      id: "3",
      title: "减肥日记Day30｜瘦了20斤的我想告诉你这些真相",
      cover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&crop=center",
      author: "健身达人小王",
      likes: 3456,
      views: 12345,
      content: "经过30天的坚持，我终于瘦了20斤！这期间踩过很多坑，也总结了很多经验...",
      tags: ["减肥", "健身", "励志"],
      publishTime: "2024-01-13",
    },
    {
      id: "4",
      title: "探店｜这家咖啡店的颜值和味道都绝了！",
      cover: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=400&fit=crop&crop=center",
      author: "美食博主小美",
      likes: 987,
      views: 3456,
      content: "今天发现了一家超棒的咖啡店，不仅环境优雅，咖啡也特别香醇...",
      tags: ["美食", "探店", "咖啡"],
      publishTime: "2024-01-12",
    },
    {
      id: "5",
      title: "穿搭分享｜小个子女生的显高秘籍",
      cover: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop&crop=center",
      author: "穿搭达人小雅",
      likes: 2156,
      views: 7890,
      content: "作为一个155的小个子，我总结了一些显高穿搭技巧，希望对大家有帮助...",
      tags: ["穿搭", "小个子", "显高"],
      publishTime: "2024-01-11",
    },
    {
      id: "6",
      title: "旅行攻略｜三天两夜玩转厦门，超详细路线规划",
      cover: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=400&fit=crop&crop=center",
      author: "旅行家小李",
      likes: 1876,
      views: 6543,
      content: "厦门是一个非常适合短途旅行的城市，这次分享我的三天两夜行程安排...",
      tags: ["旅行", "厦门", "攻略"],
      publishTime: "2024-01-10",
    },
  ])

  const handleNoteSelect = (noteId: string, selected: boolean) => {
    if (selected) {
      setSelectedNotes([...selectedNotes, noteId])
    } else {
      setSelectedNotes(selectedNotes.filter((id) => id !== noteId))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      <Header />
      <div className="pt-20">
        {/* Search Interface */}
        <SearchInterface
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedCount={selectedNotes.length}
          onBatchGenerate={() => setShowBatchModal(true)}
        />

        {/* Note Grid */}
        <NoteGrid
          notes={notes}
          selectedNotes={selectedNotes}
          onNoteSelect={handleNoteSelect}
          onNoteView={setSelectedNote}
        />

        {/* Modals */}
        <BatchConfigModal
          open={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          selectedNotes={selectedNotes}
        />

        <NoteDetailModal note={selectedNote} open={!!selectedNote} onClose={() => setSelectedNote(null)} />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
