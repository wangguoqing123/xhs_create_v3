import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, Users, ArrowRight, Target, Sparkles, History } from "lucide-react"

const features = [
  {
    icon: Target,
    title: "账号定位",
    description: "帮你找到精准的账号定位，明确内容方向，吸引目标粉丝。",
    buttonText: "开始使用",
    gradient: "from-blue-500 to-cyan-500",
    href: "/account-positioning"
  },
  {
    icon: Search,
    title: "爆文中心",
    description: "搜索全网热门笔记，洞悉爆款趋势，获取无限灵感。",
    buttonText: "开始使用", 
    gradient: "from-purple-500 to-pink-500",
    href: "/search"
  },
  {
    icon: RefreshCw,
    title: "AI智能改写",
    description: "一键改写热门内容，生成多种风格，保持原创避免同质化。",
    buttonText: "开始使用",
    gradient: "from-purple-500 to-pink-500",
    href: "/note-rewrite"
  },
  {
    icon: Users,
    title: "作者风格复刻",
    description: "深度分析优秀作者，智能模仿其创作模式，快速提升你的水平。",
    buttonText: "开始使用",
    gradient: "from-purple-600 to-pink-600", 
    href: "/author-copy"
  },
  {
    icon: Sparkles,
    title: "创作灵感",
    description: "提供源源不断的创作灵感和话题，帮你打破创作瓶颈。",
    buttonText: "开始使用",
    gradient: "from-yellow-500 to-orange-500",
    href: "/creative-inspiration"
  },
  {
    icon: History,
    title: "历史记录",
    description: "查看你所有的改写和创作记录，方便管理和回溯。",
    buttonText: "查看历史",
    gradient: "from-green-500 to-teal-500",
    href: "/rewrite-history"
  },
]

export function FeatureModules() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            释放你的创作潜力
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            从精准定位到爆款内容，我们提供一站式智能创作工具，助你轻松成为内容王者。
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 dark:border dark:border-slate-700/50 overflow-hidden dark:shadow-lg dark:shadow-black/20">
              <div className="relative">
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                
                <CardContent className="relative p-8 text-center">
                  {/* 图标 */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* 标题 */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  {/* 描述 */}
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
