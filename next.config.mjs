/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    // 允许外部图片域名（通过代理服务访问）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.xhscdn.com', // 小红书CDN域名
      },
      {
        protocol: 'https',
        hostname: 'ci.xiaohongshu.com',
      },
    ],
  },
  // 启用静态优化
  poweredByHeader: false,
  // 启用压缩
  compress: true,
}

export default nextConfig
