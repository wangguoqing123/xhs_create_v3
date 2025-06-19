"use client"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { memo, useEffect, useState } from "react"

export const ThemeToggle = memo(function ThemeToggle() {
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
      return <Monitor className="h-5 w-5 text-gray-800 dark:text-white" />
    }
    if (theme === "dark") {
      return <Moon className="h-5 w-5 text-gray-800 dark:text-white" />
    }
    return <Sun className="h-5 w-5 text-gray-800 dark:text-white" />
  }

  const getLabel = () => {
    if (theme === "system") {
      return `跟随系统 (当前: ${systemTheme === "dark" ? "暗色" : "明亮"})`
    }
    if (theme === "dark") {
      return "暗色模式"
    }
    return "明亮模式"
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="w-10 h-10 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
})
