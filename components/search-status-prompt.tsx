"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, User, Cookie, Settings, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// 搜索状态提示组件的属性接口
interface SearchStatusPromptProps {
  type: 'login' | 'cookie' // 提示类型：登录或cookie配置
  onLoginClick: () => void // 点击登录按钮的回调
  onCookieClick: () => void // 点击配置cookie按钮的回调
  className?: string // 自定义样式类名
}

export function SearchStatusPrompt({ 
  type, 
  onLoginClick, 
  onCookieClick, 
  className 
}: SearchStatusPromptProps) {
  
  // 根据类型配置不同的内容
  const config = type === 'login' ? {
    icon: User,
    title: "请先登录您的账户",
    description: "登录后即可开始搜索小红书爆文笔记，体验AI批量生成功能",
    buttonText: "立即登录",
    buttonAction: onLoginClick,
    gradient: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    borderColor: "border-blue-200/50 dark:border-blue-800/50",
    iconBg: "from-blue-500 to-indigo-500"
  } : {
    icon: Cookie,
    title: "请配置小红书Cookie",
    description: "配置Cookie后才能正常搜索和抓取小红书笔记数据，确保功能正常使用",
    buttonText: "配置Cookie",
    buttonAction: onCookieClick,
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
    borderColor: "border-orange-200/50 dark:border-orange-800/50",
    iconBg: "from-orange-500 to-red-500"
  }

  const Icon = config.icon

  return (
    <div className={cn("container mx-auto px-6 py-8", className)}>
      <Card className={cn(
        "max-w-2xl mx-auto overflow-hidden transition-all duration-300 hover:shadow-lg",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
        "border",
        config.borderColor
      )}>
        {/* 背景装饰 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30",
          config.bgGradient
        )} />
        
        <CardContent className="relative z-10 p-8">
          <div className="flex items-start space-x-6">
            {/* 左侧图标区域 */}
            <div className="flex-shrink-0">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110",
                `bg-gradient-to-br ${config.iconBg}`
              )}>
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 min-w-0">
              {/* 状态标识 */}
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-1 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                >
                  {type === 'login' ? '需要登录' : '需要配置'}
                </Badge>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {config.title}
              </h3>

              {/* 描述 */}
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                {config.description}
              </p>

              {/* 操作按钮组 */}
              <div className="flex items-center space-x-3">
                {/* 主要操作按钮 */}
                <Button
                  onClick={config.buttonAction}
                  className={cn(
                    "h-11 px-6 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl",
                    `bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white rounded-xl`
                  )}
                >
                  <span className="flex items-center space-x-2">
                    <span>{config.buttonText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>

                {/* 次要操作按钮（仅在cookie配置时显示） */}
                {type === 'cookie' && (
                  <Button
                    variant="outline"
                    onClick={onLoginClick}
                    className="h-11 px-4 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    设置
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 底部提示信息 */}
          <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-3 w-3 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  功能说明
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {type === 'login' 
                    ? "登录后您可以搜索小红书爆文、批量生成改写内容、查看历史记录等完整功能。支持邮箱验证码快速登录。"
                    : "Cookie用于访问小红书接口，获取笔记数据。请确保Cookie有效且来源可靠，我们会安全存储您的配置信息。"
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 