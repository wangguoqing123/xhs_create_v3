#!/bin/bash

# 阿里云服务器自动化部署脚本
# 使用方法: bash scripts/deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 xhs_create_v3..."

# 1. 进入项目目录
cd /var/www/xhs_create_v3

# 2. 备份环境变量
echo "📋 备份环境变量..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ 环境变量已备份"
else
    echo "⚠️  未找到 .env.local 文件"
fi

# 3. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✅ 代码更新完成"

# 4. 恢复环境变量
echo "📋 恢复环境变量..."
if [ -f .env.local.backup ]; then
    cp .env.local.backup .env.local
    echo "✅ 环境变量已恢复"
fi

# 5. 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile
echo "✅ 依赖安装完成"

# 6. 构建项目
echo "🔨 构建项目..."
if pnpm build; then
    echo "✅ 项目构建完成"
else
    echo "❌ 构建失败，尝试忽略ESLint错误构建..."
    if NODE_ENV=production pnpm build --no-lint; then
        echo "✅ 项目构建完成（忽略ESLint错误）"
    else
        echo "❌ 构建仍然失败，请检查错误信息"
        exit 1
    fi
fi

# 7. 重启应用
echo "🔄 重启应用..."
pm2 restart xhs-create-v3
echo "✅ 应用重启完成"

# 8. 检查状态
echo "📊 检查应用状态..."
pm2 status

echo "🎉 部署完成！"
echo "📝 查看日志: pm2 logs xhs-create-v3"
echo "🌐 访问网站: http://你的服务器IP" 