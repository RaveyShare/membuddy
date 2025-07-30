# 使用官方 Nginx 镜像
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx

# 创建静态文件目录
RUN mkdir -p /usr/share/nginx/html

# 复制微信验证文件
COPY html/MP_verify_mluLfyNcp0fnRTDW.txt /usr/share/nginx/html/

# 设置权限
RUN chmod 644 /usr/share/nginx/html/MP_verify_mluLfyNcp0fnRTDW.txt

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/nginx-health || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]