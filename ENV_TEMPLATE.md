# 环境变量配置指南

## 📝 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件，并添加以下配置：

```env
# ============================================
# 数据库配置 - 阿里云RDS MySQL
# ============================================

# MySQL数据库连接信息（替换为你的实际配置）
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_NAME=xhs_create_v3
DB_USER=app_user
DB_PASSWORD=你的数据库密码
DB_CHARSET=utf8mb4

# ============================================
# JWT认证配置
# ============================================

# JWT密钥（请生成一个强密钥）
JWT_SECRET=your-super-secret-jwt-key-here

# ============================================
# 邮件服务配置（必需 - 用于发送验证码）
# ============================================

# QQ邮箱SMTP配置（推荐）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=your-qq-auth-code

# 或者使用Gmail SMTP配置
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# ============================================
# 其他API配置
# ============================================

# Coze API配置
COZE_API_KEY=your_coze_api_key_here
COZE_BOT_ID=your_coze_bot_id_here

# Ark API配置
ARK_API_KEY=your_ark_api_key_here
```

## 🔧 配置说明

### 数据库配置
- `DB_HOST`: 阿里云RDS的连接地址
- `DB_PORT`: 数据库端口（通常是3306）
- `DB_NAME`: 数据库名称（xhs_create_v3）
- `DB_USER`: 数据库用户名（app_user）
- `DB_PASSWORD`: 数据库密码
- `DB_CHARSET`: 字符集（utf8mb4）

### JWT配置
- `JWT_SECRET`: 用于签名JWT令牌的密钥，建议使用至少32位的随机字符串

### 邮件配置（必需）
用于发送登录验证码，支持QQ邮箱和Gmail：

**QQ邮箱配置（推荐）：**
- `SMTP_HOST`: smtp.qq.com
- `SMTP_PORT`: 587
- `SMTP_USER`: 你的QQ邮箱地址
- `SMTP_PASSWORD`: QQ邮箱授权码（不是QQ密码）

**Gmail配置：**
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_PORT`: 587
- `SMTP_USER`: 你的Gmail地址
- `SMTP_PASSWORD`: Gmail应用专用密码

## 🔐 安全提醒

1. **不要将 `.env.local` 文件提交到版本控制系统**
2. **使用强密码和密钥**
3. **定期更换敏感信息**
4. **生产环境使用不同的配置**

## 🛠️ 生成JWT密钥

你可以使用以下方法生成JWT密钥：

### 方法1：使用Node.js
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### 方法2：使用在线工具
访问 https://generate-secret.now.sh/32 生成32位密钥

### 方法3：使用命令行
```bash
openssl rand -hex 32
```

## 🔧 QQ邮箱授权码获取步骤

1. **登录QQ邮箱网页版**
   - 访问 https://mail.qq.com
   - 使用你的QQ账号登录

2. **进入设置页面**
   - 点击右上角的"设置"
   - 选择"账户"选项卡

3. **开启SMTP服务**
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启"IMAP/SMTP服务"
   - 系统会要求发送短信验证

4. **获取授权码**
   - 验证成功后，系统会显示一个授权码
   - **这个授权码就是SMTP_PASSWORD，不是你的QQ密码**
   - 请妥善保存这个授权码

## ✅ 配置完成检查

配置完成后，确保：
- [ ] 数据库连接信息正确
- [ ] JWT密钥已设置
- [ ] 邮件SMTP配置正确（特别是QQ邮箱授权码）
- [ ] 文件权限设置正确（只有应用可读）
- [ ] 文件已添加到 `.gitignore`

## 🧪 测试配置

配置完成后，可以通过以下方式测试：

1. **测试邮件配置**
   ```bash
   curl http://localhost:3000/api/email-test
   ```

2. **测试发送验证码**
   - 启动应用后，在登录页面输入邮箱
   - 点击"发送验证码"按钮
   - 检查邮箱是否收到验证码 