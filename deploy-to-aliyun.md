# 阿里云服务器部署指南

## 环境变量配置

在服务器上创建 `.env.local` 文件：

```bash
cd /var/www/xhs_create_v3
vim .env.local
```

复制以下内容并替换真实值：

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
# 邮件服务配置
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

# ============================================
# 生产环境配置
# ============================================
NODE_ENV=production
PORT=3000
```

## 数据库初始化

```bash
# 连接到RDS数据库
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u app_user -p

# 执行建表脚本
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u app_user -p xhs_create_v3 < mysql_migrations/001_create_database_schema.sql
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u app_user -p xhs_create_v3 < mysql_migrations/002_create_account_positioning_table.sql
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u app_user -p xhs_create_v3 < mysql_migrations/003_create_rewrite_records_table.sql
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u app_user -p xhs_create_v3 < mysql_migrations/004_create_membership_system.sql
```

## 构建和启动项目

```bash
# 构建项目
pnpm build

# 使用PM2启动项目
pm2 start npm --name "xhs-create-v3" -- start

# 设置PM2开机自启
pm2 startup
pm2 save
```

## Nginx配置

创建Nginx配置文件：

```bash
vim /etc/nginx/sites-available/xhs-create-v3
```

配置内容：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/xhs-create-v3 /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

## 安全组配置

在阿里云控制台配置安全组规则：

1. 入方向规则：
   - HTTP：端口80，源地址0.0.0.0/0
   - HTTPS：端口443，源地址0.0.0.0/0
   - SSH：端口22，源地址你的IP（提高安全性）

## 域名配置（可选）

1. 购买域名
2. 在域名控制台添加A记录指向服务器IP
3. 配置SSL证书（推荐使用Let's Encrypt免费证书）

## 监控和维护

```bash
# 查看PM2进程状态
pm2 status

# 查看应用日志
pm2 logs xhs-create-v3

# 重启应用
pm2 restart xhs-create-v3

# 查看Nginx状态
systemctl status nginx
```

## 备份策略

1. 数据库定期备份
2. 代码版本控制
3. 环境变量文件备份

## 故障排查

1. 检查PM2进程状态
2. 查看应用日志
3. 检查数据库连接
4. 验证环境变量配置 