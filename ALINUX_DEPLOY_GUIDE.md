# 阿里云Linux 3 部署完整指南

## 🚀 快速开始

### 第一步：基础环境安装

在你的服务器上运行以下命令：

```bash
# 1. 更新系统
dnf update -y

# 2. 安装基础软件
dnf install -y epel-release
dnf install -y curl wget git vim nginx mysql

# 3. 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# 4. 安装pnpm和PM2
npm install -g pnpm pm2

# 5. 启动Nginx
systemctl start nginx
systemctl enable nginx

# 6. 配置防火墙
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 第二步：创建项目目录

```bash
# 创建项目目录
mkdir -p /var/www/xhs_create_v3
cd /var/www/xhs_create_v3

# 验证目录创建成功
pwd
ls -la
```

### 第三步：上传项目代码

**方式1：使用scp上传（推荐新手）**

在你的Mac上运行：
```bash
# 上传整个项目
scp -r /Users/wangguoqing/xhs_create_v3/* root@你的服务器IP:/var/www/xhs_create_v3/

# 或者分别上传重要文件
scp -r /Users/wangguoqing/xhs_create_v3/app root@你的服务器IP:/var/www/xhs_create_v3/
scp -r /Users/wangguoqing/xhs_create_v3/components root@你的服务器IP:/var/www/xhs_create_v3/
scp -r /Users/wangguoqing/xhs_create_v3/lib root@你的服务器IP:/var/www/xhs_create_v3/
scp -r /Users/wangguoqing/xhs_create_v3/mysql_migrations root@你的服务器IP:/var/www/xhs_create_v3/
scp -r /Users/wangguoqing/xhs_create_v3/scripts root@你的服务器IP:/var/www/xhs_create_v3/
scp /Users/wangguoqing/xhs_create_v3/package.json root@你的服务器IP:/var/www/xhs_create_v3/
scp /Users/wangguoqing/xhs_create_v3/next.config.mjs root@你的服务器IP:/var/www/xhs_create_v3/
scp /Users/wangguoqing/xhs_create_v3/tailwind.config.ts root@你的服务器IP:/var/www/xhs_create_v3/
scp /Users/wangguoqing/xhs_create_v3/tsconfig.json root@你的服务器IP:/var/www/xhs_create_v3/
```

**方式2：使用git（如果代码已推送到GitHub）**
```bash
# 在服务器上运行
cd /var/www
git clone https://github.com/你的用户名/xhs_create_v3.git
cd xhs_create_v3
```

### 第四步：配置环境变量

在服务器上创建环境变量文件：
```bash
vim /var/www/xhs_create_v3/.env.local
```

复制并修改以下内容：
```env
# 数据库配置 - 阿里云RDS MySQL
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

# API配置
COZE_API_TOKEN=你的真实Coze_API_Token
COZE_WORKFLOW_ID=7511639630044119067

# 生产环境配置
NODE_ENV=production
PORT=3000
```

### 第五步：初始化数据库

```bash
# 进入项目目录
cd /var/www/xhs_create_v3

# 给脚本执行权限
chmod +x scripts/init-database.sh

# 运行数据库初始化
bash scripts/init-database.sh
```

### 第六步：安装依赖和构建项目

```bash
# 安装项目依赖
pnpm install

# 构建项目
pnpm build
```

### 第七步：启动项目

```bash
# 使用PM2启动项目
pm2 start npm --name "xhs-create-v3" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看运行状态
pm2 status
```

### 第八步：配置Nginx反向代理

```bash
# 创建Nginx配置文件
vim /etc/nginx/conf.d/xhs-create-v3.conf
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name _;

    # 增加客户端最大body大小
    client_max_body_size 50M;

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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

重启Nginx：
```bash
# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

## 🔍 验证部署

### 检查服务状态
```bash
# 检查PM2进程
pm2 status

# 检查Nginx状态
systemctl status nginx

# 检查端口监听
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
```

### 查看日志
```bash
# 查看应用日志
pm2 logs xhs-create-v3

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 测试访问
```bash
# 测试本地访问
curl http://localhost:3000
curl http://localhost

# 获取服务器IP
curl ifconfig.me
```

## 🎉 访问你的应用

打开浏览器访问：`http://你的服务器IP`

## 📝 常用管理命令

```bash
# PM2管理
pm2 restart xhs-create-v3    # 重启应用
pm2 stop xhs-create-v3       # 停止应用
pm2 delete xhs-create-v3     # 删除应用
pm2 logs xhs-create-v3       # 查看日志
pm2 monit                    # 监控界面

# Nginx管理
systemctl restart nginx     # 重启Nginx
systemctl reload nginx      # 重载配置
nginx -t                     # 测试配置

# 防火墙管理
firewall-cmd --list-all      # 查看防火墙规则
firewall-cmd --reload        # 重载防火墙
```

## ⚠️ 重要提醒

1. **阿里云安全组**：确保在控制台开放80和443端口
2. **域名配置**：建议绑定域名并配置SSL证书
3. **定期备份**：备份数据库和代码
4. **监控资源**：关注服务器CPU、内存使用情况
5. **日志清理**：定期清理日志文件避免磁盘满

## 🔧 故障排查

### 应用无法启动
```bash
# 检查Node.js版本
node --version

# 检查环境变量
cat .env.local

# 手动启动测试
npm start
```

### 数据库连接失败
```bash
# 测试数据库连接
mysql -h 你的RDS地址 -u app_user -p

# 检查环境变量中的数据库配置
```

### Nginx 502错误
```bash
# 检查应用是否运行
pm2 status

# 检查端口监听
netstat -tlnp | grep :3000

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
``` 