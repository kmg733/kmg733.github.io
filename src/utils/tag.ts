import type { PostMeta } from "@/types";

export interface TagCount {
  name: string;
  count: number;
}

/**
 * 포스트 배열에서 고유 태그와 각 태그의 포스트 수를 추출한다.
 * 개수 내림차순, 같으면 이름 오름차순으로 정렬.
 */
export function extractTagsWithCount(
  posts: Pick<PostMeta, "tags">[]
): TagCount[] {
  const countMap = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      countMap.set(tag, (countMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
