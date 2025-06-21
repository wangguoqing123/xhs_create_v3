/**
 * 图片工具函数 - 处理图片URL代理和加载
 */

/**
 * 生成代理图片URL
 * @param originalUrl 原始图片URL
 * @returns 代理后的图片URL
 */
export function getProxiedImageUrl(originalUrl: string): string {
  // 如果是本地图片或相对路径，直接返回
  if (!originalUrl || originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
    return originalUrl
  }

  // 如果已经是代理URL，直接返回
  if (originalUrl.includes('/api/image-proxy')) {
    return originalUrl
  }

  try {
    // 验证URL格式
    const url = new URL(originalUrl)
    
    // 检查是否需要代理（外部图片才需要代理）
    const needsProxy = isExternalImage(url.hostname)
    
    if (!needsProxy) {
      return originalUrl
    }

    // 简单的URL有效性检查
    if (!isValidImageUrl(originalUrl)) {
      console.warn('⚠️ [图片工具] 可能无效的图片URL，跳过代理:', originalUrl)
      return originalUrl
    }

    // 生成代理URL
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`
    console.log('🔄 [图片工具] 生成代理URL:', originalUrl, '->', proxyUrl)
    
    return proxyUrl
    
  } catch (error) {
    console.error('❌ [图片工具] URL格式错误:', originalUrl, error)
    return originalUrl // 返回原URL作为降级处理
  }
}

/**
 * 简单的图片URL有效性检查
 * @param url 图片URL
 * @returns 是否可能是有效的图片URL
 */
function isValidImageUrl(url: string): boolean {
  // 检查URL长度（过长的URL可能无效）
  if (url.length > 2000) {
    return false
  }
  
  // 检查是否包含明显的错误标识
  const invalidPatterns = [
    'undefined',
    'null',
    'error',
    'not_found',
    '404',
    'invalid'
  ]
  
  const lowerUrl = url.toLowerCase()
  return !invalidPatterns.some(pattern => lowerUrl.includes(pattern))
}

/**
 * 判断是否为外部图片
 * @param hostname 图片域名
 * @returns 是否为外部图片
 */
function isExternalImage(hostname: string): boolean {
  // 需要代理的外部域名列表
  const externalDomains = [
    'images.unsplash.com',
    'unsplash.com',
    'sns-webpic-qc.xhscdn.com',
    'sns-avatar-qc.xhscdn.com',
    'ci.xiaohongshu.com',
    'xhscdn.com',
    'picasso.xhscdn.com',
    'sns-img-qc.xhscdn.com',
    'sns-webpic-bd.xhscdn.com', // 新增小红书域名
    'sns-webpic-hz.xhscdn.com', // 新增小红书域名
    'sns-img-bd.xhscdn.com',    // 新增小红书域名
    'sns-img-hz.xhscdn.com'     // 新增小红书域名
  ]

  return externalDomains.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  )
}

/**
 * 批量处理图片URL列表
 * @param imageUrls 原始图片URL列表
 * @returns 代理后的图片URL列表
 */
export function getProxiedImageUrls(imageUrls: string[]): string[] {
  return imageUrls.map(url => getProxiedImageUrl(url))
}

/**
 * 处理图片加载错误的回调函数
 * @param originalUrl 原始图片URL
 * @param fallbackUrl 降级图片URL
 * @returns 错误处理函数
 */
export function createImageErrorHandler(
  originalUrl: string, 
  fallbackUrl: string = '/placeholder.svg'
) {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ [图片加载] 图片加载失败:', originalUrl)
    
    const img = event.currentTarget
    
    // 如果当前显示的是代理URL且失败了，尝试直接访问原图
    if (img.src.includes('/api/image-proxy') && !originalUrl.includes('/api/image-proxy')) {
      // 检查是否是HTTPS的小红书图片，如果是HTTP则转换为HTTPS再尝试
      if (originalUrl.startsWith('http://') && originalUrl.includes('xhscdn.com')) {
        const httpsUrl = originalUrl.replace('http://', 'https://')
        console.log('🔄 [图片加载] 代理失败，尝试HTTPS直接访问:', httpsUrl)
        img.src = httpsUrl
        return
      } else if (originalUrl.startsWith('https://')) {
        console.log('🔄 [图片加载] 代理失败，尝试直接访问:', originalUrl)
        img.src = originalUrl
        return
      }
    }
    
    // 最终降级到占位符图片
    if (img.src !== fallbackUrl) {
      console.log('🔄 [图片加载] 使用占位符图片:', fallbackUrl)
      img.src = fallbackUrl
    }
  }
}

/**
 * 预加载图片
 * @param imageUrl 图片URL
 * @returns Promise<boolean> 是否加载成功
 */
export function preloadImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      console.log('✅ [图片预加载] 成功:', imageUrl)
      resolve(true)
    }
    
    img.onerror = () => {
      console.error('❌ [图片预加载] 失败:', imageUrl)
      resolve(false)
    }
    
    // 设置超时
    setTimeout(() => {
      console.warn('⏰ [图片预加载] 超时:', imageUrl)
      resolve(false)
    }, 10000)
    
    img.src = getProxiedImageUrl(imageUrl)
  })
}

/**
 * 批量预加载图片
 * @param imageUrls 图片URL列表
 * @returns Promise<boolean[]> 加载结果列表
 */
export async function preloadImages(imageUrls: string[]): Promise<boolean[]> {
  console.log('🔄 [批量预加载] 开始预加载', imageUrls.length, '张图片')
  
  const results = await Promise.allSettled(
    imageUrls.map(url => preloadImage(url))
  )
  
  const success = results.map(result => 
    result.status === 'fulfilled' ? result.value : false
  )
  
  const successCount = success.filter(Boolean).length
  console.log('✅ [批量预加载] 完成:', successCount, '/', imageUrls.length, '成功')
  
  return success
} 