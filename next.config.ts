import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

const nextConfig: NextConfig = {
  output: "export",
  // github-slugger는 ESM 전용 패키지. next/jest가 이를 SWC로 변환하도록 허용해
  // 목차 slug를 rehype-slug와 동일한 규칙으로 생성한다.
  transpilePackages: ["github-slugger"],
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // webpack 설정 공존 시 Turbopack 빌드 에러 방지용 (Next.js 16)
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.plugins.push({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apply(compiler: any) {
          compiler.hooks.afterCompile.tap(
            "ContentWatchPlugin",
            (compilation: any) => {
              const contentDir = path.join(process.cwd(), "content/posts");

              try {
                if (!fs.existsSync(contentDir)) return;

                const files = fs.readdirSync(contentDir);
                for (const file of files) {
                  if (file.endsWith(".md") || file.endsWith(".mdx")) {
                    compilation.fileDependencies.add(
                      path.join(contentDir, file)
                    );
                  }
                }
                compilation.contextDependencies.add(contentDir);
              } catch {
                // 디렉토리 접근 실패 시 감시 생략 (dev 서버는 계속 동작)
              }
            }
          );
        },
      });
    }
    return config;
  },
};

export default nextConfig;
