'use client'

import { useState, useCallback } from 'react'
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/lib/creative-inspiration-constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import AnalysisProgressBar from './AnalysisProgressBar'

interface IndustryInputSectionProps {
  onAnalyze: (industry: string) => void
  isAnalyzing: boolean
  error: string | null
}

export default function IndustryInputSection({ 
  onAnalyze, 
  isAnalyzing, 
  error 
}: IndustryInputSectionProps) {
  const [industry, setIndustry] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  // 输入验证函数
  const validateInput = useCallback((value: string): { isValid: boolean, error?: string } => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
    }

    const trimmedValue = value.trim()
    
    // 长度验证
    // if (trimmedValue.length < VALIDATION_RULES.INDUSTRY_MIN_LENGTH || 
    //     trimmedValue.length > VALIDATION_RULES.INDUSTRY_MAX_LENGTH) {
    //   return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
    // }

    // 字符格式验证
    if (!VALIDATION_RULES.INDUSTRY_PATTERN.test(trimmedValue)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
    }

    // 禁用词检查
    const lowerValue = trimmedValue.toLowerCase()
    for (const word of VALIDATION_RULES.FORBIDDEN_WORDS) {
      if (lowerValue.includes(word.toLowerCase())) {
        return { isValid: false, error: ERROR_MESSAGES.FORBIDDEN_WORD }
      }
    }

    return { isValid: true }
  }, [])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setIndustry(value)

    // 清除之前的错误（用户输入时清除错误提示）
    if (inputError) {
      setInputError(null)
    }
  }, [inputError])

  // 处理提交
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    const trimmedIndustry = industry.trim()
    
    // 验证输入
    const validation = validateInput(trimmedIndustry)
    if (!validation.isValid) {
      setInputError(validation.error || null)
      return
    }

    // 清除错误并调用分析
    setInputError(null)
    onAnalyze(trimmedIndustry)
  }, [industry, validateInput, onAnalyze])

  // 处理键盘事件
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleSubmit(e as any)
    }
  }, [handleSubmit, isAnalyzing])

  const displayError = inputError || error
  const isDisabled = isAnalyzing || !industry.trim()

  return (
    <div className="text-center">
      {/* 标题区域 */}
      <div className="mb-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-purple-700 via-pink-700 to-red-600 bg-clip-text text-transparent">
            创作灵感
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          输入行业关键词，发现热门话题，获得创作灵感
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          消耗 <span className="font-semibold text-purple-600 dark:text-purple-400">1积分</span> 获得AI智能分析
        </p>
      </div>

      {/* 输入区域 */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* 粉红色背景色块 */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 opacity-20 dark:opacity-30 rounded-3xl"></div>
            
            <div className="relative px-4 sm:px-8 py-8 sm:py-12">
              {/* 搜索框和按钮 */}
              <div className="max-w-3xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/50 dark:border-slate-600/50 shadow-xl dark:shadow-2xl dark:shadow-black/20">
                    <div className="flex items-center p-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <Input
                          type="text"
                          placeholder="输入行业关键词（如：美妆、健身、美食）"
                          value={industry}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          disabled={isAnalyzing}
                          maxLength={VALIDATION_RULES.INDUSTRY_MAX_LENGTH}
                          autoComplete="off"
                          spellCheck="false"
                          className="h-12 sm:h-14 text-base sm:text-lg pl-12 sm:pl-14 pr-4 bg-transparent border-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isDisabled}
                        className="h-12 sm:h-14 px-8 ml-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>分析中...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5" />
                            <span>开始分析</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 错误提示 */}
        {displayError && (
          <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-600 dark:text-red-400">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">{displayError}</span>
            </div>
          </div>
        )}

        {/* 分析进度条 */}
        <AnalysisProgressBar isAnalyzing={isAnalyzing} />
      </div>
    </div>
  )
}