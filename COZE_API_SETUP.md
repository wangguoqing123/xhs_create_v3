# Coze API 配置说明

## 🚨 重要：解决 401 错误

如果您遇到 "HTTP错误: 401 Unauthorized"，请按以下步骤配置：

### 1. 创建环境变量文件

在项目根目录（与 `package.json` 同级）创建 `.env.local` 文件：

```bash
# Coze API配置（必须配置）
COZE_API_TOKEN=你的真实Coze_API_Token
COZE_WORKFLOW_ID=7511639630044119067

# Supabase配置（如果还没有配置的话）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 检查文件位置

确保 `.env.local` 文件位于正确的位置：
```
xhs_create_v3/
├── .env.local          ← 应该在这里
├── package.json
├── next.config.mjs
└── ...
```

### 3. 重启开发服务器

配置完成后，必须重启开发服务器：
```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
# 或
pnpm dev
```

### 4. 验证配置

重启服务器后，访问以下地址检查配置状态：
```
http://localhost:3000/api/config-check
```

如果配置正确，您会看到：
- ✅ COZE_API_TOKEN 已配置
- ✅ COZE_WORKFLOW_ID 已配置

如果有问题，会显示具体的错误信息和解决建议。

## 获取 Coze API Token

1. 访问 [Coze 开放平台](https://www.coze.cn/open)
2. 登录您的账户
3. 创建应用或使用现有应用
4. 在应用设置中获取 API Token
5. 将真实的 Token 替换 `.env.local` 文件中的 `你的真实Coze_API_Token`

**重要提示：**
- Token 通常以 `pat_` 开头
- 不要在 Token 前后添加引号
- 确保 Token 没有多余的空格

## Workflow ID 说明

当前使用的 Workflow ID 是 `7511639630044119067`，这是您提供的小红书搜索工作流。如果您需要使用其他工作流，请：

1. 在 Coze 平台创建或配置您的工作流
2. 获取工作流的 ID
3. 更新 `.env.local` 中的 `COZE_WORKFLOW_ID` 值

## 小红书 Cookie 配置

用户需要在网站中配置小红书的 Cookie 才能进行搜索：

1. 用户登录网站后，进入个人设置
2. 在 Cookie 设置中粘贴小红书的 Cookie 字符串
3. Cookie 格式示例：
```
abRequestId=bcc474b6-9535-53b3-8729-0faddc44a244; a1=196e7ea0582vo9ozc2czk9jvzze7yh7oo6uww2zk430000847149; webId=910ade238051bf5af6c011ab7b0b4910; ...
```

## API 接口说明

### 搜索接口

**接口地址：** `POST /api/search`

**请求参数：**
```json
{
  "keywords": "搜索关键词",
  "cookieStr": "用户的小红书Cookie",
  "config": {
    "noteType": 0,  // 0=全部，1=视频，2=图文
    "sort": 0,      // 0=综合，1=最新，2=最热
    "totalNumber": 20  // 获取数量
  }
}
```

**响应数据：**
```json
{
  "success": true,
  "data": [
    {
      "id": "笔记ID",
      "title": "笔记标题",
      "cover": "封面图URL",
      "author": "作者昵称",
      "likes": 点赞数,
      "views": 浏览量,
      "content": "内容预览",
      "tags": ["标签1", "标签2"],
      "publishTime": "发布时间",
      "originalData": {} // 原始小红书数据
    }
  ],
  "total": 20,
  "config": {},
  "keywords": "搜索关键词"
}
```

## 错误处理

常见错误及解决方案：

1. **"用户未登录"** - 用户需要先登录网站
2. **"请先在设置中配置小红书Cookie"** - 用户需要配置有效的Cookie
3. **"HTTP错误: 401"** - Coze API Token 无效或过期
4. **"API错误"** - Coze API 返回错误，检查工作流配置
5. **"数据错误"** - 工作流返回的数据格式不正确

## 测试方法

1. 确保环境变量配置正确
2. 用户登录并配置Cookie
3. 在首页或搜索页面输入关键词（如"窗帘"）
4. 查看是否能正常返回搜索结果

## 注意事项

- Cookie 可能会过期，用户需要定期更新
- API 调用有频率限制，请合理使用
- 确保 Coze 工作流的输入输出格式与代码中的类型定义匹配 