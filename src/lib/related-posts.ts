import type { PostMeta } from "@/types";

const TAG_SCORE = 1;

/**
 * 두 포스트 간 관련도 점수를 계산한다.
 *
 * 같은 subcategory 내에서만 호출되는 것을 전제로 한다.
 * 점수 기준:
 * - 공통 tag 1개당: +1
 */
export function calculateRelevanceScore(
  current: PostMeta,
  candidate: PostMeta
): number {
  const commonTags = current.tags.filter((tag) =>
    candidate.tags.includes(tag)
  );

  return commonTags.length * TAG_SCORE;
}
