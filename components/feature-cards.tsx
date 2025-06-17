import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, RefreshCw, MessageSquare, Target } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "批量生成",
    description: "一键生成多篇内容，提升创作效率",
  },
  {
    icon: RefreshCw,
    title: "主题改写",
    description: "将原创内容适配到不同赛道和场景",
  },
  {
    icon: MessageSquare,
    title: "口播稿生成",
    description: "从图文笔记转换为视频口播脚本",
  },
  {
    icon: Target,
    title: "营销导向",
    description: "针对不同营销目的优化内容输出",
  },
]

export function FeatureCards() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {features.map((feature, index) => (
        <Card key={index} className="text-center hover:shadow-lg transition-shadow border-purple-100">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <feature.icon className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600">{feature.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
