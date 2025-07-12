"use client"

import { SearchHero } from "@/components/search-hero"
import { FeatureModules } from "@/components/feature-modules"
import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    console.log(`📄 [页面] 主页组件已挂载`)
    console.timeEnd('页面切换-/')
  }, [])

  console.log(`🎨 [渲染] 主页组件正在渲染...`)

  return (
    <div className="min-h-screen pt-6">
      {/* Hero Section */}
      <SearchHero />

      {/* Feature Modules */}
      <FeatureModules />

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-300/5 to-pink-300/5 dark:from-purple-500/3 dark:to-pink-500/3 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
