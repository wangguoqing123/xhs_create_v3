#!/bin/bash

echo "🔍 检查代码同步状态..."
echo "================================"

echo "📍 当前分支和提交:"
git branch
git log --oneline -3

echo ""
echo "📡 远程仓库状态:"
git fetch origin
git log --oneline origin/main -3

echo ""
echo "🔄 本地与远程差异:"
git diff HEAD origin/main --name-only

echo ""
echo "📁 关键文件检查:"
echo "stats/route.ts 存在: $(test -f app/api/admin/explosive-contents/stats/route.ts && echo '✅' || echo '❌')"
echo ".eslintrc.json 存在: $(test -f .eslintrc.json && echo '✅' || echo '❌')"
echo "mysql-explosive-contents.ts 存在: $(test -f lib/mysql-explosive-contents.ts && echo '✅' || echo '❌')"

echo ""
echo "📝 .eslintrc.json 内容:"
cat .eslintrc.json

echo ""
echo "🔍 检查问题导入:"
echo "搜索 batchImportExplosiveContent:"
grep -r "batchImportExplosiveContent" app/api/ 2>/dev/null || echo "未找到"

echo "搜索 updateExplosiveContent:"
grep -r "updateExplosiveContent" app/api/ 2>/dev/null || echo "未找到"

echo "搜索 getExplosiveContentStats:"
grep -r "getExplosiveContentStats" app/api/ 2>/dev/null || echo "未找到"

echo ""
echo "✅ 检查完成！"