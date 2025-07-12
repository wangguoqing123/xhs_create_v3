"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { memo, useEffect, useState } from "react"

export const ThemeToggle = memo(function ThemeToggle({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 确保客户端挂载后才显示主题切换按钮
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20"
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
    if (theme === "dark") {
      return <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
    return <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  }

  const getLabel = () => {
    if (theme === "system") {
      return "跟随系统"
    }
    if (theme === "dark") {
      return "深色模式"
    }
    return "浅色模式"
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={cycleTheme}
        className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-full justify-start h-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center space-x-3 w-full">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          {theme === "light" ? (
            <Sun className="h-4 w-4 text-white" />
          ) : (
            <Moon className="h-4 w-4 text-white" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {getLabel()}
        </span>
      </div>
    </Button>
  )
})
