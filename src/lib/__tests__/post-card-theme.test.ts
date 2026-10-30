import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  POST_CARD_THEMES,
  DEFAULT_POST_CARD_THEME,
  getPostCardTheme,
  getPostCardLabel,
  POST_CARD_SHORT_LABELS,
  getPostCardShortLabel,
} from "../post-card-theme";

function readContentSubcategories(): Set<string> {
  const dir = path.join(process.cwd(), "content/posts");
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
      .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf8")).data)
      .map((data) => data.subcategory as string | undefined)
      .filter((s): s is string => typeof s === "string")
  );
}

describe("getPostCardTheme", () => {
  it("매핑된 하위 카테고리면 해당 색 클래스를 반환한다", () => {
    expect(getPostCardTheme("Java")).toBe(POST_CARD_THEMES.Java);
    expect(getPostCardTheme("웹")).toBe(POST_CARD_THEMES["웹"]);
  });

  it("매핑에 없는 하위 카테고리면 zinc 기본값을 반환한다", () => {
    expect(getPostCardTheme("Rust")).toBe(DEFAULT_POST_CARD_THEME);
  });

  it("하위 카테고리가 없으면 zinc 기본값을 반환한다", () => {
    expect(getPostCardTheme(undefined)).toBe(DEFAULT_POST_CARD_THEME);
    expect(getPostCardTheme()).toBe(DEFAULT_POST_CARD_THEME);
  });

  it("Object.prototype 의 키(constructor 등)는 매핑으로 취급하지 않는다", () => {
    expect(getPostCardTheme("constructor")).toBe(DEFAULT_POST_CARD_THEME);
    expect(getPostCardTheme("toString")).toBe(DEFAULT_POST_CARD_THEME);
  });

  it("기본값은 zinc 계열이다", () => {
    expect(DEFAULT_POST_CARD_THEME.card).toMatch(/(^|\s)from-zinc-\d+(\s|$)/);
    expect(DEFAULT_POST_CARD_THEME.card).toMatch(/(^|\s)to-zinc-\d+(\s|$)/);
    expect(DEFAULT_POST_CARD_THEME.card).toMatch(
      /(^|\s)dark:from-zinc-\d+(\s|$)/
    );
    expect(DEFAULT_POST_CARD_THEME.glow).toMatch(
      /(^|\s)dark:bg-zinc-\d+\/\d+(\s|$)/
    );
  });
});

