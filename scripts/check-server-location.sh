#!/bin/bash

# 检查网站运行位置脚本
# 使用方法：bash scripts/check-server-location.sh

DOMAIN="xhsmuse.art"
EXPECTED_IP="101.37.182.39"

echo "🔍 检查网站 $DOMAIN 的运行位置..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 检查DNS解析
echo -e "${YELLOW}📍 DNS解析检查:${NC}"
RESOLVED_IP=$(dig +short $DOMAIN | head -1)
echo "域名: $DOMAIN"
echo "解析IP: $RESOLVED_IP"
echo "期望IP: $EXPECTED_IP"

if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
    echo -e "${GREEN}✅ DNS解析指向阿里云服务器${NC}"
else
    echo -e "${RED}❌ DNS解析未指向阿里云服务器${NC}"
fi
echo ""

# 2. 检查HTTP响应头
echo -e "${YELLOW}🌐 HTTP响应头检查:${NC}"
RESPONSE_HEADERS=$(curl -I -s https://$DOMAIN)
echo "$RESPONSE_HEADERS"

if echo "$RESPONSE_HEADERS" | grep -q "nginx"; then
    echo -e "${GREEN}✅ 检测到nginx服务器（可能是阿里云）${NC}"
elif echo "$RESPONSE_HEADERS" | grep -q -i "vercel"; then
    echo -e "${RED}❌ 检测到Vercel服务器${NC}"
else
    echo -e "${YELLOW}⚠️  无法确定服务器类型${NC}"
fi
echo ""

# 3. 测试自定义API
echo -e "${YELLOW}🔗 API端点测试:${NC}"
API_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" https://$DOMAIN/api/mysql-status)
HTTP_CODE=$(echo "$API_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
API_BODY=$(echo "$API_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo "API端点: /api/mysql-status"
echo "HTTP状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ MySQL状态API响应正常（阿里云服务器）${NC}"
    echo "响应内容: $API_BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ MySQL状态API不存在（可能是Vercel）${NC}"
else
    echo -e "${YELLOW}⚠️  API响应异常: $HTTP_CODE${NC}"
fi
echo ""

# 4. 检查SSL证书信息
echo -e "${YELLOW}🔒 SSL证书检查:${NC}"
CERT_INFO=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -issuer -subject 2>/dev/null)
echo "$CERT_INFO"

if echo "$CERT_INFO" | grep -q "Let's Encrypt"; then
    echo -e "${GREEN}✅ 使用Let's Encrypt证书（阿里云服务器）${NC}"
else
    echo -e "${YELLOW}⚠️  使用其他证书提供商${NC}"
fi
echo ""

# 5. 综合判断
echo -e "${YELLOW}📊 综合判断:${NC}"
SCORE=0

if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
    SCORE=$((SCORE + 2))
fi

if echo "$RESPONSE_HEADERS" | grep -q "nginx"; then
    SCORE=$((SCORE + 2))
fi

if [ "$HTTP_CODE" = "200" ]; then
    SCORE=$((SCORE + 3))
fi

if echo "$CERT_INFO" | grep -q "Let's Encrypt"; then
    SCORE=$((SCORE + 1))
fi

echo "评分: $SCORE/8"

if [ $SCORE -ge 6 ]; then
    echo -e "${GREEN}🎉 结论: 网站运行在阿里云服务器上${NC}"
elif [ $SCORE -ge 3 ]; then
    echo -e "${YELLOW}⚠️  结论: 可能运行在阿里云服务器上，但有疑问${NC}"
else
    echo -e "${RED}❌ 结论: 网站可能运行在其他服务器上（如Vercel）${NC}"
fi

echo ""
echo -e "${YELLOW}💡 建议:${NC}"
echo "1. 如果是阿里云服务器，可以登录测试数据库功能"
echo "2. 如果是Vercel，需要检查域名DNS设置"
echo "3. 可以在阿里云服务器上运行 'pm2 logs' 查看实时日志" 