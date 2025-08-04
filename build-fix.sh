#!/bin/bash

echo "🧹 清理缓存和构建文件..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

echo "📦 重新安装依赖..."
rm -rf node_modules
rm -f pnpm-lock.yaml
pnpm install

echo "🔨 开始构建..."
pnpm build

echo "✅ 构建完成！"