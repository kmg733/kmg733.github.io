"use client";

import { useEffect } from "react";
import { navigateToAnchor } from "@/lib/anchorNavigation";

// remark-gfm이 각주 번호에 붙이는 속성과, 각주 끝 ↩ 링크에 붙이는 속성
const FOOTNOTE_LINK_SELECTOR = "a[data-footnote-ref], a[data-footnote-backref]";

/**
 * 각주 번호(본문 → 각주)와 ↩(각주 → 본문) 링크를 용어 설명처럼
 * 부드럽게 스크롤하고 도착한 곳을 강조한다. 주소 해시와 목차 active도 도착 위치에 맞춘다.
 * 각주 마크업은 MDX가 정적 HTML로 만들기 때문에 문서에 위임 리스너 하나를 단다.
 */
export default function FootnoteLinks() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      // Ctrl/Cmd/Shift/Alt+클릭, 가운데 버튼은 새 탭 열기 등 브라우저 기본 동작에 맡긴다
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>(FOOTNOTE_LINK_SELECTOR);
      if (!link) return;

      // remark-gfm 은 각주 이름을 퍼센트 인코딩한 채로 요소 id 에 넣으므로 디코딩하지 않는다
      const targetId = link.hash.slice(1);
      const isBackref = link.hasAttribute("data-footnote-backref");
      const highlightClass = isBackref ? "glossary-highlight" : "glossary-entry-highlight";
      // 대상이 없으면 브라우저 기본 동작에 맡긴다
      if (navigateToAnchor(targetId, highlightClass)) {
        event.preventDefault();
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
