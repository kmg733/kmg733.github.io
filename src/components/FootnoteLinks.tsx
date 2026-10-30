"use client";

import { useEffect } from "react";
import { scrollAndHighlight } from "@/lib/scrollHighlight";
import { requestTocSync } from "@/lib/tocSync";

// remark-gfm이 각주 번호에 붙이는 속성과, 각주 끝 ↩ 링크에 붙이는 속성
const FOOTNOTE_LINK_SELECTOR = "a[data-footnote-ref], a[data-footnote-backref]";

/**
 * 각주 번호(본문 → 각주)와 ↩(각주 → 본문) 링크를 용어 설명처럼
 * 부드럽게 스크롤하고 도착한 곳을 강조한다. 목차 active도 도착 위치에 맞춘다.
 * 각주 마크업은 MDX가 정적 HTML로 만들기 때문에 문서에 위임 리스너 하나를 단다.
 */
export default function FootnoteLinks() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>(FOOTNOTE_LINK_SELECTOR);
      if (!link) return;

      const targetId = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      const isBackref = link.hasAttribute("data-footnote-backref");
      scrollAndHighlight(target, isBackref ? "glossary-highlight" : "glossary-entry-highlight");
      requestTocSync(target);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
