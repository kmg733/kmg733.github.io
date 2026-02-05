import type { PostMeta } from "@/types";

const SUBCATEGORY_SCORE = 3;
const CATEGORY_SCORE = 2;
const TAG_SCORE = 1;

/**
 * 두 포스트 간 관련도 점수를 계산한다.
 *
 * 점수 기준:
 * - 같은 subcategory: +3
 * - 같은 category: +2
 * - 공통 tag 1개당: +1
 */
export function calculateRelevanceScore(
  current: PostMeta,
  candidate: PostMeta
): number {
  let score = 0;

  if (
    current.subcategory &&
    candidate.subcategory &&
    current.subcategory === candidate.subcategory
  ) {
    score += SUBCATEGORY_SCORE;
  }

  if (current.category === candidate.category) {
    score += CATEGORY_SCORE;
  }

  const commonTags = current.tags.filter((tag) =>
    candidate.tags.includes(tag)
  );
  score += commonTags.length * TAG_SCORE;

  return score;
}
