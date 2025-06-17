"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { TaskSidebar } from "@/components/task-sidebar"
import { ResultViewer } from "@/components/result-viewer"

interface GeneratedContent {
  id: string
  title: string
  content: string
  status: "generating" | "completed" | "failed"
}

interface Task {
  id: string
  noteTitle: string
  noteCover: string
  status: "generating" | "completed" | "failed"
  results: GeneratedContent[]
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [tasks, setTasks] = useState<Task[]>([])

  // 使用 useMemo 来避免重复计算
  const mockTasks = useMemo(() => {
    const noteIds = searchParams?.get("notes")?.split(",") || []
    const count = Number.parseInt(searchParams?.get("count") || "3")

    return noteIds.map((noteId, index) => ({
      id: `task-${index}`,
      noteTitle: `超好用的护肤品分享！这些平价好物绝对不踩雷`,
      noteCover: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=400&fit=crop&crop=center",
      status: "completed" as const,
      results: Array.from({ length: count }, (_, i) => ({
        id: `result-${index}-${i}`,
        title: [
          "🌟 超全护肤品测评！这些平价好物让你美到发光",
          "💎 护肤界的隐藏宝藏！学生党必备的平价神器",
          "✨ 闭眼入的护肤好物清单，每一款都是真爱推荐",
        ][i],
        content: [
          `姐妹们好呀！今天给大家分享几款我最近在用的护肤品，都是经过我亲测有效的宝藏好物！每一款都有详细的使用感受，绝对不踩雷！

💧 洁面篇
这款氨基酸洁面真的太温和了！敏感肌也能放心使用，洗完脸不紧绷，还有淡淡的香味。价格也很美丽，学生党必备！

🧴 精华篇  
烟酰胺精华真的是我的心头好！坚持用了一个月，毛孔明显细腻了很多，而且提亮效果也很明显。建议晚上使用，白天记得防晒哦～

🧴 面霜篇
这款面霜的质地很轻薄，但保湿效果超级好！即使是油皮用了也不会觉得厚重，而且吸收很快，早晚都可以用。

✨ 使用小贴士：
1. 洁面后先用爽肤水打底
2. 精华要按摩至完全吸收  
3. 面霜要从内向外轻拍
4. 白天一定要做好防晒！

姐妹们有什么想了解的护肤品可以在评论区告诉我，我会继续为大家测评更多好物的！

#护肤品推荐 #平价好物 #护肤心得`,

          `哈喽大家好！作为一个护肤爱好者，今天必须要跟大家分享这几款我回购了无数次的护肤神器！

🌸 清洁力MAX的洁面乳
这款洁面乳真的是我用过最好用的！泡沫丰富细腻，清洁力超强但不刺激，用完皮肤滑滑嫩嫩的，而且价格超级友好！

💫 毛孔救星精华液
说到精华，这款烟酰胺精华必须拥有姓名！我用了两个月，黑头明显减少，毛孔也收缩了不少。重点是不会搓泥，吸收很快！

🌙 夜间修护面霜
晚上护肤的最后一步就靠它了！质地轻盈不厚重，但滋润度刚刚好。早上起来皮肤状态特别好，水润有光泽！

💡 护肤心得分享：
• 选择适合自己肤质的产品最重要
• 坚持使用才能看到效果
• 防晒是护肤的最后一步，千万不能忽略
• 护肤品要循序渐进地添加，不要一次用太多新产品

希望这些分享对大家有帮助！有什么问题欢迎在评论区交流～

#护肤日记 #好物分享 #美妆测评`,

          `小仙女们集合啦！今天要跟大家分享我的护肤心得，这些都是我踩过坑总结出来的经验！

🎯 洁面产品选择指南
氨基酸洁面真的是敏感肌的救星！温和不刺激，清洁力也够，用了这么久皮肤状态越来越稳定。记住，洁面不是越贵越好，适合自己最重要！

🔥 精华使用技巧
烟酰胺精华建议从低浓度开始用，让皮肤有个适应过程。我现在每天晚上用，配合按摩手法，效果真的很明显！

🌟 面霜涂抹方法
很多人面霜都是随便抹抹，其实正确的涂抹方法很重要！要从脸部中央向外轻拍，这样才能更好地吸收。

📝 我的护肤时间表：
早上：洁面 → 爽肤水 → 精华 → 面霜 → 防晒
晚上：卸妆 → 洁面 → 爽肤水 → 精华 → 面霜

坚持这个步骤一个月，皮肤状态真的会有很大改善！最重要的是要有耐心，护肤是一个长期的过程。

大家还想了解什么护肤知识，评论区告诉我哦！

#护肤教程 #护肤步骤 #美肌秘籍`,
        ][i],
        status: "completed" as const,
      })),
    }))
  }, [searchParams])

  // 使用 useEffect 来设置初始状态，添加依赖数组
  useEffect(() => {
    setTasks(mockTasks)
    if (mockTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(mockTasks[0].id)
    }
  }, [mockTasks, selectedTaskId])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-colors duration-300">
      <Header />
      <div className="pt-20 h-screen flex">
        {/* Left Sidebar */}
        <TaskSidebar tasks={tasks} selectedTaskId={selectedTaskId} onTaskSelect={setSelectedTaskId} />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {selectedTask ? (
            <ResultViewer task={selectedTask} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-xl">
              请选择一个任务查看结果
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  )
}
