"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Check, Sparkles, Crown, Gem, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMySQLAuth } from "@/components/mysql-auth-context"
import { AuthModal } from "@/components/auth-modal"
import { useCreditsContext } from "@/components/credits-context"
import { WeChatContactModal } from "@/components/wechat-contact-modal"

export default function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null) // 鼠标悬停的方案
  const [showWeChatModal, setShowWeChatModal] = useState(false) // 微信弹框显示状态
  const [selectedPlanType, setSelectedPlanType] = useState<'membership' | 'credits' | 'other'>('other') // 选中的方案类型

  useEffect(() => {
    console.log(`📄 [页面] 价格页面组件已挂载`)
    console.timeEnd('页面切换-/prices')
  }, [])

  console.log(`🎨 [渲染] 价格页面组件正在渲染...`)

  // 处理方案选择按钮点击
  const handlePlanSelect = (planId: string) => {
    console.log(`🎯 [点击] 用户选择了方案: ${planId}`)
    
    // 根据方案类型设置对应的触发类型
    if (planId === 'monthly' || planId === 'yearly') {
      setSelectedPlanType('membership') // 会员方案
    } else if (planId === 'credits') {
      setSelectedPlanType('credits') // 积分包方案
    } else {
      setSelectedPlanType('other') // 其他方案
    }
    
    // 显示微信联系弹框
    setShowWeChatModal(true)
  }

  // 关闭微信弹框
  const handleCloseWeChatModal = () => {
    console.log(`🔒 [关闭] 微信联系弹框已关闭`)
    setShowWeChatModal(false)
  }

  const plans = [
    {
      id: 'monthly',
      name: '月会员',
      price: 39.9,
      period: '月',
      originalPrice: null,
      badge: null,
      icon: Sparkles,
      credits: 500,
      creditsPerMonth: 500,
      description: '适合轻度使用用户',
      features: [
        '每月获得500积分',
        '小红书矩阵教程',
        '高质量AI创作',
        '24小时客服支持'
      ],
      buttonText: '选择月会员',
      popular: false,
      color: 'blue'
    },
    {
      id: 'yearly',
      name: '年会员',
      price: 365,
      period: '年',
      originalPrice: 478.8,
      badge: '最受欢迎',
      icon: Crown,
      credits: 9600,
      creditsPerMonth: 800,
      description: '最划算的选择',
      features: [
        '每月获得800积分',
        '年度总计9600积分',
        '月度会员全部权益',
        '优先客服支持'
      ],
      buttonText: '选择年会员',
      popular: true,
      color: 'indigo'
    },
    {
      id: 'credits',
      name: '积分包',
      price: 49.9,
      period: '次',
      originalPrice: null,
      badge: '会员专享',
      icon: Gem,
      credits: 1000,
      creditsPerMonth: null,
      description: '仅限会员购买',
      features: [
        '1000积分一次性购买',
        '永久有效',
        '可叠加使用',
        '会员专享价格'
      ],
      buttonText: '购买积分包',
      popular: false,
      color: 'emerald',
      disabled: true
    }
  ]

  const getColorClasses = (color: string, isPopular: boolean = false) => {
    const colors = {
      blue: {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
        border: 'border-blue-200/50 dark:border-blue-800/50',
        icon: 'from-blue-500 to-cyan-500',
        button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
        shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20',
        ring: 'focus:ring-blue-500/20'
      },
      indigo: {
        bg: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
        border: 'border-indigo-200/50 dark:border-indigo-800/50',
        icon: 'from-indigo-500 to-purple-500',
        button: 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
        shadow: 'shadow-indigo-500/10 hover:shadow-indigo-500/20',
        ring: 'focus:ring-indigo-500/20'
      },
      emerald: {
        bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
        border: 'border-emerald-200/50 dark:border-emerald-800/50',
        icon: 'from-emerald-500 to-teal-500',
        button: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
        shadow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
        ring: 'focus:ring-emerald-500/20'
      }
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
      <Header />
      
      {/* 页面内容 */}
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* 标题部分 - 紧凑化 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-indigo-200/30 dark:border-indigo-800/30 backdrop-blur-sm">
              <Star className="h-4 w-4" />
              <span>选择适合您的方案</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent mb-3 tracking-tight">
              定价方案
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              选择最适合您创作需求的方案，解锁AI驱动的内容创作能力
            </p>
          </div>

          {/* 定价卡片 - 优化布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 pt-4">
            {plans.map((plan, index) => {
              const Icon = plan.icon
              const isPopular = plan.popular
              const isHovered = hoveredPlan === plan.id
              const colorClasses = getColorClasses(plan.color, isPopular)
              
              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-500 ease-out group cursor-pointer",
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
                    "border border-slate-200/50 dark:border-slate-700/50",
                    "hover:border-slate-300/50 dark:hover:border-slate-600/50",
                    isPopular && "ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 scale-105",
                    isPopular && "shadow-xl shadow-indigo-500/10",
                    !isPopular && "hover:shadow-lg hover:shadow-slate-500/10",
                    plan.disabled && "opacity-60 cursor-not-allowed",
                    isHovered && !plan.disabled && "scale-105 -translate-y-1"
                  )}
                  onMouseEnter={() => !plan.disabled && setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    transform: isHovered && !plan.disabled ? 'translateY(-4px) scale(1.02)' : isPopular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* 背景渐变效果 */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity duration-300",
                    colorClasses.bg
                  )} />
                  
                  {/* 推荐标签 */}
                  {/* {plan.badge && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge 
                        className={cn(
                          "text-white font-medium px-3 py-1.5 shadow-lg border-0 text-xs whitespace-nowrap",
                          isPopular 
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30" 
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30"
                        )}
                      >
                        {plan.badge}
                      </Badge>
                    </div>
                  )} */}

                  <CardHeader className="text-center pb-3 pt-6 relative z-10">
                    {/* 图标 */}
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300",
                      `bg-gradient-to-br ${colorClasses.icon} shadow-lg`,
                      isHovered && "rotate-3 scale-110 shadow-xl"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* 方案名称 */}
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.name}
                    </CardTitle>

                    {/* 价格 */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center space-x-1 mb-1">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                          ¥{plan.price}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                          /{plan.period}
                        </span>
                      </div>
                      
                      {plan.originalPrice && (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-xs text-slate-400 line-through">
                            原价 ¥{plan.originalPrice}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5">
                            省 ¥{(plan.originalPrice - plan.price).toFixed(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* 积分信息 */}
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 backdrop-blur-sm mb-2">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>
                        {plan.creditsPerMonth 
                          ? `每月${plan.creditsPerMonth}积分` 
                          : `${plan.credits}积分`
                        }
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm font-light">
                      {plan.description}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 pb-6 relative z-10">
                    {/* 功能列表 */}
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-2.5">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <Check className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
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
                        "w-full py-3 font-semibold transition-all duration-300 relative overflow-hidden group/btn text-sm",
                        plan.disabled
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          : cn(
                              `bg-gradient-to-r ${colorClasses.button} text-white`,
                              `shadow-lg ${colorClasses.shadow}`,
                              "hover:shadow-xl hover:scale-[1.02]"
                            )
                      )}
                      disabled={plan.disabled}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <span>{plan.buttonText}</span>
                        {!plan.disabled && (
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        )}
                      </span>
                      {!plan.disabled && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      )}
                    </Button>

                    {plan.disabled && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 font-light">
                        需要先购买会员才能购买积分包
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 底部说明 - 紧凑化 */}
          <div className="text-center">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 max-w-4xl mx-auto border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                常见问题
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                {[
                  {
                    question: "积分如何使用？",
                    answer: "每次AI生成内容都会消耗相应积分，不同功能消耗的积分数量不同。"
                  },
                  {
                    question: "积分会过期吗？",
                    answer: "会员期间获得的积分不会过期，积分包购买的积分永久有效。"
                  },
                  {
                    question: "可以随时取消吗？",
                    answer: "支持随时取消订阅，取消后仍可使用到当前计费周期结束。"
                  },
                  {
                    question: "支持哪些支付方式？",
                    answer: "支持微信支付、支付宝、银行卡等多种支付方式。"
                  }
                ].map((faq, index) => (
                  <div key={index} className="p-4 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 group cursor-pointer">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 text-sm">
                      {faq.question}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 背景装饰效果 - 调整透明度 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 dark:bg-blue-500/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-300/3 to-blue-300/3 dark:from-indigo-500/2 dark:to-blue-500/2 rounded-full blur-3xl" />
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
