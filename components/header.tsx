"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            灵感矩阵
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-lg"
          >
            功能
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-lg"
          >
            定价
          </Link>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-lg px-6 py-3 h-auto"
            >
              <Link href="/login">登录</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
