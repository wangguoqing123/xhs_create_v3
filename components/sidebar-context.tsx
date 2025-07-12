"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// 侧边栏状态接口
interface SidebarContextType {
  isCollapsed: boolean // 侧边栏是否收起
  toggleCollapse: () => void // 切换收起状态
  setCollapsed: (collapsed: boolean) => void // 设置收起状态
}

// 创建上下文
const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// 侧边栏状态提供者组件
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false) // 默认展开状态

  // 切换收起状态
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev)
  }

  // 设置收起状态
  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }

  // 监听窗口大小变化，在小屏幕上自动收起
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg断点
        setIsCollapsed(true) // 小屏幕自动收起
      } else {
        // 桌面端默认展开
        setIsCollapsed(false)
      }
    }

    // 初始检查
    handleResize()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    // 清理监听器
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const contextValue: SidebarContextType = {
    isCollapsed,
    toggleCollapse,
    setCollapsed
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  )
}

// 使用侧边栏状态的Hook
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
} 