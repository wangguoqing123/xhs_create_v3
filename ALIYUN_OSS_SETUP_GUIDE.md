# 阿里云 OSS 配置指导

本指南将教你如何配置阿里云 OSS（对象存储服务）来存储小红书笔记的封面图片。

## 1. 创建阿里云账号

如果还没有阿里云账号，请访问 [阿里云官网](https://www.aliyun.com) 注册账号并完成实名认证。

## 2. 开通对象存储 OSS 服务

1. 登录阿里云控制台
2. 搜索"对象存储 OSS"并进入服务
3. 点击"立即开通"按钮
4. 选择计费方式（建议按量付费，适合小规模使用）

## 3. 创建 Bucket（存储桶）

1. 在 OSS 控制台点击"创建 Bucket"
2. 填写配置：
   - **Bucket 名称**: `xhs-covers-您的标识` （全局唯一，建议加上您的标识）
   - **地域**: 选择离您用户最近的地域（如华东1-杭州）
   - **存储类型**: 标准存储
   - **读写权限**: 公共读（重要：图片需要公开访问）
   - **版本控制**: 关闭
   - **服务端加密**: 关闭
3. 点击"确定"创建

## 4. 创建访问密钥（Access Key）

1. 点击控制台右上角的用户头像
2. 选择"AccessKey 管理"
3. 点击"创建 AccessKey"
4. 记录下生成的：
   - **AccessKey ID**
   - **AccessKey Secret**
   
   ⚠️ **重要提示**：AccessKey Secret 只显示一次，请妥善保存！

## 5. 配置环境变量

在项目根目录的 `.env.local` 文件中添加以下配置：

```bash
# 阿里云 OSS 配置
ALIYUN_OSS_ACCESS_KEY_ID=您的AccessKey ID
ALIYUN_OSS_ACCESS_KEY_SECRET=您的AccessKey Secret
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=xhs-covers-您的标识
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

**配置说明**：
- `ALIYUN_OSS_REGION`: 根据您选择的地域填写
  - 华东1（杭州）：`oss-cn-hangzhou`
  - 华东2（上海）：`oss-cn-shanghai` 
  - 华北1（青岛）：`oss-cn-qingdao`
  - 华北2（北京）：`oss-cn-beijing`
  - 华南1（深圳）：`oss-cn-shenzhen`
- `ALIYUN_OSS_ENDPOINT`: 根据地域调整域名

## 6. 安装 OSS SDK

在项目中安装阿里云 OSS SDK：

```bash
npm install ali-oss
```

## 7. 配置 CORS 跨域访问

1. 在 OSS 控制台进入您的 Bucket
2. 点击左侧"权限管理" → "跨域设置"
3. 点击"设置"，添加规则：
   - **来源**: `*` （或填写您的域名，如：`https://yoursite.com`）
   - **允许 Methods**: GET, POST, PUT, DELETE, HEAD
   - **允许 Headers**: `*`
   - **暴露 Headers**: ETag, x-oss-request-id
   - **缓存时间**: 0

## 8. 创建 OSS 工具函数

创建 `lib/oss.ts` 文件：

```typescript
import OSS from 'ali-oss'
import crypto from 'crypto'

// 创建 OSS 客户端
const client = new OSS({
  region: process.env.ALIYUN_OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.ALIYUN_OSS_BUCKET || ''
})

/**
 * 上传图片到 OSS
 * @param imageUrl 原始图片URL
 * @param noteId 笔记ID
 * @returns 上传后的OSS URL
 */
export async function uploadImageToOSS(imageUrl: string, noteId: string): Promise<string> {
  try {
    // 生成唯一文件名
    const timestamp = Date.now()
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').slice(0, 8)
    const fileName = `covers/${noteId}/${timestamp}_${hash}.jpg`
    
    // 下载原始图片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.statusText}`)
    }
    
    const buffer = await response.arrayBuffer()
    
    // 上传到 OSS
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
    throw error
  }
}

