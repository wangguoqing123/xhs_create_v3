"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { MobileMenuButton } from "@/components/mobile-menu-button"
import { cn } from "@/lib/utils"

// 主内容区域组件 - 完全居中显示
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-h-screen">
      {/* 完全居中的容器 */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  )
}

// 布局内容组件
export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 transition-colors duration-300">
      <SidebarProvider>
        {/* 左侧导航栏 */}
        <Sidebar />
        
        {/* 移动端菜单按钮 */}
        <MobileMenuButton />
        
        {/* 主内容区域 - 根据侧边栏状态调整左边距 */}
        <MainContent>
          {children}
        </MainContent>
      </SidebarProvider>
    </div>
  )
} 