/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // 启用静态优化
  poweredByHeader: false,
  // 启用压缩
  compress: true,
}

export default nextConfig
