import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, ImageIcon, TrendingUp, ArrowRight } from "lucide-react"
import Image from "next/image"

const features = [
  {
    icon: RefreshCw,
    title: "笔记批量改写",
    description: "一键将现有笔记改写成不同风格、不同赛道的内容，让一个灵感适配多个场景",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop&crop=center",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
  },
  {
    icon: ImageIcon,
    title: "自动生成封面",
    description: "AI智能分析内容主题，自动生成高质量、吸引眼球的笔记封面图片",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop&crop=center",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
  },
  {
    icon: TrendingUp,
    title: "趋势抓取",
    description: "实时监控热门话题和流行趋势，为您的内容创作提供最新的灵感来源",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
  },
]

export function FeatureModules() {
  return (
    <section className="py-32 px-6 relative">
      <div className="container mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
            强大功能，
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              无限创意
            </span>
          </h2>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            集成最先进的AI技术，为创作者提供全方位的内容生成解决方案
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16 lg:gap-24`}
            >
              {/* Image Side */}
              <div className="flex-1 relative group">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    width={600}
                    height={400}
                    className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div
                  className="absolute -inset-4 bg-gradient-to-r opacity-20 rounded-3xl blur-2xl group-hover:opacity-30 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${feature.gradient.split(" ")[1]}, ${feature.gradient.split(" ")[3]})`,
                  }}
                />
              </div>

              {/* Content Side */}
              <div className="flex-1 space-y-8">
                <Card className={`bg-gradient-to-br ${feature.bgGradient} border-0 shadow-xl`}>
                  <CardContent className="p-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-8 shadow-lg`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">{feature.title}</h3>

                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                      {feature.description}
                    </p>

                    <Button
                      size="lg"
                      className={`bg-gradient-to-r ${feature.gradient} hover:shadow-xl text-white px-8 py-4 h-auto text-lg font-semibold rounded-2xl group transition-all duration-200`}
                    >
                      立即体验
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