describe("POST_CARD_THEMES", () => {
  const entries = Object.entries(POST_CARD_THEMES);

  it("6개 하위 카테고리를 매핑한다", () => {
    expect(Object.keys(POST_CARD_THEMES).sort()).toEqual(
      ["Database", "Java", "JavaScript", "Spring", "아키텍처", "웹"].sort()
    );
  });

  it.each(entries)(
    "%s 는 라이트/다크 그라데이션·글자색을 완성된 클래스 문자열로 가진다",
    (_key, theme) => {
      // Tailwind 가 소스를 스캔해 클래스를 생성하므로 조합이 아닌 완성 문자열이어야 한다
      expect(theme.card).toMatch(/(^|\s)from-[a-z]+-\d+(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)text-[a-z]+-\d+(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)dark:via-[a-z]+-\d+(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)dark:text-[a-z]+-\d+(\s|$)/);
      expect(theme.card).not.toMatch(/\$\{|undefined/);
      expect(theme.glow).not.toMatch(/\$\{|undefined/);
    }
  );

  it("6개 색 계열이 서로 다르고 기본값(zinc)과도 다르다", () => {
    const families = entries.map(
      ([, theme]) => /(?:^|\s)from-([a-z]+)-\d+/.exec(theme.card)?.[1]
    );
    expect(families).toHaveLength(6);
    expect(families).not.toContain(undefined);
    expect(new Set(families).size).toBe(6);
    expect(families).not.toContain("zinc");
  });

  it.each([
    ...entries,
    ["기본값", DEFAULT_POST_CARD_THEME] as const,
  ])(
    "%s 는 그라데이션 카드와 다크 빛 번짐 색을 가진다",
    (_key, theme) => {
      expect(theme.card).toMatch(/(^|\s)bg-linear-to-br(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)from-[a-z]+-\d+(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)to-[a-z]+-\d+(\s|$)/);
      expect(theme.card).toMatch(/(^|\s)dark:from-[a-z]+-\d+(\s|$)/);
      expect(theme.glow).toMatch(/(^|\s)dark:bg-[a-z]+-\d+\/\d+(\s|$)/);
    }
  );

  it("content/posts 의 실제 subcategory 값이 모두 매핑에 있다", () => {
    const subcategories = readContentSubcategories();

    expect(subcategories.size).toBeGreaterThan(0);
    const missing = [...subcategories].filter(
      (s) => !Object.prototype.hasOwnProperty.call(POST_CARD_THEMES, s)
    );
    expect(missing).toEqual([]);
  });
});

describe("getPostCardLabel", () => {
  const base = { category: "개발" };

  it("시리즈와 순서가 모두 있으면 '{subcategory} · 시리즈 {N}편'", () => {
    expect(
      getPostCardLabel({
        ...base,
        subcategory: "Java",
        series: "java-memory",
        seriesOrder: 2,
      })
    ).toBe("Java · 시리즈 2편");
  });

  it("시리즈인데 subcategory 가 없으면 '시리즈 {N}편'", () => {
    expect(
      getPostCardLabel({ ...base, series: "s", seriesOrder: 3 })
    ).toBe("시리즈 3편");
  });

  it("series 만 있고 seriesOrder 가 없으면 subcategory", () => {
    expect(
      getPostCardLabel({ ...base, subcategory: "Spring", series: "s" })
    ).toBe("Spring");
  });

  it("seriesOrder 만 있고 series 가 없으면 subcategory", () => {
    expect(
      getPostCardLabel({ ...base, subcategory: "Spring", seriesOrder: 1 })
    ).toBe("Spring");
  });

  it("시리즈가 아니면 subcategory", () => {
    expect(getPostCardLabel({ ...base, subcategory: "웹" })).toBe("웹");
  });

  it("시리즈도 subcategory 도 없으면 category", () => {
    expect(getPostCardLabel(base)).toBe("개발");
  });
});

describe("getPostCardShortLabel", () => {
  const base = { category: "개발" };

  it("긴 하위 카테고리는 줄임말로 바꾼다", () => {
    expect(getPostCardShortLabel({ ...base, subcategory: "JavaScript" })).toBe(
      "JS"
    );
    expect(getPostCardShortLabel({ ...base, subcategory: "Database" })).toBe(
      "DB"
    );
  });

  it("매핑에 없는 하위 카테고리는 그대로 쓴다", () => {
    expect(getPostCardShortLabel({ ...base, subcategory: "Java" })).toBe("Java");
    expect(getPostCardShortLabel({ ...base, subcategory: "아키텍처" })).toBe(
      "아키텍처"
    );
  });

  it("하위 카테고리가 없으면 category 를 쓴다", () => {
    expect(getPostCardShortLabel({ category: "블로그" })).toBe("블로그");
  });

  it("Object.prototype 의 키(constructor 등)는 매핑으로 취급하지 않는다", () => {
    expect(getPostCardShortLabel({ ...base, subcategory: "constructor" })).toBe(
      "constructor"
    );
    expect(getPostCardShortLabel({ ...base, subcategory: "toString" })).toBe(
      "toString"
    );
  });
});

describe("POST_CARD_SHORT_LABELS", () => {
  const MAX_SHORT_LABEL_LENGTH = 6;

  it("줄임말 매핑과 색 매핑의 키마다 짧은 라벨이 6자 이하다", () => {
    const keys = new Set([
      ...Object.keys(POST_CARD_SHORT_LABELS),
      ...Object.keys(POST_CARD_THEMES),
    ]);
    const tooLong = [...keys].filter(
      (s) =>
        getPostCardShortLabel({ category: "개발", subcategory: s }).length >
        MAX_SHORT_LABEL_LENGTH
    );
    expect(tooLong).toEqual([]);
  });

  it("content/posts 의 실제 subcategory 짧은 라벨이 모두 6자 이하다", () => {
    const subcategories = readContentSubcategories();

    expect(subcategories.size).toBeGreaterThan(0);
    const tooLong = [...subcategories].filter(
      (s) =>
        getPostCardShortLabel({ category: "개발", subcategory: s }).length >
        MAX_SHORT_LABEL_LENGTH
    );
    expect(tooLong).toEqual([]);
  });
});
