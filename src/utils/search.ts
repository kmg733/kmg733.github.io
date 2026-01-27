/**
 * 검색 유틸리티 함수
 *
 * 클라이언트 사이드 인메모리 검색 구현
 * - 대소문자 무시 검색
 * - 부분 문자열 매칭
 * - 가중치 기반 점수 산정
 */

import type { PostMeta } from "@/types";
import type { SearchResult, SearchMatch, SearchOptions } from "@/types/search";

// 필드별 가중치 점수
const SCORE_WEIGHTS = {
  title: 10,
  tags: 8,
  description: 5,
} as const;

/**
 * 정규표현식 특수문자 이스케이프
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * HTML 특수문자 이스케이프 (XSS 방지)
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 텍스트에서 검색어 매치 인덱스 찾기
 * @param text 검색 대상 텍스트
 * @param query 검색어
 * @returns 매치된 [시작, 끝] 인덱스 배열
 */
export function findMatchIndices(
  text: string,
  query: string
): [number, number][] {
  if (!query || !text) return [];

  const indices: [number, number][] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let startIndex = 0;

  while (startIndex < lowerText.length) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    indices.push([index, index + query.length]);
    startIndex = index + 1;
  }

  return indices;
}

/**
 * 포스트 배열에서 검색 수행
 * @param posts 검색할 포스트 배열
 * @param query 검색어
 * @param options 검색 옵션
 * @returns 검색 결과 배열 (점수 내림차순 정렬)
 */
export function searchPosts(
  posts: PostMeta[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { minQueryLength = 2 } = options;

  // 검색어 길이 검증
  if (!query || query.trim().length < minQueryLength) {
    return [];
  }

  const trimmedQuery = query.trim();
  const results: SearchResult[] = [];

  for (const post of posts) {
    const matches: SearchMatch[] = [];
    let score = 0;

    // 제목 검색
    const titleIndices = findMatchIndices(post.title, trimmedQuery);
    if (titleIndices.length > 0) {
      matches.push({ field: "title", indices: titleIndices });
      score += SCORE_WEIGHTS.title * titleIndices.length;
    }

    // 설명 검색
    const descIndices = findMatchIndices(post.description, trimmedQuery);
    if (descIndices.length > 0) {
      matches.push({ field: "description", indices: descIndices });
      score += SCORE_WEIGHTS.description * descIndices.length;
    }

    // 태그 검색
    const tagMatches: [number, number][] = [];
    for (const tag of post.tags) {
      const tagIndices = findMatchIndices(tag, trimmedQuery);
      if (tagIndices.length > 0) {
        tagMatches.push(...tagIndices);
        score += SCORE_WEIGHTS.tags * tagIndices.length;
      }
    }
    if (tagMatches.length > 0) {
      matches.push({ field: "tags", indices: tagMatches });
    }

    // 매치가 있는 경우만 결과에 추가
    if (matches.length > 0) {
      results.push({ post, matches, score });
    }
  }

  // 점수 내림차순 정렬
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 텍스트에서 검색어를 하이라이트 처리
 * XSS 방지를 위해 HTML 이스케이프 후 하이라이트 적용
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이트 마크업이 포함된 문자열
 */
export function highlightText(text: string, query: string): string {
  if (!text) return text;
  if (!query) return escapeHtml(text);

  // 1. 먼저 HTML 이스케이프 적용 (XSS 방지)
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);

  // 2. 이스케이프된 텍스트에서 이스케이프된 검색어로 하이라이트
  const regexQuery = escapeRegExp(escapedQuery);
  const regex = new RegExp(`(${regexQuery})`, "gi");

  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}
