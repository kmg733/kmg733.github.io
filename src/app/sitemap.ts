import type { MetadataRoute } from "next";
import { postService } from "@/lib/container";
import { buildSitemap } from "@/lib/sitemap";
import { SITE_URL } from "@/lib/constants";

// output: export 모드에서 정적 파일(sitemap.xml)로 생성되도록 강제한다.
export const dynamic = "force-static";

/**
 * sitemap.xml 생성 (Next.js 16 MetadataRoute API).
 * 정적 export 시 빌드 타임에 sitemap.xml로 렌더링된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(postService.getAllPosts(), SITE_URL);
}
