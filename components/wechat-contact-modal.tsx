"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Users, Bug, CreditCard, Crown, Copy, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// 微信联系弹框组件的属性接口
interface WeChatContactModalProps {
  isOpen: boolean // 弹框是否打开
  onClose: () => void // 关闭弹框的回调函数
  trigger?: 'membership' | 'credits' | 'other' // 触发弹框的来源
}

export function WeChatContactModal({ isOpen, onClose, trigger = 'other' }: WeChatContactModalProps) {
  const [copied, setCopied] = useState(false) // 复制状态

  // 微信号
  const wechatId = "qitianjia2023"

  // 复制微信号到剪贴板
  const copyWeChatId = async () => {
    try {
      await navigator.clipboard.writeText(wechatId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // 2秒后重置复制状态
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 服务项目配置
  const services = [
    {
      icon: Crown,
      title: "开通会员",
      description: "获取专属会员权益，享受更多创作功能",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
    },
    {
      icon: CreditCard,
      title: "购买积分包",
      description: "灵活购买积分，按需使用创作服务",
      color: "from-purple-600 to-pink-600",
      bgColor: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
    },
    {
      icon: Bug,
      title: "Bug反馈",
      description: "遇到问题？我们将第一时间为您解决",
      color: "from-purple-700 to-pink-700",
      bgColor: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
    },
    {
      icon: Users,
      title: "加入社群",
      description: "与其他创作者交流，分享经验和技巧",
      color: "from-purple-400 to-pink-400",
      bgColor: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 z-50 rounded-full w-8 h-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 弹框头部 */}
        <DialogHeader className="p-6 pb-4 text-center relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-red-950/20 opacity-50" />
          
          <div className="relative z-10">
            {/* 微信图标 */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent mb-2">
              联系我们
            </DialogTitle>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm font-light">
              扫描二维码或添加微信号，获得专业服务支持
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 左侧：二维码区域 */}
            <div className="text-center">
              <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <CardContent className="p-0">
                  {/* 二维码图片 */}
                  <div className="w-48 h-48 mx-auto mb-4 rounded-2xl overflow-hidden bg-white shadow-lg">
                    <Image
                      src="/wechat-qr.png"
                      alt="微信二维码"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  
                  {/* 微信号 */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">微信号</p>
                    <div className="flex items-center justify-center space-x-2">
                      <code className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-200">
                        {wechatId}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={copyWeChatId}
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-purple-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                    扫码添加更便捷
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：服务项目 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                我们能为您提供
              </h3>
              
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <Card 
                    key={index}
                    className={cn(
                      "p-4 transition-all duration-300 hover:shadow-md cursor-pointer group",
                      "bg-gradient-to-r",
                      service.bgColor,
                      "border border-slate-200/50 dark:border-slate-700/50"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 图标 */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                        `bg-gradient-to-br ${service.color} shadow-lg`
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* 文字内容 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                          {service.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/30 dark:border-purple-800/30">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                  温馨提示
                </h4>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  添加微信时请备注您的需求（如：开通会员、购买积分等），我们将为您提供专属服务。工作时间：9:00-21:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 