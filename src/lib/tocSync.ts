/**
 * 본문 안 링크(각주 등)로 이동할 때 목차의 active 제목을 이동할 위치에 맞추기 위한 이벤트.
 * 부드러운 스크롤 도중의 중간 위치가 아니라 도착 위치 기준으로 목차를 바로 맞춘다.
 */
export const TOC_SYNC_EVENT = "toc:sync";

export function requestTocSync(target: HTMLElement): void {
  window.dispatchEvent(new CustomEvent(TOC_SYNC_EVENT, { detail: target }));
}

/**
 * target이 속한 구간의 제목 slug를 돌려준다.
 * 문서 순서상 target 앞에 있는 마지막 제목(또는 target 자신)이다. 첫 제목보다 앞이면 null.
 */
export function findSectionHeading(target: Node, slugs: string[]): string | null {
  let found: string | null = null;

  for (const slug of slugs) {
    const heading = document.getElementById(slug);
    if (!heading) continue;

    const isBeforeTarget =
      heading === target ||
      (heading.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    if (isBeforeTarget) found = slug;
  }

  return found;
}