/**
 * 删除 OSS 中的图片
 * @param ossUrl OSS图片URL
 */
export async function deleteImageFromOSS(ossUrl: string): Promise<void> {
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
```

## 9. 在导入功能中使用 OSS

修改 `lib/mysql-explosive-contents.ts` 中的 `convertCozeNoteToInsert` 函数：

```typescript
import { uploadImageToOSS } from './oss'

export async function convertCozeNoteToInsertWithOSS(cozeData: any, noteUrl: string): Promise<ExplosiveContentInsert> {
  const noteDetail = cozeData.note_detail
  
  // 解析数字字符串，移除逗号
  const parseCount = (countStr: string): number => {
    return parseInt(countStr.replace(/,/g, '')) || 0
  }
  
  // 上传封面图到 OSS
  let coverImageUrl: string | null = null
  let originalCoverUrl: string | null = null
  
  if (noteDetail.note_image_list?.[0]) {
    originalCoverUrl = noteDetail.note_image_list[0]
    try {
      coverImageUrl = await uploadImageToOSS(originalCoverUrl, noteDetail.note_id)
    } catch (error) {
      console.error('封面图上传失败，使用原始链接:', error)
      coverImageUrl = originalCoverUrl
    }
  }
  
  return {
    title: noteDetail.note_display_title || '未设置标题',
    content: noteDetail.note_desc || '',
    cover_image: coverImageUrl,
    original_cover_url: originalCoverUrl,
    author_name: noteDetail.auther_nick_name || null,
    author_id: noteDetail.auther_user_id || null,
    author_avatar: noteDetail.auther_avatar || null,
    likes_count: parseCount(noteDetail.note_liked_count || '0'),
    collects_count: parseCount(noteDetail.collected_count || '0'),
    comments_count: parseCount(noteDetail.comment_count || '0'),
    track_id: cozeData.note_detail1 || 7, // 赛道ID，默认7（其他）
    tone_id: cozeData.kouwen || 0, // 口吻ID，默认0（其他）
    type_id: cozeData.note_type || 0, // 类型ID，默认0（其他）
    note_url: noteUrl,
    note_id: noteDetail.note_id || null,
    tags: noteDetail.note_tags || [],
    published_at: noteDetail.note_create_time || null,
    status: 'enabled'
  }
}
```

## 10. 验证配置

启动应用后，尝试导入一个小红书链接，观察控制台日志：
- ✅ 看到 "图片上传成功" 表示配置正确
- ❌ 如果出现错误，检查以下项：
  - AccessKey 是否正确
  - Bucket 名称是否正确
  - 地域设置是否匹配
  - Bucket 权限是否设置为"公共读"

## 11. 费用说明

阿里云 OSS 按使用量计费：
- **存储费用**: 约 ¥0.12/GB/月
- **请求费用**: 约 ¥0.01/万次
- **流量费用**: 约 ¥0.5/GB

对于小规模使用（每月几千张图片），费用通常在几元到几十元。

## 12. 安全建议

1. **使用子账号**: 不要使用主账号的 AccessKey，创建子账号并授予最小权限
2. **定期轮换**: 定期更换 AccessKey
3. **访问控制**: 如果可能，设置更严格的访问控制规则
4. **监控使用**: 定期检查 OSS 使用情况和费用

## 故障排除

### 常见错误及解决方案

1. **403 Forbidden**
   - 检查 AccessKey 是否正确
   - 确认 Bucket 权限设置为"公共读"
   - 验证子账号权限（如果使用子账号）

2. **NoSuchBucket**
   - 检查 Bucket 名称是否正确
   - 确认地域设置是否匹配

3. **图片无法访问**
   - 确认 Bucket 读写权限设置为"公共读"
   - 检查 CORS 设置是否正确

4. **上传失败**
   - 检查网络连接
   - 确认原始图片URL可访问
   - 验证 OSS SDK 是否正确安装

如果遇到其他问题，请查看阿里云 OSS 官方文档或联系技术支持。 