# 🚀 阿里云部署检查清单

## 部署前准备

### 1. 阿里云资源购买 ✅
- [ ] 购买ECS云服务器（推荐2核4GB，Ubuntu 22.04）
- [ ] 购买RDS MySQL数据库（推荐基础版8.0）
- [ ] 记录服务器公网IP地址
- [ ] 记录RDS连接地址

### 2. 域名配置（可选）✅
- [ ] 购买域名
- [ ] 配置A记录指向服务器IP
- [ ] 备案（如果需要）

### 3. 第三方服务准备 ✅
- [ ] 获取Coze API Token
- [ ] 配置QQ邮箱SMTP（获取授权码）
- [ ] 生成JWT密钥（32位随机字符串）

## 服务器环境配置

### 1. 连接服务器 ✅
```bash
ssh root@你的服务器IP
```

### 2. 基础环境安装 ✅
```bash
# 更新系统
apt update && apt upgrade -y

# 安装基础软件
apt install -y curl wget git vim nginx mysql-client

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 安装pnpm和PM2
npm install -g pnpm pm2
```

### 3. 安全组配置 ✅
在阿里云控制台配置安全组规则：
- [ ] SSH (22端口) - 仅允许你的IP
- [ ] HTTP (80端口) - 允许所有IP (0.0.0.0/0)
- [ ] HTTPS (443端口) - 允许所有IP (0.0.0.0/0)

## 数据库配置

### 1. RDS配置 ✅
- [ ] 创建数据库：`xhs_create_v3`
- [ ] 创建用户：`app_user`
- [ ] 设置强密码
- [ ] 配置白名单：添加ECS内网IP

### 2. 数据库初始化 ✅
```bash
# 上传项目代码后执行
bash scripts/init-database.sh
```

## 项目部署

### 1. 上传项目代码 ✅
```bash
# 方法1：使用git（推荐）
cd /var/www
git clone https://github.com/你的用户名/xhs_create_v3.git
cd xhs_create_v3

# 方法2：使用scp上传
# 在本地运行：scp -r . root@服务器IP:/var/www/xhs_create_v3/
```

### 2. 环境变量配置 ✅
创建 `.env.local` 文件：
```bash
# 使用vi编辑器创建文件
vi .env.local
```

复制以下内容并替换真实值：
```env
# 数据库配置
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_NAME=xhs_create_v3
DB_USER=app_user
DB_PASSWORD=你的数据库密码
DB_CHARSET=utf8mb4

# JWT配置
JWT_SECRET=你的32位随机字符串

# 邮件配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=你的QQ邮箱授权码

# API配置
COZE_API_TOKEN=你的Coze_API_Token
COZE_WORKFLOW_ID=7511639630044119067

# 生产环境配置
NODE_ENV=production
PORT=3000
```

### 3. 自动化部署 ✅
```bash
cd /var/www/xhs_create_v3
bash scripts/deploy.sh
```

## 部署后验证

### 1. 服务状态检查 ✅1
```bash
# 检查PM2进程
pm2 status

# 检查Nginx状态
systemctl status nginx

# 检查应用日志
pm2 logs xhs-create-v3
```

### 2. 功能测试 ✅
- [ ] 访问 `http://你的服务器IP` 能正常打开网站
- [ ] 用户注册功能正常（邮箱验证码）
- [ ] 用户登录功能正常
- [ ] 数据库连接正常
- [ ] API接口响应正常

### 3. 性能测试 ✅
```bash
# 检查服务器资源使用
htop

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

## 安全加固

### 1. 服务器安全 ✅
- [ ] 修改SSH默认端口（可选）
- [ ] 禁用root密码登录，使用密钥认证
- [ ] 安装fail2ban防止暴力破解
- [ ] 定期更新系统安全补丁

### 2. 应用安全 ✅
- [ ] 使用强密码和密钥
- [ ] 定期更换敏感信息
- [ ] 监控异常访问
- [ ] 设置访问频率限制

## 监控和维护

### 1. 日志监控 ✅
```bash
# 查看应用日志
pm2 logs xhs-create-v3 --lines 100

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 查看系统日志
journalctl -u nginx -f
```

### 2. 性能监控 ✅
- [ ] 设置阿里云监控告警
- [ ] 监控CPU、内存、磁盘使用率
- [ ] 监控数据库连接数和查询性能
- [ ] 监控网络流量

### 3. 备份策略 ✅
- [ ] 数据库定期备份（建议每日）
- [ ] 代码版本控制和备份
- [ ] 环境变量文件备份
- [ ] 服务器快照备份（每周）

## 常见问题排查

### 1. 应用无法启动 ❌
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查环境变量
cat .env.local

# 检查依赖安装
pnpm install

# 重新构建
pnpm build
```

### 2. 数据库连接失败 ❌
```bash
# 测试数据库连接
mysql -h 你的RDS地址 -u app_user -p

# 检查白名单配置
# 在阿里云RDS控制台检查白名单设置
```

### 3. Nginx配置问题 ❌
```bash
# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

## 优化建议

### 1. 性能优化 ⚡
- [ ] 启用Gzip压缩
- [ ] 配置静态文件缓存
- [ ] 使用CDN加速静态资源
- [ ] 优化数据库查询

### 2. 扩展性 📈
- [ ] 配置负载均衡（多台服务器）
- [ ] 使用Redis缓存
- [ ] 分离静态资源到OSS
- [ ] 数据库读写分离

### 3. 可用性 🔧
- [ ] 配置SSL证书（HTTPS）
- [ ] 设置自动备份
- [ ] 配置监控告警
- [ ] 准备灾难恢复方案

---

## 🎉 部署完成！

恭喜你成功将小红书创作工具部署到阿里云！

**访问地址**: `http://你的服务器IP`

**管理命令**:
- 重启应用: `pm2 restart xhs-create-v3`
- 查看日志: `pm2 logs xhs-create-v3`
- 查看状态: `pm2 status`

如果遇到问题，请检查上述清单或查看相关日志文件。 