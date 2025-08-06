'use client'

import { useEffect, useState } from 'react'

interface AnalysisProgressBarProps {
  isAnalyzing: boolean
}

const PROGRESS_STEPS = [
  { 
    id: 1, 
    label: '搜索热门内容', 
    icon: '🔍',
    duration: 3000 // 3秒
  },
  { 
    id: 2, 
    label: 'AI智能分析', 
    icon: '🤖',
    duration: 6000 // 6秒
  },
  { 
    id: 3, 
    label: '生成选题主题', 
    icon: '✨',
    duration: 3000 // 3秒
  }
]

export default function AnalysisProgressBar({ isAnalyzing }: AnalysisProgressBarProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    // 开始分析时，立即进入第一步
    setCurrentStep(1)
    setProgress(10)

    const stepTimers: NodeJS.Timeout[] = []
    let totalElapsed = 0

    PROGRESS_STEPS.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index + 1)
        
        // 根据步骤设置进度
        const baseProgress = (index / PROGRESS_STEPS.length) * 100
        setProgress(baseProgress + 10)
        
        // 在每个步骤内部创建平滑的进度增长
        const stepProgressTimer = setInterval(() => {
          setProgress(prev => {
            const maxProgress = ((index + 1) / PROGRESS_STEPS.length) * 100
            if (prev >= maxProgress - 5) {
              clearInterval(stepProgressTimer)
              return maxProgress - 5
            }
            return prev + 2
          })
        }, 200)
        
        setTimeout(() => clearInterval(stepProgressTimer), step.duration - 500)
        
      }, totalElapsed)
      
      stepTimers.push(timer)
      totalElapsed += step.duration
    })

    // 清理定时器
    return () => {
      stepTimers.forEach(timer => clearTimeout(timer))
    }
  }, [isAnalyzing])

  if (!isAnalyzing) {
    return null
  }

  // 根据当前步骤获取显示文本
  const getCurrentStepText = () => {
    const step = PROGRESS_STEPS.find(s => s.id === currentStep)
    if (!step) return '正在准备分析...'
    return step.label
  }

  return (
    <div className="max-w-2xl mx-auto mt-4">
      <div className="text-center mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🧠 {getCurrentStepText()}...
        </p>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="h-full bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}