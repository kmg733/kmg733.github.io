/**
 * MDX 소스 문자열에서 <img> 태그에 loading="lazy" 속성을 추가한다.
 *
 * MDX의 JSX <img> 요소는 rehype 파이프라인을 통한 속성 주입이 불가능하므로,
 * MDX 컴파일 전 소스 문자열을 전처리하는 방식을 사용한다.
 *
 * - 이미 loading 속성이 있는 <img>는 스킵한다.
 * - <img 이외의 태그는 영향받지 않는다.
 * - 멀티라인 <img> 태그도 지원한다.
 */
/**
 * **bold** 닫힘 마커 바로 뒤에 한글이 올 때 bold가 적용되지 않는 문제를 수정한다.
 *
 * micromark(CommonMark) 파서는 닫는 ** 뒤에 단어 문자(한글 포함)가 바로 오면
 * 단어 경계로 인식하지 않아 strong emphasis를 파싱하지 못한다.
 * 예: **세대(Generation)**로 → bold 안 됨
 *
 * 이 함수는 해당 패턴을 <strong> HTML 태그로 변환하여 우회한다.
 */
export function fixBoldBeforeKorean(source: string): string {
  return source.replace(
    /(?<=^|[\s\p{P}])\*\*(\S[^*\n]*?)\*\*(?=[가-힣ㄱ-ㅎㅏ-ㅣ])/gmu,
    "<strong>$1</strong>"
  );
}

export function addLazyLoading(source: string): string {
  return source.replace(
    /<img(?![^>]*\bloading\b)([^>]*)(\/?>)/g,
    '<img loading="lazy"$1$2'
  );
}
