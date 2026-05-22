/**
 * 블로그 포스트 갤러리 이미지 수집 유틸리티.
 *
 * .prose 컨테이너 내 이미지를 수집하되, 테마쌍(theme-light / theme-dark)은
 * 현재 활성 테마 기준으로 하나의 논리적 이미지로 그룹핑한다.
 * 단일(테마 무관) 이미지는 그대로 1개로 취급한다.
 */

export type Theme = "light" | "dark";

/** 갤러리에 표시할 논리적 이미지 1개 */
export interface GalleryImage {
  /** 현재 테마에 해당하는 이미지 src */
  src: string;
  /** 대체 텍스트 */
  alt: string;
}

/** 내부 그룹: 화면 표시 정보 + 원본 DOM 노드 매핑 */
interface ImageGroup extends GalleryImage {
  /** 이 논리적 이미지를 구성하는 DOM 요소 (단일 1개, 테마쌍 2개) */
  elements: HTMLImageElement[];
}

const THEME_LIGHT_CLASS = "theme-light";
const THEME_DARK_CLASS = "theme-dark";

/** img가 테마쌍의 짝(theme-light/theme-dark)인지 여부 */
function isThemePaired(img: HTMLImageElement): boolean {
  return (
    img.classList.contains(THEME_LIGHT_CLASS) ||
    img.classList.contains(THEME_DARK_CLASS)
  );
}

/** 같은 image-frame 내의 짝 이미지를 찾는다 (없으면 null). */
function findPair(
  img: HTMLImageElement,
  pairClass: string
): HTMLImageElement | null {
  return img.parentElement?.querySelector<HTMLImageElement>(
    `img.${pairClass}`
  ) ?? null;
}

/**
 * 컨테이너 내 이미지를 논리적 그룹 단위로 수집한다 (DOM 출현 순서 보존).
 */
function collectGroups(container: HTMLElement, theme: Theme): ImageGroup[] {
  const images = Array.from(
    container.querySelectorAll<HTMLImageElement>("img")
  );
  const processed = new Set<HTMLImageElement>();
  const groups: ImageGroup[] = [];

  for (const img of images) {
    if (processed.has(img)) continue;

    if (isThemePaired(img)) {
      const light = img.classList.contains(THEME_LIGHT_CLASS)
        ? img
        : findPair(img, THEME_LIGHT_CLASS);
      const dark = img.classList.contains(THEME_DARK_CLASS)
        ? img
        : findPair(img, THEME_DARK_CLASS);

      const elements = [light, dark].filter(
        (el): el is HTMLImageElement => el !== null
      );
      const themed = theme === "dark" ? dark ?? light : light ?? dark;

      // themed는 elements가 비어있지 않으면 항상 존재
      if (themed) {
        groups.push({ src: themed.src, alt: themed.alt, elements });
        elements.forEach((el) => processed.add(el));
        continue;
      }
    }

    // 단일(테마 무관) 이미지
    groups.push({ src: img.src, alt: img.alt, elements: [img] });
    processed.add(img);
  }

  return groups;
}

/**
 * 컨테이너 내 갤러리 이미지 목록을 현재 테마 기준으로 수집한다.
 */
export function collectGalleryImages(
  container: HTMLElement,
  theme: Theme
): GalleryImage[] {
  return collectGroups(container, theme).map(({ src, alt }) => ({ src, alt }));
}

/**
 * 클릭된 이미지가 속한 논리적 갤러리 인덱스를 반환한다.
 * 컨테이너에 속하지 않으면 -1.
 */
export function findGalleryStartIndex(
  container: HTMLElement,
  theme: Theme,
  clicked: HTMLImageElement
): number {
  return collectGroups(container, theme).findIndex((group) =>
    group.elements.includes(clicked)
  );
}

/** 갤러리 오픈에 필요한 데이터 */
export interface GalleryOpenData {
  images: GalleryImage[];
  /** 클릭된 이미지의 시작 인덱스 (컨테이너에 없으면 -1) */
  startIndex: number;
}

/**
 * 갤러리 이미지 목록과 클릭 시작 인덱스를 한 번의 DOM 순회로 함께 반환한다.
 * (collectGalleryImages + findGalleryStartIndex 의 중복 순회 방지)
 */
export function collectGalleryAt(
  container: HTMLElement,
  theme: Theme,
  clicked: HTMLImageElement
): GalleryOpenData {
  const groups = collectGroups(container, theme);
  return {
    images: groups.map(({ src, alt }) => ({ src, alt })),
    startIndex: groups.findIndex((group) =>
      group.elements.includes(clicked)
    ),
  };
}
