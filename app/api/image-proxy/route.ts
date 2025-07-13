import { NextRequest, NextResponse } from 'next/server'

/**
 * 图片代理API - 解决跨域图片加载和防盗链问题
 * 使用方法: /api/image-proxy?url=encodeURIComponent(imageUrl)
 */
export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取图片URL
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    // 验证图片URL参数
    if (!imageUrl) {
      return new NextResponse('缺少图片URL参数', { status: 400 })
    }

    // 解码图片URL
    const decodedUrl = decodeURIComponent(imageUrl)
    console.log('🖼️ [图片代理] 请求代理图片:', decodedUrl)

    // 验证URL格式
    let targetUrl: URL
    try {
      targetUrl = new URL(decodedUrl)
    } catch (error) {
      console.error('❌ [图片代理] 无效的图片URL:', decodedUrl)
      return new NextResponse('无效的图片URL', { status: 400 })
    }

    // 协议处理：自动将HTTP转换为HTTPS（针对小红书CDN）
    if (targetUrl.protocol === 'http:' && targetUrl.hostname.includes('xhscdn.com')) {
      console.log('🔄 [图片代理] 将小红书HTTP URL转换为HTTPS:', decodedUrl)
      targetUrl.protocol = 'https:'
      const httpsUrl = targetUrl.toString()
      console.log('🔄 [图片代理] 转换后的URL:', httpsUrl)
    } else if (targetUrl.protocol !== 'https:') {
      console.error('❌ [图片代理] 不支持的协议:', targetUrl.protocol)
      return new NextResponse('只支持HTTPS协议的图片', { status: 400 })
    }

    // 允许的图片域名列表（可以根据需要扩展）
    const allowedDomains = [
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

    // 检查域名是否在允许列表中
    const isAllowedDomain = allowedDomains.some(domain => 
      targetUrl.hostname === domain || targetUrl.hostname.endsWith('.' + domain)
    )

    if (!isAllowedDomain) {
      console.error('❌ [图片代理] 不允许的域名:', targetUrl.hostname)
      return new NextResponse('不支持的图片域名', { status: 403 })
    }

    // 设置请求头，模拟浏览器请求避免防盗链
    const headers = new Headers()
    headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    headers.set('Accept', 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8')
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')
    headers.set('Accept-Encoding', 'gzip, deflate, br')
    headers.set('Cache-Control', 'no-cache')
    headers.set('Pragma', 'no-cache')
    headers.set('Sec-Fetch-Dest', 'image')
    headers.set('Sec-Fetch-Mode', 'no-cors')
    headers.set('Sec-Fetch-Site', 'cross-site')
    
    // 对于小红书图片，添加特定的Referer和Origin
    if (targetUrl.hostname.includes('xhscdn.com') || targetUrl.hostname.includes('xiaohongshu.com')) {
      // 尝试多种不同的请求头策略
      headers.set('Referer', 'https://www.xiaohongshu.com/')
      headers.set('Origin', 'https://www.xiaohongshu.com')
      headers.set('Sec-Ch-Ua', '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"')
      headers.set('Sec-Ch-Ua-Mobile', '?0')
      headers.set('Sec-Ch-Ua-Platform', '"macOS"')
      headers.set('Upgrade-Insecure-Requests', '1')
      headers.set('Dnt', '1')
      
      // 添加更多可能有用的头部
      headers.set('Sec-Fetch-User', '?1')
      headers.set('Sec-Fetch-Site', 'same-origin')
      headers.set('Sec-Fetch-Mode', 'navigate')
      headers.set('Sec-Fetch-Dest', 'document')
      
      // 移除可能导致问题的头部
      headers.delete('Cache-Control')
      headers.delete('Pragma')
      headers.delete('Sec-Fetch-Dest')
      headers.delete('Sec-Fetch-Mode')
      headers.delete('Sec-Fetch-Site')
      
      // 重新设置为图片请求
      headers.set('Sec-Fetch-Dest', 'image')
      headers.set('Sec-Fetch-Mode', 'no-cors')
      headers.set('Sec-Fetch-Site', 'cross-site')
    }

    // 请求原始图片（使用可能转换过的URL）
    const finalUrl = targetUrl.toString()
    console.log('🌐 [图片代理] 请求最终URL:', finalUrl)
    
    let response: Response | undefined
    let retryCount = 0
    const maxRetries = 2
    
    // 重试机制
    while (retryCount <= maxRetries) {
      try {
        response = await fetch(finalUrl, {
          headers,
          // 设置超时时间
          signal: AbortSignal.timeout(8000) // 8秒超时
        })
        
        // 检查响应状态
        if (response.ok) {
          break // 成功，跳出重试循环
        } else if (response.status === 403 || response.status === 404) {
          // 对于403/404错误，不进行重试
          console.error('❌ [图片代理] 获取图片失败（不重试）:', response.status, response.statusText)
          return new NextResponse('图片不存在或访问被拒绝', { status: response.status })
        } else {
          console.warn(`⚠️ [图片代理] 尝试 ${retryCount + 1}/${maxRetries + 1} 失败:`, response.status, response.statusText)
          retryCount++
          
          if (retryCount <= maxRetries) {
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
          }
        }
      } catch (error) {
        console.error(`❌ [图片代理] 尝试 ${retryCount + 1}/${maxRetries + 1} 异常:`, error)
        retryCount++
        
        if (retryCount <= maxRetries) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        } else {
          throw error // 重新抛出最后一次的错误
        }
      }
    }
    
    // 如果所有重试都失败了
    if (!response || !response.ok) {
      console.error('❌ [图片代理] 所有重试都失败了:', response?.status || 'unknown')
      return new NextResponse('获取图片失败', { status: response?.status || 500 })
    }

    // 检查内容类型是否为图片
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('❌ [图片代理] 非图片内容类型:', contentType)
      return new NextResponse('非图片内容', { status: 400 })
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()
    
    // 设置响应头
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType)
    responseHeaders.set('Cache-Control', 'public, max-age=86400') // 缓存24小时
    responseHeaders.set('Access-Control-Allow-Origin', '*') // 允许跨域
    responseHeaders.set('Access-Control-Allow-Methods', 'GET')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type')

    console.log('✅ [图片代理] 成功代理图片:', finalUrl, '大小:', imageBuffer.byteLength, 'bytes')

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('❌ [图片代理] 代理失败:', error)
    
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse('图片请求超时', { status: 408 })
    }
    
    // 处理其他错误
    return new NextResponse('图片代理服务异常', { status: 500 })
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 