# Supabase 设置指南

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账户
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - Name: `xhs-create-v3`
   - Database Password: 设置一个强密码
   - Region: 选择离您最近的区域

### 2. 获取项目配置

项目创建完成后，在项目仪表板中：

1. 点击左侧菜单的 "Settings" 
2. 选择 "API" 选项卡
3. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (很长的字符串)

### 3. 配置环境变量

在项目根目录的 `.env.local` 文件中替换以下内容：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 配置认证设置

在 Supabase 仪表板中：

1. 点击左侧菜单的 "Authentication"
2. 选择 "Settings" 选项卡
3. 在 "Auth Settings" 部分：
   - 确保 "Enable email confirmations" 已启用
   - 设置 "Site URL" 为 `http://localhost:3000` (开发环境)
   - 在生产环境中，将其设置为您的域名

### 5. 配置邮件模板（可选）

在 "Authentication" > "Email Templates" 中，您可以自定义：
- 验证码邮件模板
- 邮件发送者信息
- 邮件样式

### 6. 测试配置

1. 重启开发服务器：`pnpm dev`
2. 访问 `http://localhost:3001`
3. 检查页面底部的 "Supabase 状态" 卡片
4. 如果显示 "已配置"，说明设置成功
5. 点击 "登录" 按钮测试认证功能

## 🔧 功能说明

### 邮箱验证码认证

- 用户输入邮箱地址
- 系统发送6位数验证码到邮箱
- 用户输入验证码完成登录/注册
- 如果用户不存在，自动创建新用户
- 如果用户已存在，直接登录

### 认证状态管理

- 使用 React Context 管理全局认证状态
- 自动检测用户登录状态
- 支持登出功能
- 在 Header 中显示用户信息

## 🛠️ 故障排除

### 常见问题

1. **"Invalid URL" 错误**
   - 检查 `NEXT_PUBLIC_SUPABASE_URL` 是否正确
   - 确保URL以 `https://` 开头

2. **"Invalid API key" 错误**
   - 检查 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
   - 确保使用的是 anon public key，不是 service_role key

3. **验证码收不到**
   - 检查邮箱地址是否正确
   - 查看垃圾邮件文件夹
   - 确认 Supabase 项目的邮件配置

4. **认证状态不更新**
   - 确保组件被 `AuthProvider` 包裹
   - 检查浏览器控制台是否有错误

### 开发调试

在浏览器开发者工具中，您可以：
- 查看 `localStorage` 中的 Supabase 会话信息
- 检查网络请求是否正常
- 查看控制台错误信息

## 📚 更多资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase 指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) 