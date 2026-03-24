/**
 * MDX 소스 문자열에서 <img> 태그에 loading="lazy" 속성을 추가한다.
 *
 * MDX의 JSX <img> 요소는 rehype 파이프라인을 통한 속성 주입이 불가능하므로,
 * MDX 컴파일 전 소스 문자열을 전처리하는 방식을 사용한다.
 *
 * - 이미 loading 속성이 있는 <img>는 스킵한다.
 * - <img 이외의 태그는 영향받지 않는다.
 */
export function addLazyLoading(source: string): string {
  return source.replace(
    /<img(?![^>]*\bloading\b)([^>]*?)(\/?>)/g,
    '<img loading="lazy"$1$2'
  );
}
