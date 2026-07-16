import { postService } from "@/lib/container";
import { buildFeeds } from "@/lib/feed";

// output: "export" 정적 빌드 호환. 이 지시어가 없으면 빌드가 실패한다.
export const dynamic = "force-static";

export function GET() {
  const { atom } = buildFeeds(postService.getAllPosts());

  return new Response(atom, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
