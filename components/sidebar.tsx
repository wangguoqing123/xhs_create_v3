"use client"

import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Menu, 
  X, 
  Home, 
  RefreshCw, 
  Search, 
  Copy, 
  CreditCard,
  User,
  Lightbulb,
  Edit,
  FileText,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { UserDropdown } from "@/components/user-dropdown"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { CreditsDisplay } from "@/components/credits-display"
import { MembershipInfoCard } from "@/components/membership-info-card"
import { useSidebar } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"

// 导航菜单项配置
const navigationItems = [
  {
    type: "item",
    href: "/account-positioning",
    icon: User,
    label: "账号定位",
    description: "设置账号定位"
  },
  {
    type: "item", 
    href: "/creative-inspiration",
    icon: Lightbulb,
    label: "创作灵感",
    description: "获取创作灵感"
  },
  {
    type: "section",
    label: "文案改写",
    icon: Edit,
    isExpanded: true,
    items: [
      {
        href: "/author-copy",
        icon: Copy,
        label: "作者复刻",
        description: "复制作者风格"
      },
      {
        href: "/rewrite",
        icon: FileText,
        label: "笔记仿写", 
        description: "仿写特定笔记内容"
      },
      {
        href: "/search",
        icon: Search,
        label: "批量生成",
        description: "批量内容生成"
      },
      {
        href: "/note-rewrite",
        icon: RefreshCw,
        label: "爆文改写",
        description: "爆文库改写成特定主题"
      }
    ]
  },
  {
    type: "item",
    href: "/prices",
    icon: CreditCard,
    label: "定价方案",
    description: "查看价格套餐"
  }
]

// 骨架屏组件 - 简洁设计
const UserSkeleton = memo(function UserSkeleton() {
  return (
    <div className="space-y-3">
      {/* 积分区域骨架 - 简洁版本 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 border border-purple-200/50 dark:border-purple-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200/50 dark:bg-slate-700/50 rounded-md animate-pulse"></div>
          <div className="h-4 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse w-16"></div>
        </div>
      </div>
      
      {/* 用户信息骨架 */}
      <div className="flex items-center space-x-3 p-2">
        <div className="w-8 h-8 bg-gray-200/50 dark:bg-slate-700/50 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse w-20"></div>
          <div className="h-2 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse w-24"></div>
        </div>
        <div className="w-4 h-4 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
      </div>
    </div>
  )
})

// 导航项组件
const SidebarNavItem = memo(function SidebarNavItem({ 
  item, 
  isActive, 
  isCollapsed,
  onClick 
}: {
  item: any
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(item.isExpanded || false)
  const pathname = usePathname()
  
  // 如果是分组类型
  if (item.type === "section") {
    const Icon = item.icon
    
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center px-3 py-2 rounded-lg transition-all duration-300",
            "hover:bg-gray-100/80 dark:hover:bg-slate-800/80",
            "text-gray-600 dark:text-gray-400",
            "justify-start"
          )}
        >
          <Icon className={cn(
            "transition-all duration-300",
            "text-gray-500 dark:text-gray-400",
            "h-4 w-4"
          )} />
          
          <span className="ml-3 text-sm font-medium">{item.label}</span>
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
        
        {/* 子项目 */}
        {isExpanded && item.items && (
          <div className="ml-6 space-y-1">
            {item.items.map((subItem: any) => (
              <SidebarNavItem
                key={subItem.href}
                item={{...subItem, type: "item"}}
                isActive={pathname === subItem.href}
                isCollapsed={false}
                onClick={onClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // 普通导航项
  const Icon = item.icon
  
  const handleClick = () => {
    onClick?.()
  }
  
  return (
    <Link
      href={item.href || "#"}
      onClick={handleClick}
      className={cn(
        "group relative flex items-center px-3 py-3 rounded-xl transition-all duration-300",
        "hover:bg-gray-100/80 dark:hover:bg-slate-800/80",
        isActive && "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30",
        isActive && "text-purple-600 dark:text-purple-400",
        !isActive && "text-gray-700 dark:text-gray-300",
        "justify-start",
        "border border-transparent dark:border-transparent hover:border-gray-200/50 dark:hover:border-slate-700/50"
      )}
    >
      {/* 图标 */}
      <Icon className={cn(
        "transition-all duration-300",
        isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400",
        "h-5 w-5"
      )} />
      
      {/* 文字标签 */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.label}</div>
        {item.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
        )}
      </div>
      
      {/* 激活状态指示器 */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"></div>
      )}
    </Link>
  )
})

export const Sidebar = memo(function Sidebar() {
  const [showAuthModal, setShowAuthModal] = useState(false) // 认证弹框状态
  const [isHydrated, setIsHydrated] = useState(false) // 客户端水合状态
  const { user, profile, loading } = useMySQLAuth() // 用户认证状态
  const { isCollapsed, toggleCollapse } = useSidebar() // 侧边栏状态（仅用于移动端）
  const pathname = usePathname() // 当前路径

  // 处理客户端水合
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 打开认证弹框
  const handleAuthModalOpen = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  // 用户区域内容 - 世界级设计
  const userSection = useMemo(() => {
    if (!isHydrated || loading) {
      return (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
          <UserSkeleton />
        </div>
      )
    }
    
    if (user) {
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-gray-200/50 dark:border-slate-700/50 space-y-3">
          {/* 会员状态显示 */}
          {/* <MembershipInfoCard /> */}
          
          {/* 积分显示 - 简洁版本 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 border border-purple-200/50 dark:border-purple-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <CreditsDisplay />
            </div>
          </div>
          
          {/* 用户信息 */}
          <UserDropdown />
        </div>
      )
    }
    
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
        <Button
          onClick={handleAuthModalOpen}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
        >
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>立即登录</span>
          </div>
        </Button>
      </div>
    )
  }, [isHydrated, loading, user, handleAuthModalOpen])

  return (
    <>
      {/* 移动端遮罩层 */}
      {!isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleCollapse}
        />
      )}

      {/* 侧边栏 */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64",
        "bg-white dark:bg-slate-900",
        "border-r border-gray-200/30 dark:border-slate-700/50",
        "transition-all duration-300 ease-in-out",
        "flex flex-col", // 使用flex布局
        // 桌面端：始终固定在左侧
        "lg:translate-x-0",
        // 移动端：使用滑动效果
        !isCollapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "shadow-lg dark:shadow-xl dark:shadow-black/20"
      )}>
        {/* 顶部Logo区域 - 固定高度 */}
        <div className="flex items-center p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
              灵感矩阵
            </span>
          </Link>
        </div>

        {/* 导航菜单 - 可滚动区域 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {navigationItems.map((item, index) => (
            <SidebarNavItem
              key={item.type === "section" ? `section-${index}` : item.href}
              item={item}
              isActive={item.href ? pathname === item.href : false}
              isCollapsed={false}
              onClick={() => {
                // 移动端点击导航项时自动收起侧边栏
                if (window.innerWidth < 1024) {
                  toggleCollapse()
                }
              }}
            />
          ))}
        </nav>

        {/* 底部用户区域 - 固定区域 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-slate-700/50">
          {/* 主题切换 */}
          <div className="flex justify-center mb-4">
            <ThemeToggle variant="sidebar" />
          </div>
          
          {/* 用户区域 - 根据登录状态动态显示 */}
          <div>
            {userSection}
          </div>
        </div>
      </aside>

      {/* 认证弹框 */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}) 