"use client"

import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { UserDropdown } from "@/components/user-dropdown"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { CreditsDisplay } from "@/components/credits-display"

// 骨架屏组件 - 使用memo优化
const UserSkeleton = memo(function UserSkeleton() {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gray-200/50 dark:bg-slate-700/50 rounded-full animate-pulse backdrop-blur-sm"></div>
      <div className="w-20 h-4 bg-gray-200/50 dark:bg-slate-700/50 rounded-lg animate-pulse backdrop-blur-sm"></div>
    </div>
  )
})

// 导航项组件 - 使用memo优化，提取到组件外部
const NavLink = memo(function NavLink({ href, children, className = "", onClick }: {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href === '/search' && pathname === '/search')
  
  const handleClick = useCallback(() => {
    console.log(`🔄 [导航] 点击导航: ${href}, 当前路径: ${pathname}`)
    console.time(`页面切换-${href}`)
    onClick?.()
  }, [href, pathname, onClick])
  
  return (
    <Link
      href={href}
      prefetch={true}
      className={`group relative py-2 px-1 font-medium transition-all duration-300 ${
        isActive 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
      } ${className}`}
      onClick={handleClick}
    >
      <span className="relative z-10 flex items-center space-x-2">
        {children}
      </span>
      {/* 底部指示线 */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-transform duration-300 origin-left ${
        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}></div>
    </Link>
  )
})

// 移动端导航项组件 - 使用memo优化，提取到组件外部
const MobileNavLink = memo(function MobileNavLink({ href, children, onClick }: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href === '/search' && pathname === '/search')
  
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])
  
  return (
    <Link
      href={href}
      prefetch={true}
      className={`flex items-center justify-between p-4 rounded-xl transition-colors duration-200 group ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
          : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-800 dark:text-gray-200'
      }`}
      onClick={handleClick}
    >
      <span className="font-semibold">{children}</span>
      {isActive && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </Link>
  )
})

export const Header = memo(function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { user, profile, loading } = useMySQLAuth()
  const pathname = usePathname()

  // 使用useMemo减少不必要的计算
  const authState = useMemo(() => ({
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    isHydrated,
    showAuthModal,
    mobileMenuOpen
  }), [user, profile, loading, isHydrated, showAuthModal, mobileMenuOpen])

  // 临时注释，减少噪音
  // console.log(`🎨 [Header] Header组件正在渲染，路径: ${pathname}`, authState)

  // 处理客户端hydration - 只执行一次
  useEffect(() => {
    if (!isHydrated) {
      setIsHydrated(true)
      console.log(`⚡ [Header] Hydration完成`)
    }
  }, [isHydrated])

  // 监听路径变化 - 优化依赖
  useEffect(() => {
    console.log(`🔄 [Header] 路径变化: ${pathname}`)
  }, [pathname])

  // 使用useCallback缓存事件处理函数
  const handleAuthModalOpen = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(!mobileMenuOpen)
  }, [mobileMenuOpen])

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const handleMobileAuthClick = useCallback(() => {
    setShowAuthModal(true)
    setMobileMenuOpen(false)
  }, [])

  // 使用useMemo缓存用户区域内容
  const userSection = useMemo(() => {
    if (!isHydrated || loading) {
      return <UserSkeleton />
    }
    
    if (user) {
      return (
        <div className="flex items-center space-x-4">
          <CreditsDisplay />
          <UserDropdown />
        </div>
      )
    }
    
    return (
      <Button
        onClick={handleAuthModalOpen}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 border-0"
      >
        立即登录
      </Button>
    )
  }, [isHydrated, loading, user, handleAuthModalOpen])

  // 使用useMemo缓存移动端用户区域内容
  const mobileUserSection = useMemo(() => {
    if (!isHydrated || loading) {
      return <UserSkeleton />
    }
    
    if (user) {
      return (
        <div className="flex items-center space-x-3">
          <CreditsDisplay />
          <UserDropdown />
        </div>
      )
    }
    
    return (
      <Button
        onClick={handleMobileAuthClick}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-full shadow-lg"
      >
        立即登录
      </Button>
    )
  }, [isHydrated, loading, user, handleMobileAuthClick])

  return (
    <>
      {/* 简洁现代导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-300">
        {/* 底部渐变线 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo区域 */}
          <Link href="/" className="group flex items-center space-x-3 transition-all duration-300">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                <Sparkles className="h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
              灵感矩阵
            </span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavLink href="/">
              <span>首页</span>
            </NavLink>
            
            <NavLink href="/rewrite">
              <span>爆文改写</span>
            </NavLink>
            
            <NavLink href="/search">
              <span>批量生成</span>
            </NavLink>
            
            <NavLink href="/author-copy">
              <span>作者复刻</span>
            </NavLink>
            
            <NavLink href="/prices">
              <span>定价方案</span>
            </NavLink>

            {/* 用户操作区域 */}
            <div className="flex items-center space-x-6 pl-6 border-l border-gray-200/50 dark:border-slate-700/50">
              <ThemeToggle />
              {userSection}
            </div>
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
            onClick={handleMobileMenuToggle}
          >
            <div className="relative w-6 h-6">
              <Menu className={`absolute inset-0 h-6 w-6 text-gray-700 dark:text-gray-300 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
              <X className={`absolute inset-0 h-6 w-6 text-gray-700 dark:text-gray-300 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
            </div>
          </button>
        </div>
      </header>

      {/* 移动端菜单 */}
      <div className={`lg:hidden fixed top-20 left-0 right-0 z-50 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <div className="mx-4 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 space-y-1">
            <MobileNavLink href="/" onClick={handleMobileMenuClose}>
              首页
            </MobileNavLink>
            
            <MobileNavLink href="/rewrite" onClick={handleMobileMenuClose}>
              爆文改写
            </MobileNavLink>
            
            <MobileNavLink href="/search" onClick={handleMobileMenuClose}>
              批量生成
            </MobileNavLink>
            
            <MobileNavLink href="/author-copy" onClick={handleMobileMenuClose}>
              作者复刻
            </MobileNavLink>
            
            <MobileNavLink href="/prices" onClick={handleMobileMenuClose}>
              定价方案
            </MobileNavLink>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200/50 dark:border-slate-700/50">
              <ThemeToggle />
              {mobileUserSection}
            </div>
          </div>
        </div>
      </div>

      {/* 背景遮罩 */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleMobileMenuClose}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
})
