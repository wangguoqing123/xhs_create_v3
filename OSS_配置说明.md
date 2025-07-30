# OSS配置说明（已废弃）

> 📝 **注意**: 详细的OSS配置指南请参考 [ALIYUN_OSS_SETUP_GUIDE.md](./ALIYUN_OSS_SETUP_GUIDE.md)，主要文档已迁移到 [README.md](./README.md)。

## 🔍 问题诊断（历史记录）

封面没有上传到OSS的原因是：**OSS环境变量未配置**

当前系统会自动降级处理：
- 如果OSS未配置 → 封面存储为原始小红书链接
- 如果OSS已配置 → 封面上传到OSS存储

## 📋 OSS配置步骤

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件，添加以下配置：

```bash
# 阿里云OSS配置
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your_bucket_name
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

### 2. 获取阿里云OSS配置信息

#### 2.1 创建OSS Bucket
1. 登录阿里云控制台
2. 搜索"对象存储 OSS"
3. 创建Bucket：
   - 名称：`xhs-covers-你的标识`
   - 地域：选择合适的地域
   - 读写权限：**公共读**（重要！）

#### 2.2 获取Access Key
1. 点击控制台右上角头像 → AccessKey管理
2. 创建AccessKey获取：
   - AccessKey ID
   - AccessKey Secret

#### 2.3 配置CORS（跨域）
在OSS控制台 → 你的Bucket → 权限管理 → 跨域设置：
- 来源：`*`
- 方法：GET, POST, PUT, DELETE, HEAD
- 允许Headers：`*`

### 3. 重启应用

配置完成后重启开发服务器：
```bash
npm run dev
```

## 🔧 功能说明

### 当前实现状态

✅ **已实现**：
- OSS工具函数 (`lib/oss.ts`)
- 带OSS上传的数据转换函数 (`convertCozeNoteToInsertWithOSS`)
- 链接导入时自动OSS上传
- 自动降级处理（OSS失败时使用原始链接）

✅ **降级策略**：
- OSS未配置：直接使用原始链接，不报错
- OSS上传失败：使用原始链接作为降级
- 确保功能正常运行

### 使用效果

**OSS未配置时**：
- `cover_image`: null 或 原始小红书链接
- `original_cover_url`: 原始小红书链接

**OSS已配置时**：
- `cover_image`: OSS链接 (如：`https://your-bucket.oss-cn-hangzhou.aliyuncs.com/covers/note123/123456_abc123.jpg`)
- `original_cover_url`: 原始小红书链接

## 🎯 验证方法

### 1. 检查OSS配置状态
导入链接时查看控制台日志：
- `⚠️ [OSS] OSS未配置，返回原始图片URL` → 未配置
- `✅ [OSS] 图片上传成功` → 配置成功

### 2. 检查数据库数据
查看 `explosive_contents` 表的 `cover_image` 字段：
- 如果是OSS链接 → 上传成功
- 如果是小红书链接 → 使用原始链接

## 💰 OSS费用说明

阿里云OSS按使用量计费：
- 存储费：约 ¥0.12/GB/月
- 请求费：约 ¥0.01/万次
- 流量费：约 ¥0.5/GB

小规模使用（几千张图片）月费用通常在几元到几十元。

## 🚨 注意事项

1. **Bucket权限**：必须设置为"公共读"才能正常访问图片
2. **地域选择**：选择离用户最近的地域提升访问速度
3. **CORS配置**：必须正确配置跨域才能在网页中正常显示
4. **密钥安全**：不要将AccessKey提交到代码仓库

## 🔄 现在可以做什么

即使没有配置OSS，链接导入功能仍然正常工作：
1. 封面会存储为原始小红书链接
2. 通过图片代理服务正常显示
3. 后续可以随时配置OSS并重新导入

如需立即使用OSS，请按照上述步骤配置后重启应用。 