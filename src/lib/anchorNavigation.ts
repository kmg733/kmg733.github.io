import { scrollAndHighlight } from "./scrollHighlight";
import { requestTocSync } from "./tocSync";

/**
 * 글 안의 앵커(각주, 용어 설명, 본문 용어)로 이동한다.
 * - 부드럽게 스크롤한 뒤 도착한 요소를 강조한다
 * - 주소창 해시를 대상 id로 바꿔 그 위치를 공유할 수 있게 한다 (방문 기록은 늘리지 않음)
 * - 목차 active를 도착 위치가 속한 구간으로 맞춘다
 *
 * @returns 대상이 있어 이동했으면 true
 */
export function navigateToAnchor(id: string, highlightClass: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  // URL 파서는 한글 등은 인코딩하고 이미 있는 %XX 는 그대로 둔다.
  // (remark-gfm 각주 id 는 이미 퍼센트 인코딩돼 있어 encodeURIComponent 로는 %25 로 이중 인코딩된다)
  const hash = new URL(`#${id}`, window.location.href).hash;
  window.history.replaceState(null, "", hash);
  scrollAndHighlight(target, highlightClass);
  requestTocSync(target);
  return true;
}
