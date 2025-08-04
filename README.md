# 小红书创作工具 v3 - 完整文档

## 📋 项目概述

这是一个基于 Next.js 和 MySQL 的小红书内容创作工具，支持用户认证、内容搜索、批量改写、爆款内容管理等功能。项目集成了 Coze AI 接口和阿里云OSS，为用户提供全方位的内容创作解决方案。

**项目版本**: v3.0  
**技术栈**: Next.js + MySQL + TypeScript + Tailwind CSS

## 🚀 核心功能

### 用户认证系统
- 邮箱验证码登录/注册
- JWT令牌认证
- 用户资料管理
- 积分系统与会员管理
- 会员等级显示（入门/标准/高级）

### 内容创作功能
- **小红书内容搜索**：支持关键词搜索和多条件筛选
- **批量内容改写**：使用 Coze AI 进行内容改写
- **爆款内容仿写**：基于精选爆款内容进行批量仿写
- **账号定位分析**：AI分析用户账号定位

### 管理员功能
- **爆款内容管理**：支持添加、编辑、删除爆款内容
- **链接批量导入**：支持小红书链接批量导入
- **封面更新**：批量更新内容封面图片
- **CSV数据导入**：批量导入CSV格式的内容数据
- **用户管理**：会员管理、积分操作、信用记录

### 数据管理
- **笔记分类系统**：
  - 赛道分类：装修、石材、旅游、留学、保险、考研、其他
  - 内容类型：测评内容、推荐/营销、干货内容、其他
  - 内容口吻：商家口吻、素人口吻、其他
- **多维度筛选**：支持按行业、类型、口吻等多条件筛选

## 🛠️ 技术架构

### 前端技术栈
- **框架**: Next.js 15.2.4 (React 19)
- **样式**: Tailwind CSS + Radix UI
- **状态管理**: React Hooks
- **类型检查**: TypeScript
- **表单处理**: React Hook Form + Zod
- **主题切换**: next-themes

### 后端技术栈
- **数据库**: MySQL 8.0 (推荐阿里云RDS)
- **认证**: JWT + bcryptjs
- **邮件服务**: Nodemailer (支持QQ邮箱/Gmail)
- **文件存储**: 阿里云OSS
- **API集成**: Coze AI

### 核心依赖
```json
{
  "next": "15.2.4",
  "react": "^19",
  "mysql2": "^3.6.5",
  "jsonwebtoken": "^9.0.2",
  "ali-oss": "^6.23.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

## 🗄️ 数据库设计

### 核心数据表
- **users** - 用户基本信息
- **profiles** - 用户资料和设置
- **explosive_contents** - 爆款内容数据
- **note_tracks** - 笔记赛道分类
- **note_types** - 笔记类型分类
- **note_tones** - 笔记口吻分类
- **credit_transactions** - 积分交易记录
- **memberships** - 会员信息
- **batch_tasks** - 批量任务管理

### 数据库配置
推荐使用阿里云RDS MySQL Serverless：
- 计费方式: 按量付费
- 数据库引擎: MySQL 8.0
- 最小RCU: 0.5，最大RCU: 1-2
- 存储: 20GB SSD云盘

## ⚙️ 环境配置

### 环境变量配置
在项目根目录创建 `.env.local` 文件：

```bash
# 数据库配置
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_NAME=xhs_create_v3
DB_USER=app_user
DB_PASSWORD=你的数据库密码
DB_CHARSET=utf8mb4

# JWT认证配置
JWT_SECRET=你的32位随机字符串

# 邮件服务配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=你的QQ邮箱授权码

# Coze API配置
COZE_API_TOKEN=你的Coze_API_Token
COZE_WORKFLOW_ID=7529549700945477647

# 阿里云OSS配置（可选）
ALIYUN_OSS_ACCESS_KEY_ID=你的AccessKey ID
ALIYUN_OSS_ACCESS_KEY_SECRET=你的AccessKey Secret
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=xhs-covers-你的标识
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com

# 生产环境配置
NODE_ENV=production
PORT=3000
```

### 第三方服务配置

#### QQ邮箱SMTP配置
1. 登录QQ邮箱网页版
2. 设置 → 账户 → 开启IMAP/SMTP服务
3. 获取授权码（不是QQ密码）
4. 将授权码填入 `SMTP_PASSWORD`

#### Coze API配置
1. 访问 [Coze 开放平台](https://www.coze.cn/open)
2. 创建应用获取API Token
3. Token通常以 `pat_` 开头

#### 阿里云OSS配置（可选）
1. 开通对象存储OSS服务
2. 创建Bucket，设置为公共读
3. 获取AccessKey ID和Secret
4. 配置CORS跨域访问

## 🚀 快速开始

### 1. 环境准备
- Node.js 18+
- pnpm (推荐) 或 npm
- MySQL 数据库

### 2. 安装依赖
```bash
pnpm install
```

### 3. 数据库初始化
```bash
# 执行数据库迁移脚本
mysql -u username -p database_name < mysql_migrations/001_create_database_schema.sql
```

### 4. 启动开发服务器
```bash
pnpm dev
```

### 5. 访问应用
- 主页: http://localhost:3000
- 管理员页面: http://localhost:3000/admin
- 爆文改写: http://localhost:3000/note-rewrite

## 📊 主要页面功能

### 用户页面
- **首页** (`/`) - 功能介绍和导航
- **搜索页面** (`/search`) - 小红书内容搜索
- **改写页面** (`/rewrite`) - 内容改写工具
- **爆文仿写** (`/note-rewrite`) - 基于爆款内容的仿写
- **账号定位** (`/account-positioning`) - AI账号定位分析
- **作者检索** (`/author-copy`) - 作者内容检索
- **积分历史** (`/credits-history`) - 积分使用记录
- **价格页面** (`/prices`) - 会员套餐价格

### 管理员页面
- **管理控制台** (`/admin`) - 全功能管理后台
- **封面更新** (`/admin/cover-update`) - 批量更新封面

## 🔌 API接口

### 用户认证接口
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/verify-code` - 验证登录
- `GET /api/auth/me` - 获取用户信息
- `POST /api/auth/logout` - 登出

