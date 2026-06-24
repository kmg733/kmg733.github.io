/**
 * 경력(Career) 타임라인 도메인 타입
 */

/** 작업 유형 분류 (엔지니어링 시그널 기준) */
export type CareerCategory = "성능" | "보안" | "아키텍처" | "인프라";

/** 유형 필터 옵션 (전체 + 각 유형) */
export type CareerCategoryFilter = "전체" | CareerCategory;

/** 타임라인 항목 (단일 작업/성과) */
export interface CareerItem {
  id: string;
  /** 작업 제목 */
  title: string;
  /** 한 줄 성과 요약 */
  summary: string;
  /** 작업 유형 */
  category: CareerCategory;
  /** 정렬·표기 기준일 (형식: "YYYY.MM") */
  date: string;
  /** 표기용 기간 문자열 (예: "2025.06 ~ 2025.09"). 없으면 date 단독 표기 */
  period?: string;
  /** 대표 성과 강조 여부 */
  highlight?: boolean;
  /** 향후 블로그 글 연결용 slug */
  postSlug?: string;
}

/** 회사 경력 (회사 정보 + 작업 항목 목록) */
export interface Company {
  /** 회사명 */
  name: string;
  /** 담당 역할 */
  role: string;
  /** 재직 기간 (예: "2022.06 ~ 재직 중") */
  period: string;
  /** 회사/담당 업무 소개 */
  description: string;
  /** 수행 작업 항목 */
  items: CareerItem[];
}
