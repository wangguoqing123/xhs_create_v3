# 小红书创作工具 v3 - 项目设置指南

## 📋 项目概述

这是一个基于 Next.js 和 MySQL 的小红书内容创作工具，支持用户认证、内容搜索、批量改写等功能。

## 🚀 快速开始

### 1. 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm
- MySQL 数据库（推荐阿里云RDS）

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境变量配置
在项目根目录创建 `.env.local` 文件：

```env
# ============================================
# 数据库配置 - 阿里云RDS MySQL
# ============================================
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_NAME=xhs_create_v3
DB_USER=app_user
DB_PASSWORD=你的数据库密码
DB_CHARSET=utf8mb4

# ============================================
# JWT认证配置
# ============================================
JWT_SECRET=your-super-secret-jwt-key-here

# ============================================
# 邮件服务配置（用于发送验证码）
# ============================================
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=your-qq-auth-code

# ============================================
# API配置
# ============================================
COZE_API_TOKEN=你的真实Coze_API_Token
COZE_WORKFLOW_ID=7511639630044119067
```

### 4. 数据库初始化
执行数据库迁移脚本：
```bash
# 在MySQL中执行 mysql_migrations/001_create_database_schema.sql
```

### 5. 启动开发服务器
```bash
pnpm dev
```

## 🔧 详细配置说明

### 数据库配置

#### 阿里云RDS MySQL Serverless 推荐配置
```
计费方式: 按量付费
地域: 华东1（杭州）或离你最近的地域
数据库引擎: MySQL 8.0
系列: Serverless
最小RCU: 0.5
最大RCU: 1-2
存储: 20GB SSD云盘
```

#### 数据库表结构
- `users` - 用户基本信息
- `profiles` - 用户资料和设置
- `email_verification_codes` - 邮箱验证码
- `batch_tasks` - 批量任务
- `task_notes` - 任务笔记
- `generated_contents` - 生成的内容
- `credit_transactions` - 积分交易记录

### 邮件配置

#### QQ邮箱配置（推荐）
1. 登录QQ邮箱网页版
2. 设置 → 账户 → 开启IMAP/SMTP服务
3. 获取授权码（不是QQ密码）
4. 将授权码填入 `SMTP_PASSWORD`

#### Gmail配置
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Coze API配置

#### 获取Token
1. 访问 [Coze 开放平台](https://www.coze.cn/open)
2. 创建应用获取API Token
3. Token通常以 `pat_` 开头

#### 小红书Cookie配置
用户需要在网站中配置小红书Cookie：
```
abRequestId=xxx; a1=xxx; webId=xxx; ...
```

## 🛡️ 安全配置

### JWT密钥生成
```bash
# 方法1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: OpenSSL
openssl rand -hex 32
```

### 生产环境安全
- 设置具体的数据库白名单IP
- 启用SSL数据库连接
- 使用强密码和密钥
- 定期更换敏感信息

## 📊 功能特性

### 用户认证
- 邮箱验证码登录/注册
- JWT令牌认证
- 用户资料管理
- 积分系统

### 内容功能
- 小红书内容搜索
- 批量内容改写
- 内容详情查看
- 搜索结果筛选

### 系统功能
- 数据库连接池优化
- 智能缓存机制
- 性能监控
- 错误处理

## 🚀 性能优化

### 认证系统优化
- **智能本地缓存**：5分钟缓存有效期
- **异步后台验证**：不阻塞UI渲染
- **智能更新**：减少不必要的数据库写入
- **加载速度提升**：缓存命中时99%+性能提升

### 数据库连接优化
- 连接池预热机制
- 自动重连和重试
- 连接池状态监控
- 冷启动问题解决

## 🎨 UI组件层级规范

### Z-Index层级
- **基础层级 (0-10)**：页面元素
- **UI组件 (20-50)**：导航、侧边栏、模态框
- **浮层组件 (60-100)**：Toast、下拉菜单、选择框
- **紧急层级 (999+)**：仅在必要时使用

### 组件对应关系
| 组件 | z-index | 说明 |
|------|---------|------|
| DialogContent | z-50 | 对话框内容 |
| SelectContent | z-[100] | 下拉选择框（需高于Dialog） |
| TooltipContent | z-40 | 工具提示 |
| DropdownMenuContent | z-90 | 下拉菜单 |

## 🧪 测试和调试

### 配置验证
```bash
# 访问配置检查接口
curl http://localhost:3000/api/config-check
```

### 邮件测试
```bash
# 测试邮件配置
curl http://localhost:3000/api/email-test
```

### 数据库状态
访问 `/api/mysql-status` 查看数据库连接状态

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `.env.local` 配置
   - 确认阿里云RDS白名单设置
   - 验证数据库用户权限

2. **验证码发送失败**
   - 检查SMTP配置
   - 确认QQ邮箱授权码正确
   - 查看控制台错误信息

3. **Coze API 401错误**
   - 检查API Token是否正确
   - 确认Token没有过期
   - 重启开发服务器

4. **页面加载慢**
   - 检查缓存配置
   - 查看网络请求
   - 确认数据库连接池状态

### 调试工具
- 浏览器开发者工具
- 控制台性能日志
- 数据库连接状态监控
- API响应时间统计

## 📚 API接口文档

### 认证接口
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/verify-code` - 验证登录
- `GET /api/auth/me` - 获取用户信息
- `POST /api/auth/logout` - 登出

### 搜索接口
- `POST /api/search` - 搜索小红书内容
- `GET /api/note-detail` - 获取笔记详情

### 批量改写接口
- `POST /api/batch-rewrite/create` - 创建批量任务
- `GET /api/batch-rewrite/list` - 获取任务列表
- `POST /api/batch-rewrite/process` - 处理任务

### 系统接口
- `GET /api/config-check` - 配置检查
- `GET /api/mysql-status` - 数据库状态
- `GET /api/credits/balance` - 积分余额

## 📦 部署指南

### 生产环境配置
1. 更新环境变量为生产值
2. 设置数据库白名单
3. 启用SSL连接
4. 配置域名和HTTPS
5. 设置监控告警

### 推荐部署平台
- Vercel（推荐）
- 阿里云ECS
- 腾讯云CVM
- AWS EC2

## 📞 技术支持

如遇问题请：
1. 检查浏览器控制台错误
2. 查看服务器日志
3. 确认环境变量配置
4. 参考故障排除章节

---

**项目版本**: v3.0
**最后更新**: 2024年12月
**技术栈**: Next.js + MySQL + TypeScript + Tailwind CSS 