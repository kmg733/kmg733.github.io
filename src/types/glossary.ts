/**
 * 글로서리 용어 항목 (Domain Entity)
 */
export interface GlossaryEntry {
  /** 고유 식별자 (앵커 링크용) */
  id: string;
  /** 용어 전체 표시명 */
  term: string;
  /** 툴팁에 표시할 간략 설명 */
  brief: string;
  /** 하단 섹션에 표시할 상세 설명 */
  detail: string;
}
