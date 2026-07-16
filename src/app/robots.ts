import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// output: export 모드에서 정적 파일(robots.txt)로 생성되도록 강제한다.
export const dynamic = "force-static";

/**
 * robots.txt 생성 (Next.js 16 MetadataRoute API).
 * 모든 크롤러 허용 + sitemap 위치 명시.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