### 内容管理接口
- `POST /api/search` - 搜索小红书内容
- `POST /api/rewrite` - 内容改写
- `GET /api/explosive-contents` - 获取爆款内容
- `GET /api/note-detail` - 获取笔记详情

### 管理员接口
- `GET /api/admin/explosive-contents` - 爆款内容管理
- `POST /api/admin/explosive-contents/import-links` - 链接导入
- `POST /api/admin/explosive-contents/csv-import` - CSV导入
- `POST /api/admin/explosive-contents/batch-update-covers` - 封面更新

### 系统接口
- `GET /api/config-check` - 配置检查
- `GET /api/mysql-status` - 数据库状态
- `GET /api/credits/balance` - 积分余额
- `GET /api/membership/status` - 会员状态

## 🏗️ 部署指南

### 推荐部署方案
1. **Vercel**（推荐）- 零配置部署
2. **阿里云ECS** - 完全控制
3. **腾讯云CVM** - 备选方案

### 阿里云部署步骤
1. **准备环境**
   ```bash
   # 更新系统
   dnf update -y
   # 安装Node.js 18.x
   curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
   dnf install -y nodejs
   # 安装pnpm和PM2
   npm install -g pnpm pm2
   ```

2. **部署应用**
   ```bash
   # 上传代码
   cd /var/www
   git clone https://github.com/your-username/xhs_create_v3.git
   cd xhs_create_v3
   
   # 安装依赖
   pnpm install
   
   # 构建应用
   pnpm build
   
   # 启动应用
   pm2 start npm --name "xhs-create-v3" -- start
   pm2 startup && pm2 save
   ```

3. **配置Nginx**
   ```nginx
   server {
       listen 80;
       server_name _;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

### 更新部署
```bash
# 快速更新
cd /var/www/xhs_create_v3
git pull origin main
pm2 restart xhs-create-v3

# 完整更新（包含依赖）
git pull origin main
pnpm install
pnpm build
pm2 restart xhs-create-v3
```

# 最安全的同步方法
git stash  # 保存本地更改（如果有）
git fetch origin
git reset --hard origin/main  # 强制同步到远程最新版本
pnpm install  # 重新安装依赖
pnpm build   # 重新构建

## 🔧 使用指南

### 管理员使用
1. 登录管理员账户
2. 在个人设置中配置小红书Cookie
3. 使用链接导入功能批量导入内容
4. 管理用户会员和积分
5. 使用封面更新功能优化内容

### 用户使用
1. 邮箱验证码注册/登录
2. 在个人设置中配置小红书Cookie
3. 使用搜索功能查找内容
4. 选择内容进行改写或仿写
5. 查看积分消耗和会员状态

## 🛡️ 安全配置

### 生产环境安全
- 设置具体的数据库白名单IP
- 启用SSL数据库连接
- 使用强密码和密钥
- 定期更换敏感信息
- 配置防火墙规则

### JWT密钥生成
```bash
# 生成32位随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚨 故障排除

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

4. **Cookie配置问题**
   - 确保Cookie格式正确
   - 检查Cookie有效性
   - 重新获取最新Cookie

### 调试工具
- 浏览器开发者工具
- 控制台性能日志
- 数据库连接状态监控: `/api/mysql-status`
- 配置检查接口: `/api/config-check`

## 📈 性能优化

### 认证系统优化
- 智能本地缓存：5分钟缓存有效期
- 异步后台验证：不阻塞UI渲染
- 智能更新：减少不必要的数据库写入

### 数据库连接优化
- 连接池预热机制
- 自动重连和重试
- 连接池状态监控
- 冷启动问题解决

### UI组件优化
- 响应式设计适配移动端
- 组件懒加载
- 图片懒加载和压缩
- CSS优化和压缩

## 📚 开发指南

### 项目结构
```
xhs_create_v3/
├── app/                    # Next.js 应用目录
│   ├── api/               # API路由
│   ├── admin/             # 管理员页面
│   └── [pages]/           # 各功能页面
├── components/            # React组件
├── lib/                   # 工具库和配置
├── mysql_migrations/      # 数据库迁移脚本
├── scripts/              # 部署和工具脚本
└── public/               # 静态资源
```

### 组件设计原则
- 高度可复用的组件架构
- TypeScript类型安全
- memo优化性能
- 响应式设计

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint代码规范
- 组件命名采用PascalCase
- 文件命名采用kebab-case

## 🔄 更新日志

### v3.0 (2024年12月)
- 全新的爆款内容管理系统
- 新增会员管理和积分系统
- 集成阿里云OSS存储
- 优化用户界面和交互体验
- 新增多维度筛选功能
- 完善的管理员后台

### 主要功能更新
- 链接批量导入功能
- CSV数据导入支持
- 封面自动更新
- 会员等级显示
- 积分系统完善
- 响应式设计优化

## 📞 技术支持

如遇问题请按以下顺序排查：
1. 检查浏览器控制台错误
2. 查看服务器日志输出
3. 确认环境变量配置
4. 访问系统状态接口
5. 参考故障排除章节

### 联系方式
- 系统状态监控：`/api/mysql-status`
- 配置检查：`/api/config-check`
- 日志查看：`pm2 logs xhs-create-v3`

---

**小红书创作工具 v3** - 为内容创作者提供专业的工具和服务，助力优质内容创作。