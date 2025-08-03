#!/bin/bash

# MemBuddy SSL 证书生成脚本
# 用于本地开发环境生成自签名 SSL 证书

set -e

echo "=== MemBuddy SSL 证书生成脚本 ==="
echo "此脚本将为本地开发环境生成自签名 SSL 证书"
echo

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "错误：此脚本需要 root 权限运行"
    echo "请使用: sudo $0"
    exit 1
fi

# 创建 SSL 目录（如果不存在）
echo "创建 SSL 证书目录..."
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/certs

# 设置证书信息
CERT_COUNTRY="CN"
CERT_STATE="Beijing"
CERT_CITY="Beijing"
CERT_ORG="MemBuddy"
CERT_OU="IT Department"
CERT_CN="localhost"
CERT_EMAIL="admin@membuddy.local"

# 生成私钥和证书
echo "生成 SSL 私钥和证书..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/membuddy.key \
    -out /etc/ssl/certs/membuddy.crt \
    -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_CITY/O=$CERT_ORG/OU=$CERT_OU/CN=$CERT_CN/emailAddress=$CERT_EMAIL" \
    -config <(
echo '[req]'
echo 'default_bits = 2048'
echo 'prompt = no'
echo 'distinguished_name = req_distinguished_name'
echo 'req_extensions = v3_req'
echo '[req_distinguished_name]'
echo "C=$CERT_COUNTRY"
echo "ST=$CERT_STATE"
echo "L=$CERT_CITY"
echo "O=$CERT_ORG"
echo "OU=$CERT_OU"
echo "CN=$CERT_CN"
echo "emailAddress=$CERT_EMAIL"
echo '[v3_req]'
echo 'basicConstraints = CA:FALSE'
echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
echo 'subjectAltName = @alt_names'
echo '[alt_names]'
echo 'DNS.1 = localhost'
echo 'DNS.2 = *.localhost'
echo 'IP.1 = 127.0.0.1'
echo 'IP.2 = ::1'
)

# 设置正确的权限
echo "设置证书文件权限..."
chmod 600 /etc/ssl/private/membuddy.key
chmod 644 /etc/ssl/certs/membuddy.crt
chown root:root /etc/ssl/private/membuddy.key
chown root:root /etc/ssl/certs/membuddy.crt

echo
echo "✅ SSL 证书生成完成！"
echo "证书文件位置："
echo "  - 证书: /etc/ssl/certs/membuddy.crt"
echo "  - 私钥: /etc/ssl/private/membuddy.key"
echo
echo "证书信息："
openssl x509 -in /etc/ssl/certs/membuddy.crt -text -noout | grep -A 1 "Subject:"
echo
echo "⚠️  注意事项："
echo "1. 这是自签名证书，浏览器会显示安全警告，这是正常的"
echo "2. 在浏览器中访问时，请点击'高级'然后'继续访问'或'接受风险'"
echo "3. 证书有效期为 365 天"
echo "4. 现在可以重新加载 nginx 配置以启用 HTTPS"
echo
echo "下一步操作："
echo "1. 复制更新后的 nginx 配置："
echo "   sudo cp nginx/local-deploy.conf /etc/nginx/sites-available/membuddy-api"
echo "2. 测试 nginx 配置："
echo "   sudo nginx -t"
echo "3. 重新加载 nginx："
echo "   sudo systemctl reload nginx"
echo "4. 访问 https://localhost 或 https://your-domain.com"