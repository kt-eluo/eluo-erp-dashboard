/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 빌드 중 ESLint 검사 비활성화
  },
  typescript: {
    ignoreBuildErrors: true, // TypeScript 에러도 무시
  },
}

module.exports = nextConfig 