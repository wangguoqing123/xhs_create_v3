/**
 * 创作灵感功能相关常量定义
 */

// AI分析Prompt模板
export const CREATIVE_INSPIRATION_PROMPT = (industry: string, titles: string[]) => `你是专业的小红书内容分析师。请分析以下100个关于"${industry}"行业的热门标题，生成10个最具创作潜力的选题主题。

分析标题：
${titles.join('\n')}

分析要求：
1. 深度分析用户痛点和兴趣点，识别热门趋势
2. 每个主题包含明确的标题、详细描述、相关关键词和热度评分
3. 确保主题差异化，覆盖不同创作角度和用户需求
4. 按创作潜力和热度排序，优先推荐最有价值的主题
5. 适合小红书平台特点，贴近年轻用户喜好
6. 关键词要有助于SEO优化和内容发现

请严格按照以下JSON格式返回结果：
{
  "topics": [
    {
      "title": "选题主题标题",
      "description": "详细描述这个主题的创作方向、吸引力和目标用户",
      "keywords": ["关键词1", "关键词2", "关键词3"],
      "popularity": 90
    }
  ]
}

注意：
- 必须返回恰好10个主题
- popularity分数范围为1-100
- 每个主题的keywords数组包含2-5个相关关键词
- description要具体说明创作方向，不少于20字`

// 积分消耗配置
export const CREDITS_CONFIG = {
  INDUSTRY_ANALYSIS: 1, // 行业分析消耗1积分
  TOPIC_CONTENT: 0      // 主题内容获取不消耗积分
} as const

// 验证规则配置
export const VALIDATION_RULES = {
  INDUSTRY_MIN_LENGTH: 2,   // 行业关键词最小长度
  INDUSTRY_MAX_LENGTH: 50,  // 行业关键词最大长度
  INDUSTRY_PATTERN: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, // 允许中英文数字和空格
  FORBIDDEN_WORDS: ['测试', 'test', 'admin', 'null', 'undefined'] // 禁用词列表
} as const

// 缓存配置
export const CACHE_CONFIG = {
  SEARCH_RESULTS: 30 * 60 * 1000,      // 搜索结果缓存30分钟
  AI_ANALYSIS: 2 * 60 * 60 * 1000,     // AI分析结果缓存2小时
  CONTENT_EXAMPLES: 15 * 60 * 1000,    // 内容示例缓存15分钟
  USER_SESSION: 60 * 60 * 1000         // 用户会话缓存1小时
} as const

// API配置
export const API_CONFIG = {
  SEARCH_RESULTS_COUNT: 100,  // 行业分析时搜索的结果数量
  TOPICS_COUNT: 10,           // 生成的选题主题数量
  CONTENT_EXAMPLES_COUNT: 20, // 主题内容示例数量
  MAX_RETRIES: 3,             // API调用最大重试次数
  TIMEOUT: 30000              // API调用超时时间（毫秒）
} as const

// 搜索配置
export const SEARCH_CONFIG = {
  INDUSTRY_ANALYSIS: {
    noteType: 0 as const,     // 全部类型
    sort: 2 as const,         // 最热排序
    totalNumber: API_CONFIG.SEARCH_RESULTS_COUNT
  },
  TOPIC_CONTENT: {
    noteType: 0 as const,     // 全部类型
    sort: 0 as const,         // 综合排序
    totalNumber: API_CONFIG.CONTENT_EXAMPLES_COUNT
  }
} as const

// 错误消息常量
export const ERROR_MESSAGES = {
  INVALID_INPUT: '请输入2-50个字符的行业关键词，仅支持中英文数字和空格',
  FORBIDDEN_WORD: '输入内容包含禁用词，请重新输入',
  INSUFFICIENT_CREDITS: '积分不足，需要1积分进行行业分析',
  AUTHENTICATION_FAILED: '用户认证失败，请重新登录',
  COOKIE_NOT_SET: '用户Cookie未设置，请先在设置中配置Cookie',
  SEARCH_API_ERROR: '搜索服务暂时不可用，请稍后重试',
  AI_ANALYSIS_ERROR: 'AI分析服务暂时不可用，请稍后重试',
  DATABASE_ERROR: '数据库操作失败，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  UNKNOWN_ERROR: '未知错误，请稍后重试'
} as const

// UI相关常量
export const UI_CONFIG = {
  SIDEBAR_WIDTH: '320px',           // 侧边栏宽度
  CONTENT_GRID_COLS: {             // 内容网格列数
    DEFAULT: 4,
    LARGE: 4,
    MEDIUM: 3,
    SMALL: 2,
    MOBILE: 1
  },
  LOADING_STAGES: [                // 加载阶段提示
    { text: '搜索热门内容中...', duration: 3000 },
    { text: 'AI智能分析中...', duration: 5000 },
    { text: '生成选题主题中...', duration: 2000 }
  ],
  ANIMATION_DURATION: 300          // 动画持续时间（毫秒）
} as const

// 数据库相关常量
export const DB_CONFIG = {
  SESSION_STATUS: {
    ANALYZING: 'analyzing' as const,
    COMPLETED: 'completed' as const,
    FAILED: 'failed' as const
  },
  DEFAULT_SORT_ORDER: 0,           // 默认排序顺序
  MAX_HISTORY_RECORDS: 100         // 用户历史记录最大数量
} as const

// 正则表达式模式
export const PATTERNS = {
  CLEAN_TITLE: /^[\s\n\r]+|[\s\n\r]+$/g,           // 清理标题首尾空白
  EXTRACT_JSON: /\{[\s\S]*\}/,                      // 提取JSON内容
  VALIDATE_JSON_STRUCTURE: /"topics"\s*:\s*\[/,    // 验证JSON结构
  CLEAN_DESCRIPTION: /[\r\n\t]+/g                   // 清理描述中的换行符
} as const

// 默认值
export const DEFAULT_VALUES = {
  TOPIC_POPULARITY: 50,            // 默认主题热度
  FALLBACK_TOPICS: [               // 失败时的备用主题
    {
      title: '新手入门指南',
      description: '针对初学者的详细入门教程和经验分享',
      keywords: ['新手', '入门', '指南'],
      popularity: 80
    },
    {
      title: '实用技巧分享',
      description: '日常生活中的实用小技巧和经验总结',
      keywords: ['技巧', '实用', '分享'],
      popularity: 75
    },
    {
      title: '趋势解析',
      description: '分析当前行业趋势和未来发展方向',
      keywords: ['趋势', '解析', '发展'],
      popularity: 70
    }
  ]
} as const