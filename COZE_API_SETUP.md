# Coze API 接口配置说明

本项目使用 Coze API 来获取小红书数据，包括搜索笔记和获取笔记详情两个功能。

## 🚨 重要：解决 401 错误

如果您遇到 "HTTP错误: 401 Unauthorized"，请按以下步骤配置：

### 1. 创建环境变量文件

在项目根目录（与 `package.json` 同级）创建 `.env.local` 文件：

```bash
# Coze API Token（必需）
COZE_API_TOKEN=your_coze_api_token_here

# 搜索接口工作流ID（必需）
COZE_SEARCH_WORKFLOW_ID=7511639630044119067

# 笔记详情接口工作流ID（必需）
COZE_DETAIL_WORKFLOW_ID=7511959723135762472

# Supabase 配置（必需）
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
- ✅ COZE_SEARCH_WORKFLOW_ID 已配置
- ✅ COZE_DETAIL_WORKFLOW_ID 已配置

如果有问题，会显示具体的错误信息和解决建议。

## 获取 Coze API Token

1. 访问 [Coze 开放平台](https://www.coze.cn/open)
2. 登录您的账户
3. 创建应用或使用现有应用
4. 在应用设置中获取 API Token
5. 将真实的 Token 替换 `.env.local` 文件中的 `your_coze_api_token_here`

**重要提示：**
- Token 通常以 `pat_` 开头
- 不要在 Token 前后添加引号
- 确保 Token 没有多余的空格

## Workflow ID 说明

当前使用的 Workflow ID 是 `7511639630044119067`，这是您提供的小红书搜索工作流。如果您需要使用其他工作流，请：

1. 在 Coze 平台创建或配置您的工作流
2. 获取工作流的 ID
3. 更新 `.env.local` 中的 `COZE_SEARCH_WORKFLOW_ID` 值

## 小红书 Cookie 配置

用户需要在网站中配置小红书的 Cookie 才能进行搜索：

1. 用户登录网站后，进入个人设置
2. 在 Cookie 设置中粘贴小红书的 Cookie 字符串
3. Cookie 格式示例：
```
abRequestId=bcc474b6-9535-53b3-8729-0faddc44a244; a1=196e7ea0582vo9ozc2czk9jvzze7yh7oo6uww2zk430000847149; webId=910ade238051bf5af6c011ab7b0b4910; ...
```

## API 接口说明

### 1. 搜索接口

**工作流ID**: `7511639630044119067`

**功能**: 根据关键词搜索小红书笔记

**请求参数**:
```javascript
{
  "cookieStr": "用户的小红书Cookie",
  "keywords": "搜索关键词",
  "noteType": 0, // 0=全部，1=视频，2=图文
  "sort": 0, // 0=综合，1=最新，2=最热
  "totalNumber": 20 // 获取数量
}
```

### 2. 笔记详情接口

**工作流ID**: `7511959723135762472`

**功能**: 获取指定笔记的详细信息

**请求参数**:
```javascript
{
  "cookieStr": "用户的小红书Cookie",
  "noteUrl": "笔记的完整URL"
}
```

**返回数据结构**:
```javascript
{
  "code": 0,
  "data": {
    "note": {
      "note_id": "笔记ID",
      "note_display_title": "笔记标题",
      "note_desc": "笔记内容描述",
      "note_image_list": ["图片URL数组"],
      "note_tags": ["标签数组"],
      "auther_nick_name": "作者昵称",
      "auther_avatar": "作者头像",
      "note_liked_count": "点赞数",
      "collected_count": "收藏数",
      "comment_count": "评论数",
      "share_count": "分享数",
      "note_create_time": "创建时间",
      // ... 其他字段
    }
  }
}
```

## 功能特性

### 搜索功能
- 支持关键词搜索
- 支持筛选笔记类型（全部/视频/图文）
- 支持排序方式（综合/最新/最热）
- 支持自定义获取数量

### 笔记详情功能
- 支持多图展示（图片轮播）
- 自动分离正文内容和标签
- 支持视频笔记信息展示
- 显示完整的互动数据（点赞、收藏、评论、分享）
- 显示作者信息和发布时间

## 数据处理

### 正文和标签分离
系统会自动处理笔记描述，将正文内容和标签分离：

1. **正文内容**: 移除话题标签后的纯文本内容
2. **标签提取**: 从描述中提取 `#标签[话题]#` 和 `#标签#` 格式的标签

### 图片处理
- 支持多图展示
- 提供图片轮播功能
- 显示图片计数和导航
- 支持点击切换图片

## 错误处理

系统提供完整的错误处理机制：

- API认证失败提示
- 网络请求错误处理
- 数据解析错误处理
- 用户友好的错误提示

## 使用流程

1. 用户在搜索页面输入关键词搜索笔记
2. 点击感兴趣的笔记卡片
3. 系统自动调用详情接口获取完整信息
4. 在弹窗中展示笔记的详细内容和图片

## 注意事项

- 确保 Cookie 设置正确，否则无法获取数据
- 搜索和详情接口使用不同的工作流ID，请勿混淆
- 建议在生产环境中设置合适的请求频率限制

## 测试方法

1. 确保环境变量配置正确
2. 用户登录并配置Cookie
3. 在首页或搜索页面输入关键词（如"窗帘"）
4. 查看是否能正常返回搜索结果

## 注意事项

- Cookie 可能会过期，用户需要定期更新
- API 调用有频率限制，请合理使用
- 确保 Coze 工作流的输入输出格式与代码中的类型定义匹配 