/**
 * 검색 결과 타입 정의
 */

import type { PostMeta } from "./post";

/**
 * 검색 매치 정보
 * 어떤 필드에서 매치되었는지와 매치 위치 정보
 */
export interface SearchMatch {
  field: "title" | "description" | "tags";
  indices: [number, number][]; // [시작, 끝] 인덱스 배열
}

/**
 * 검색 결과
 * 원본 포스트와 매치 정보, 점수 포함
 */
export interface SearchResult {
  post: PostMeta;
  matches: SearchMatch[];
  score: number;
}

/**
 * 검색 옵션
 */
export interface SearchOptions {
  minQueryLength?: number; // 최소 검색어 길이 (기본값: 2)
  caseSensitive?: boolean; // 대소문자 구분 (기본값: false)
}
