import type { GiscusProps } from "@giscus/react";

/**
 * Giscus 댓글 시스템 설정
 *
 * repoId: GitHub GraphQL API에서 확인
 * category/categoryId: https://giscus.app 에서 설정 후 확인
 */
export const GISCUS_CONFIG: Omit<GiscusProps, "theme"> = {
  repo: "kmg733/kmg733.github.io",
  repoId: "MDEwOlJlcG9zaXRvcnk0MDE4MTc5ODc=",
  category: "Comments",
  categoryId: "DIC_kwDOF_NBg84C51la",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  lang: "ko",
} as const;
