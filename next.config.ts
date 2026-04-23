import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  // Vercel 需要关闭 output file tracing，避免视频文件被排除
};

export default nextConfig;
