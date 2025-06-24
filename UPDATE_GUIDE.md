# 灵感距阵 - 代码更新指南

## 概述
当您在GitHub上更新了代码后，需要将更新同步到阿里云服务器。本指南提供了两种更新方式。

## 🚀 更新方式

### 方式一：快速更新（推荐）
适用于小的代码修改，不涉及依赖变更或数据库迁移。

```bash
# 上传并执行快速更新脚本
scp -o PreferredAuthentications=password scripts/quick-update.sh root@101.37.182.39:/tmp/
ssh -o PreferredAuthentications=password root@101.37.182.39 "chmod +x /tmp/quick-update.sh && /tmp/quick-update.sh"
```
进入项目目录并更新代码
   cd /var/www/xhs_create_v3
   git fetch origin
   git reset --hard origin/main
   pm2 restart xhs-create-v3

   检查更新结果
   pm2 status
   pm2 logs xhs-create-v3 --lines 10

   
### 方式二：完整更新

适用于涉及依赖更新、数据库迁移或重大代码变更的情况。

```bash
# 上传并执行完整更新脚本
scp -o PreferredAuthentications=password scripts/update-from-github.sh root@101.37.182.39:/tmp/
ssh -o PreferredAuthentications=password root@101.37.182.39 "chmod +x /tmp/update-from-github.sh && /tmp/update-from-github.sh"
```

## 📝 更新步骤说明

### 快速更新流程
1. 显示当前代码版本
2. 从GitHub拉取最新代码
3. 重启PM2应用进程
4. 检查应用状态
5. 显示更新后的日志

### 完整更新流程
1. **备份当前版本** - 自动创建时间戳备份
2. **停止应用** - 避免更新过程中的冲突
3. **拉取最新代码** - 从GitHub main分支
4. **安装依赖** - 使用pnpm安装新依赖
5. **检查环境变量** - 确保.env.local存在
6. **构建项目** - 重新构建Next.js应用
7. **检查数据库迁移** - 提示是否有新的迁移文件
8. **重启应用和Nginx** - 确保服务正常运行
9. **测试功能** - 自动测试主要端点
10. **显示更新摘要** - 包含备份位置和版本信息

## ⚠️ 注意事项

### 更新前检查
- 确保GitHub上的代码已经测试通过
- 如果有数据库变更，先备份数据库
- 确认服务器有足够的磁盘空间

### 更新后验证
1. 访问 https://xhsmuse.art 检查主页
2. 测试登录功能
3. 测试搜索和改写功能
4. 检查积分系统是否正常

### 故障恢复
如果更新后出现问题，可以使用以下命令恢复：

```bash
# 查看备份列表
ls -la /var/www/backup_*

# 恢复到指定备份（替换时间戳）
rm -rf /var/www/xhs_create_v3
mv /var/www/backup_20241220_143000 /var/www/xhs_create_v3
pm2 restart xhs-create-v3
```

## 🔧 故障排除

### 常见问题

1. **Git拉取失败**
   ```bash
   # 重新配置Git远程地址
   cd /var/www/xhs_create_v3
   git remote set-url origin https://github.com/您的用户名/xhs_create_v3.git
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   cd /var/www/xhs_create_v3
   rm -rf node_modules package-lock.json
   pnpm install
   ```

3. **应用启动失败**
   ```bash
   # 检查日志
   pm2 logs xhs-create-v3
   
   # 重启应用
   pm2 restart xhs-create-v3
   ```

4. **认证问题**
   ```bash
   # 运行认证诊断脚本
   scp -o PreferredAuthentications=password scripts/diagnose-auth-issues.sh root@101.37.182.39:/tmp/
   ssh -o PreferredAuthentications=password root@101.37.182.39 "chmod +x /tmp/diagnose-auth-issues.sh && /tmp/diagnose-auth-issues.sh"
   ```

## 📞 支持

如果遇到问题，请检查：
1. PM2进程状态：`pm2 status`
2. 应用日志：`pm2 logs xhs-create-v3`
3. Nginx状态：`systemctl status nginx`
4. 系统资源：`free -h` 和 `df -h`

## 🎯 最佳实践

1. **定期更新** - 建议每周更新一次
2. **小步快跑** - 频繁小更新比大更新更安全
3. **备份重要** - 每次更新前都会自动备份
4. **测试优先** - 本地测试通过后再部署
5. **监控日志** - 更新后密切关注应用日志 