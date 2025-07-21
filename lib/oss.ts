import OSS from 'ali-oss'
import crypto from 'crypto'

// 检查OSS配置是否完整
const isOSSConfigured = 
  process.env.ALIYUN_OSS_ACCESS_KEY_ID && 
  process.env.ALIYUN_OSS_ACCESS_KEY_SECRET && 
  process.env.ALIYUN_OSS_BUCKET &&
  process.env.ALIYUN_OSS_REGION

// 创建OSS客户端
let client: OSS | null = null

if (isOSSConfigured) {
  try {
    client = new OSS({
      region: process.env.ALIYUN_OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.ALIYUN_OSS_BUCKET || ''
    })
    console.log('✅ [OSS] 客户端初始化成功')
  } catch (error) {
    console.error('❌ [OSS] 客户端初始化失败:', error)
  }
} else {
  console.log('⚠️ [OSS] 配置不完整，将跳过OSS上传功能')
}

/**
 * 上传图片到OSS
 * @param imageUrl 原始图片URL
 * @param noteId 笔记ID
 * @returns 上传后的OSS URL
 */
export async function uploadImageToOSS(imageUrl: string, noteId: string): Promise<string> {
  // 如果OSS未配置，直接返回原始URL
  if (!client || !isOSSConfigured) {
    console.log('⚠️ [OSS] OSS未配置，返回原始图片URL:', imageUrl)
    return imageUrl
  }

  try {
    // 生成唯一文件名
    const timestamp = Date.now()
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').slice(0, 8)
    const fileName = `covers/${noteId}/${timestamp}_${hash}.jpg`
    
    console.log('🔄 [OSS] 开始下载图片:', imageUrl)
    
    // 下载原始图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
        'Accept': 'image/*,*/*;q=0.8'
      }
    })
    
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`)
    }
    
    const buffer = await response.arrayBuffer()
    console.log('📥 [OSS] 图片下载成功，大小:', buffer.byteLength, 'bytes')
    
    // 上传到OSS
    console.log('☁️ [OSS] 开始上传到OSS:', fileName)
    const result = await client.put(fileName, Buffer.from(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000' // 缓存1年
      }
    })
    
    console.log('✅ [OSS] 图片上传成功:', result.url)
    return result.url
    
  } catch (error) {
    console.error('❌ [OSS] 图片上传失败:', error)
    console.log('🔄 [OSS] 上传失败，返回原始URL作为降级处理')
    return imageUrl // 降级处理：返回原始URL
  }
}

/**
 * 删除OSS中的图片
 * @param ossUrl OSS图片URL
 */
export async function deleteImageFromOSS(ossUrl: string): Promise<void> {
  if (!client || !isOSSConfigured) {
    console.log('⚠️ [OSS] OSS未配置，跳过删除操作')
    return
  }

  try {
    // 从URL中提取文件名
    const url = new URL(ossUrl)
    const fileName = url.pathname.substring(1) // 移除开头的 "/"
    
    await client.delete(fileName)
    console.log('✅ [OSS] 图片删除成功:', fileName)
    
  } catch (error) {
    console.error('❌ [OSS] 图片删除失败:', error)
    throw error
  }
}

/**
 * 检查OSS是否已配置
 */
export function isOSSEnabled(): boolean {
  return !!client && !!isOSSConfigured
} 