import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, Users, ArrowRight } from "lucide-react"

const features = [
  {
    icon: RefreshCw,
    title: "爆文改写",
    description: "智能分析热门内容，一键生成多种风格的改写文案，保持原文精髓的同时避免同质化",
    buttonText: "开始使用",
    gradient: "from-purple-500 to-pink-500",
    href: "/rewrite"
  },
  {
    icon: Search,
    title: "批量生成",
    description: "基于关键词搜索热门笔记，批量生成高质量文案，大幅提升内容创作效率",
    buttonText: "开始使用", 
    gradient: "from-purple-500 to-pink-500",
    href: "/search"
  },
  {
    icon: Users,
    title: "作者复刻",
    description: "分析优秀作者的写作风格和内容特点，智能模仿其创作模式，快速提升创作水平",
    buttonText: "开始使用",
    gradient: "from-purple-600 to-pink-600", 
    href: "/author-copy"
  },
]

export function FeatureModules() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            核心功能
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            三大核心功能，满足你的所有内容创作需求
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 overflow-hidden">
              <CardContent className="p-8 text-center">
                {/* 图标 */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>

                {/* 标题 */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>

                {/* 描述 */}
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {feature.description}
                </p>

                {/* 按钮 */}
                <Button
                  className={`w-full bg-gradient-to-r ${feature.gradient} hover:shadow-xl text-white font-semibold py-3 rounded-xl group-hover:scale-105 transition-all duration-300`}
                  onClick={() => window.location.href = feature.href}
                >
                  {feature.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
