import {
  collectGalleryImages,
  collectGalleryAt,
  findGalleryStartIndex,
  type GalleryImage,
} from "../galleryImages";

/**
 * galleryImages 순수 함수 단위 테스트.
 *
 * 블로그 포스트의 .prose 컨테이너에서 이미지를 수집하되,
 * 테마쌍(theme-light / theme-dark)은 현재 활성 테마 기준으로
 * 하나의 논리적 이미지로 그룹핑한다. (이슈 #116 핵심 난점)
 */

/** .prose 컨테이너를 생성하고 body에 부착한다. */
function createProse(html: string): HTMLElement {
  const div = document.createElement("div");
  div.className = "prose";
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

/** 테마쌍 figure 마크업을 생성한다. */
function themePair(name: string, alt: string): string {
  return `
    <figure><div class="figure-content"><div class="image-frame">
      <img class="theme-light" src="/images/${name}-light.png" alt="${alt}" />
      <img class="theme-dark" src="/images/${name}-dark.png" alt="${alt}" />
    </div></div></figure>
  `;
}

/** 단일(테마 무관) 이미지 마크업을 생성한다. */
function singleImage(name: string, alt: string): string {
  return `<img src="/images/${name}.png" alt="${alt}" />`;
}

/** 한쪽 테마 이미지만 있는 figure (콘텐츠 작성 오류 상황) */
function singleSidedPair(
  name: string,
  alt: string,
  side: "light" | "dark"
): string {
  return `
    <figure><div class="figure-content"><div class="image-frame">
      <img class="theme-${side}" src="/images/${name}-${side}.png" alt="${alt}" />
    </div></div></figure>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("collectGalleryImages", () => {
  describe("단일 이미지", () => {
    it("테마 클래스가 없는 단일 이미지를 1개로 수집한다", () => {
      const prose = createProse(singleImage("screenshot", "스크린샷"));

      const result = collectGalleryImages(prose, "light");

      expect(result).toHaveLength(1);
      expect(result[0].src).toContain("/images/screenshot.png");
      expect(result[0].alt).toBe("스크린샷");
    });

    it("빈 컨테이너는 빈 배열을 반환한다", () => {
      const prose = createProse("<p>텍스트만 있음</p>");

      expect(collectGalleryImages(prose, "light")).toEqual<GalleryImage[]>([]);
    });
  });

  describe("테마쌍 그룹핑", () => {
    it("테마쌍을 라이트 모드에서 light src 1개로 수집한다", () => {
      const prose = createProse(themePair("jvm", "JVM 구조"));

      const result = collectGalleryImages(prose, "light");

      expect(result).toHaveLength(1);
      expect(result[0].src).toContain("/images/jvm-light.png");
      expect(result[0].alt).toBe("JVM 구조");
    });

    it("테마쌍을 다크 모드에서 dark src 1개로 수집한다", () => {
      const prose = createProse(themePair("jvm", "JVM 구조"));

      const result = collectGalleryImages(prose, "dark");

      expect(result).toHaveLength(1);
      expect(result[0].src).toContain("/images/jvm-dark.png");
      expect(result[0].alt).toBe("JVM 구조");
    });

    it("여러 테마쌍을 각각 1개씩만 수집한다 (중복 카운트 없음)", () => {
      const prose = createProse(
        themePair("a", "A") + themePair("b", "B") + themePair("c", "C")
      );

      const result = collectGalleryImages(prose, "light");

      expect(result).toHaveLength(3);
      expect(result.map((img) => img.alt)).toEqual(["A", "B", "C"]);
    });
  });

  describe("한쪽 테마만 있는 figure (fallback)", () => {
    it("theme-light만 있으면 다크 모드에서도 light src로 대체한다", () => {
      const prose = createProse(singleSidedPair("solo", "단방향", "light"));

      const result = collectGalleryImages(prose, "dark");

      expect(result).toHaveLength(1);
      expect(result[0].src).toContain("/images/solo-light.png");
      expect(result[0].alt).toBe("단방향");
    });

    it("theme-dark만 있으면 라이트 모드에서도 dark src로 대체한다", () => {
      const prose = createProse(singleSidedPair("solo", "단방향", "dark"));

      const result = collectGalleryImages(prose, "light");

      expect(result).toHaveLength(1);
      expect(result[0].src).toContain("/images/solo-dark.png");
    });

    it("단방향 figure도 findGalleryStartIndex로 올바른 인덱스를 찾는다", () => {
      const prose = createProse(
        themePair("a", "A") + singleSidedPair("solo", "단방향", "light")
      );
      const soloImg = prose.querySelector(
        "figure:nth-of-type(2) .theme-light"
      ) as HTMLImageElement;

      expect(findGalleryStartIndex(prose, "dark", soloImg)).toBe(1);
    });
  });

  describe("혼합 + 순서 보존", () => {
    it("테마쌍과 단일 이미지를 DOM 출현 순서대로 수집한다", () => {
      const prose = createProse(
        themePair("first", "첫번째") +
          singleImage("middle", "중간") +
          themePair("last", "마지막")
      );

      const result = collectGalleryImages(prose, "dark");

      expect(result).toHaveLength(3);
      expect(result.map((img) => img.alt)).toEqual([
        "첫번째",
        "중간",
        "마지막",
      ]);
      // 테마쌍은 dark src, 단일은 테마 무관 src
      expect(result[0].src).toContain("/images/first-dark.png");
      expect(result[1].src).toContain("/images/middle.png");
      expect(result[2].src).toContain("/images/last-dark.png");
    });
  });
});

describe("findGalleryStartIndex", () => {
  it("클릭한 단일 이미지의 인덱스를 반환한다", () => {
    const prose = createProse(
      singleImage("a", "A") + singleImage("b", "B") + singleImage("c", "C")
    );
    const clicked = prose.querySelectorAll("img")[1] as HTMLImageElement;

    expect(findGalleryStartIndex(prose, "light", clicked)).toBe(1);
  });

  it("클릭한 theme-light 이미지가 속한 그룹 인덱스를 반환한다", () => {
    const prose = createProse(themePair("a", "A") + themePair("b", "B"));
    const clickedLight = prose.querySelector(
      "figure:nth-of-type(2) .theme-light"
    ) as HTMLImageElement;

    expect(findGalleryStartIndex(prose, "light", clickedLight)).toBe(1);
  });

  it("theme-dark 이미지를 클릭해도 같은 테마쌍 그룹 인덱스를 반환한다", () => {
    const prose = createProse(themePair("a", "A") + themePair("b", "B"));
    const clickedDark = prose.querySelector(
      "figure:nth-of-type(2) .theme-dark"
    ) as HTMLImageElement;

    expect(findGalleryStartIndex(prose, "dark", clickedDark)).toBe(1);
  });

  it("컨테이너에 없는 이미지는 -1을 반환한다", () => {
    const prose = createProse(singleImage("a", "A"));
    const orphan = document.createElement("img");

    expect(findGalleryStartIndex(prose, "light", orphan)).toBe(-1);
  });
});

describe("collectGalleryAt", () => {
  it("이미지 목록과 클릭 시작 인덱스를 함께 반환한다", () => {
    const prose = createProse(themePair("a", "A") + themePair("b", "B"));
    const clicked = prose.querySelector(
      "figure:nth-of-type(2) .theme-light"
    ) as HTMLImageElement;

    const result = collectGalleryAt(prose, "light", clicked);

    expect(result.images).toHaveLength(2);
    expect(result.images.map((img) => img.alt)).toEqual(["A", "B"]);
    expect(result.startIndex).toBe(1);
  });

  it("collectGalleryImages / findGalleryStartIndex 와 동일한 결과를 낸다", () => {
    const prose = createProse(
      themePair("a", "A") + singleImage("b", "B") + themePair("c", "C")
    );
    const clicked = prose.querySelectorAll("img")[3] as HTMLImageElement; // c-light

    const combined = collectGalleryAt(prose, "dark", clicked);

    expect(combined.images).toEqual(collectGalleryImages(prose, "dark"));
    expect(combined.startIndex).toBe(
      findGalleryStartIndex(prose, "dark", clicked)
    );
  });

  it("컨테이너에 없는 이미지는 startIndex -1", () => {
    const prose = createProse(singleImage("a", "A"));

    const result = collectGalleryAt(
      prose,
      "light",
      document.createElement("img")
    );

    expect(result.startIndex).toBe(-1);
    expect(result.images).toHaveLength(1);
  });
});
