'use client'

import { useState, useCallback } from 'react'
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/lib/creative-inspiration-constants'

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
    if (trimmedValue.length < VALIDATION_RULES.INDUSTRY_MIN_LENGTH || 
        trimmedValue.length > VALIDATION_RULES.INDUSTRY_MAX_LENGTH) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
    }

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

    // 清除之前的错误
    if (inputError) {
      setInputError(null)
    }

    // 实时验证（只在用户输入内容时进行）
    if (value.trim()) {
      const validation = validateInput(value)
      if (!validation.isValid) {
        setInputError(validation.error || null)
      }
    }
  }, [inputError, validateInput])

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

  // 获取输入框状态样式
  const getInputClassName = useCallback(() => {
    const baseClass = "w-full px-4 py-3 text-lg border-2 rounded-lg transition-all duration-300 focus:outline-none dark:bg-gray-800 dark:text-white"
    
    if (isAnalyzing) {
      return `${baseClass} border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600 cursor-not-allowed`
    }
    
    if (inputError || error) {
      return `${baseClass} border-red-300 bg-red-50 focus:border-red-500 dark:bg-red-900/20 dark:border-red-600`
    }
    
    if (industry.trim() && !inputError) {
      return `${baseClass} border-green-300 bg-green-50 focus:border-green-500 dark:bg-green-900/20 dark:border-green-600`
    }
    
    return `${baseClass} border-purple-200 focus:border-purple-500 dark:border-gray-600 dark:focus:border-purple-500`
  }, [isAnalyzing, inputError, error, industry])

  // 获取按钮状态样式
  const getButtonClassName = useCallback(() => {
    const baseClass = "w-full py-3 text-lg font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    
    const isDisabled = isAnalyzing || !industry.trim() || !!inputError

    if (isDisabled) {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400`
    }
    
    return `${baseClass} bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 active:scale-95`
  }, [isAnalyzing, industry, inputError])

  const displayError = inputError || error

  return (
    <div className="text-center">
      {/* 标题区域 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 创作灵感
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          输入行业关键词，发现热门话题，获得创作灵感
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          消耗 <span className="font-semibold text-purple-600 dark:text-purple-400">1积分</span> 获得AI智能分析
        </p>
      </div>

      {/* 输入区域 */}
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 输入框 */}
            <div className="relative">
              <input
                type="text"
                value={industry}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入行业关键词（如：美妆、健身、美食）"
                className={getInputClassName()}
                disabled={isAnalyzing}
                maxLength={VALIDATION_RULES.INDUSTRY_MAX_LENGTH}
                autoComplete="off"
                spellCheck="false"
              />
              
              {/* 字符计数 */}
              <div className="absolute top-full right-0 mt-1 text-xs text-gray-400">
                {industry.length}/{VALIDATION_RULES.INDUSTRY_MAX_LENGTH}
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              className={getButtonClassName()}
              disabled={isAnalyzing || !industry.trim() || !!inputError}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>AI分析中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>开始分析</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* 错误提示 */}
        {displayError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-600 dark:text-red-400">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">{displayError}</span>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {!displayError && !isAnalyzing && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <div className="font-semibold mb-2">💡 使用提示：</div>
              <ul className="space-y-1 text-left">
                <li>• 输入具体的行业领域，如"护肤"、"瑜伽"、"烘焙"</li>
                <li>• 支持中英文，长度在2-50个字符之间</li>
                <li>• AI将分析100个热门内容，生成10个创作主题</li>
                <li>• 分析过程需要10-15秒，请耐心等待</li>
              </ul>
            </div>
          </div>
        )}

        {/* 分析进度提示 */}
        {isAnalyzing && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-700">
            <div className="text-sm text-purple-700 dark:text-purple-300">
              <div className="font-semibold mb-2">🔄 正在分析中：</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>搜索热门内容...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full" style={{animationDelay: '0.2s'}}></div>
                  <span>AI智能分析...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full" style={{animationDelay: '0.4s'}}></div>
                  <span>生成选题主题...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 示例关键词 */}
      {!isAnalyzing && !displayError && (
        <div className="mt-8">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            🔥 热门关键词示例：
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              '美妆护肤', '健身运动', '美食料理', '旅行攻略', 
              '时尚穿搭', '家居装修', '宠物养护', '学习成长'
            ].map((keyword) => (
              <button
                key={keyword}
                onClick={() => !isAnalyzing && setIndustry(keyword)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 rounded-full transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-purple-800 dark:hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isAnalyzing}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}