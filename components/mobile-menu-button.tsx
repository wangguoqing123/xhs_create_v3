"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"

export function MobileMenuButton() {
  const { isCollapsed, toggleCollapse } = useSidebar() // 获取侧边栏状态

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCollapse}
      className={cn(
        "lg:hidden fixed top-3 sm:top-4 left-4 z-[60] h-10 w-10 p-0",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
        "border border-gray-200/50 dark:border-slate-700/50",
        "hover:bg-gray-100 dark:hover:bg-slate-800",
        "shadow-lg shadow-black/5",
        "transition-all duration-200"
      )}
    >
      <div className="relative w-5 h-5">
        <Menu className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-300",
          isCollapsed ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
        )} />
        <X className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-300",
          !isCollapsed ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
        )} />
      </div>
    </Button>
  )
} 