"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, Sparkles, Crown, Gem, Star, ArrowRight, Shield, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AuthModal } from "@/components/auth-modal"
import { useCreditsContext } from "@/components/credits-context"
import { WeChatContactModal } from "@/components/wechat-contact-modal"

// 会员配置类型定义
interface PricingOption {
  price: number
  period: string
  originalPrice?: number
  discount?: string
}

interface MembershipConfigItem {
  name: string
  subtitle: string
  icon: any
  color: string
  credits: number
  features: string[]
  monthly: PricingOption
  yearly: PricingOption
  popular?: boolean
}

// 会员配置
const membershipConfig: Record<string, MembershipConfigItem> = {
  lite: {
    name: "入门会员",
    subtitle: "适合个人创作者",
    icon: Sparkles,
    color: "blue",
    credits: 100,
    features: [
      "每月 100 积分",
      "AI 文案改写",
      "基础模板库",
      "邮件客服支持"
    ],
    monthly: { price: 9.9, period: "月" },
    yearly: { price: 99, period: "年", originalPrice: 118.8, discount: "17%" }
  },
  pro: {
    name: "标准会员", 
    subtitle: "功能全面的选择",
    icon: Crown,
    color: "purple",
    credits: 250,
    features: [
      "每月 250 积分",
      "高级 AI 改写",
      "全部模板库",
      "批量生成功能",
      "优先客服支持"
    ],
    monthly: { price: 19.9, period: "月" },
    yearly: { price: 199, period: "年", originalPrice: 238.8, discount: "17%" }
  },
  premium: {
    name: "高级会员",
    subtitle: "专业团队首选", 
    icon: Gem,
    color: "gold",
    credits: 600,
    features: [
      "每月 600 积分",
      "AI 智能创作",
      "专属定制模板",
      "无限批量生成",
      "1对1 专属客服",
      "数据分析报告"
    ],
    monthly: { price: 39.9, period: "月" },
    yearly: { price: 399, period: "年", originalPrice: 478.8, discount: "17%" }
  }
}

