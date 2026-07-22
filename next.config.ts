import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더의 다른 lockfile 때문에 루트를 잘못 잡는 경고를 없애고,
  // 이 프로젝트 폴더를 루트로 고정합니다.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
