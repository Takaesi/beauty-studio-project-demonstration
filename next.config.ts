import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // загрузка фото мастеров до 5 МБ
  },
};

export default nextConfig;