// 积分包配置
const creditPackageConfig = {
  price: 9.9,
  credits: 120,
  features: [
    "120 积分一次性购买",
    "永久有效",
    "可叠加使用", 
    "仅限会员购买"
  ]
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false) // 年付切换状态
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null) // 鼠标悬停的方案
  const [showWeChatModal, setShowWeChatModal] = useState(false) // 微信弹框显示状态
  const [selectedPlanType, setSelectedPlanType] = useState<'membership' | 'credits' | 'other'>('other') // 选中的方案类型
  const { user } = useMySQLAuth()

  useEffect(() => {
    console.log(`📄 [页面] 价格页面组件已挂载`)
    console.timeEnd('页面切换-/prices')
  }, [])

  // 处理方案选择按钮点击
  const handlePlanSelect = (planId: string) => {
    console.log(`🎯 [点击] 用户选择了方案: ${planId}`)
    
    if (planId === 'credits') {
      setSelectedPlanType('credits')
    } else {
      setSelectedPlanType('membership')
    }
    
    setShowWeChatModal(true)
  }

  // 关闭微信弹框
  const handleCloseWeChatModal = () => {
    console.log(`🔒 [关闭] 微信联系弹框已关闭`)
    setShowWeChatModal(false)
  }

  // 获取颜色样式
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'from-blue-500 to-cyan-500',
        button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
        shadow: 'shadow-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400'
      },
      purple: {
        bg: 'from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'from-purple-500 to-indigo-500',
        button: 'from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600',
        shadow: 'shadow-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400'
      },
      gold: {
        bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'from-amber-500 to-orange-500',
        button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
        shadow: 'shadow-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400'
      },
      emerald: {
        bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: 'from-emerald-500 to-teal-500',
        button: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
        shadow: 'shadow-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400'
      }
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="min-h-screen pt-6 pb-12 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-full text-sm font-medium mb-6 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm">
            <Star className="h-4 w-4" />
            <span>选择最适合您的付费计划</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent mb-6 tracking-tight">
            定价
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
            选择最适合您创作需求的方案，解锁AI驱动的全部潜力
          </p>

          {/* 月付/年付切换 */}
          <div className="inline-flex items-center space-x-4 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <span className={cn("text-sm font-medium", !isYearly ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
              按月
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-indigo-600"
            />
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm font-medium", isYearly ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                按年
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                省 20%
              </Badge>
            </div>
          </div>
        </div>

        {/* 会员方案卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {Object.entries(membershipConfig).map(([key, config]) => {
            const Icon = config.icon
            const isHovered = hoveredPlan === key
            const colorClasses = getColorClasses(config.color)
            const pricing = isYearly ? config.yearly : config.monthly
            
            return (
              <Card 
                key={key}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 group cursor-pointer",
                  "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
                  "hover:shadow-xl",
                  isHovered && "scale-[1.02] -translate-y-2"
                )}
                onMouseEnter={() => setHoveredPlan(key)}
                onMouseLeave={() => setHoveredPlan(null)}
              >

                {/* 背景渐变效果 */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-40 transition-opacity duration-300",
                  colorClasses.bg
                )} />
                
                <CardHeader className="text-center pb-4 pt-8 relative z-10">
                  {/* 图标 */}
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                    `bg-gradient-to-br ${colorClasses.icon}`,
                    isHovered && "rotate-3 scale-110 shadow-xl"
                  )}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* 方案名称和描述 */}
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {config.name}
                  </CardTitle>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    {config.subtitle}
                  </p>

                  {/* 价格 */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center space-x-1 mb-2">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        ¥{pricing.price}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        /{pricing.period}
                      </span>
                    </div>
                    
                    {isYearly && pricing.originalPrice && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-slate-400 line-through">
                          原价 ¥{pricing.originalPrice}
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          省 {pricing.discount}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* 积分信息 */}
                  <div className={cn(
                    "inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm mb-4 border",
                    `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`
                  )}>
                    <Sparkles className="h-4 w-4" />
                    <span>每月 {config.credits} 积分</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-8 relative z-10">
                  {/* 功能列表 */}
                  <ul className="space-y-3 mb-8">
                    {config.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* 购买按钮 */}
                  <Button 
                    className={cn(
                      "w-full py-4 font-semibold transition-all duration-300 relative overflow-hidden group/btn",
                      `bg-gradient-to-r ${colorClasses.button} text-white shadow-lg hover:shadow-xl hover:scale-[1.02]`
                    )}
                    onClick={() => handlePlanSelect(key)}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>选择 {config.name}</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 积分包区域 */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              积分包
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              仅限会员购买，随时补充积分
            </p>
          </div>

          <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 opacity-30" />
            
            <CardContent className="p-8 relative z-10">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>

                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  积分包
                </h4>
                
                <div className="flex items-baseline justify-center space-x-1 mb-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    ¥{creditPackageConfig.price}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    / {creditPackageConfig.credits} 积分
                  </span>
                </div>

                <ul className="space-y-2 mb-6 text-left max-w-sm mx-auto">
                  {creditPackageConfig.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full py-3 font-semibold transition-all duration-300",
                    user 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!user}
                  onClick={() => handlePlanSelect('credits')}
                >
                  {user ? "购买积分包" : "需要先成为会员"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 常见问题 */}
        <div className="text-center">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 max-w-5xl mx-auto border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>常见问题解答</span>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              获取常见问题的答案
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {[
                {
                  question: "什么是小红书爆文改写？",
                  answer: "基于热门小红书笔记进行智能改写，保持原文精髓的同时生成不同角度的高质量内容，避免同质化。"
                },
                {
                  question: "积分是如何消耗的？",
                  answer: "每次AI改写、批量生成、作者复刻等操作都会消耗积分。不同功能消耗的积分数量不同，具体以实际操作为准。"
                },
                {
                  question: "会员积分什么时候重置？",
                  answer: "积分按照您的会员开通日期每月重置。如果会员到期，积分将清零；如果续费，积分将重置到对应等级的月度额度。"
                },
                {
                  question: "生成的内容可以商用吗？",
                  answer: "是的！所有通过我们平台生成的内容您都拥有完整的使用权，可自由用于商业项目和内容创作。"
                },
                {
                  question: "支持哪些内容创作功能？",
                  answer: "支持爆文改写、作者复刻、批量生成、账号定位、创作灵感等多种AI驱动的内容创作工具。"
                },
                {
                  question: "如何获得客服支持？",
                  answer: "我们提供微信客服支持，您可以通过网站联系我们获取帮助，或者发送邮件到客服邮箱。"
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 group cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {faq.question}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 背景装饰效果 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 dark:bg-purple-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-300/3 to-purple-300/3 dark:from-indigo-500/2 dark:to-purple-500/2 rounded-full blur-3xl" />
      </div>

      {/* 微信联系弹框 */}
      <WeChatContactModal
        isOpen={showWeChatModal}
        onClose={handleCloseWeChatModal}
        trigger={selectedPlanType}
      />
    </div>
  )
}
