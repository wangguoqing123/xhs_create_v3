import { Card, CardContent } from "@/components/ui/card"
import { Zap, RefreshCw, MessageSquare, Target, Sparkles, Brain } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "批量生成",
    description: "一键生成多篇高质量内容，效率提升10倍",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: RefreshCw,
    title: "主题改写",
    description: "智能适配不同赛道，一个灵感无限可能",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: MessageSquare,
    title: "口播稿生成",
    description: "图文秒变视频脚本，内容形式随心切换",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Target,
    title: "营销导向",
    description: "精准匹配营销目标，转化效果显著提升",
    gradient: "from-purple-600 to-pink-700",
  },
  {
    icon: Brain,
    title: "AI人设",
    description: "多样化人设定位，打造独特内容风格",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    icon: Sparkles,
    title: "智能优化",
    description: "持续学习优化，内容质量不断提升",
    gradient: "from-purple-300 to-pink-300",
  },
]

export function FeatureShowcase() {
  return (
    <section className="py-32 px-6 relative">
      <div className="container mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-6">
            强大功能，
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">无限创意</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            集成最先进的AI技术，为创作者提供全方位的内容生成解决方案
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-8 text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
