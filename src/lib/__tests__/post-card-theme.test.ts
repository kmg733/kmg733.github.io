import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  POST_CARD_THEMES,
  DEFAULT_POST_CARD_THEME,
  getPostCardTheme,
  getPostCardLabel,
} from "../post-card-theme";

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
    expect(DEFAULT_POST_CARD_THEME).toMatch(/\bbg-zinc-\d+\b/);
    expect(DEFAULT_POST_CARD_THEME).toMatch(/\bdark:bg-zinc-\d+\b/);
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
    "%s 는 라이트/다크 배경·글자색을 완성된 클래스 문자열로 가진다",
    (_key, classes) => {
      // Tailwind 가 소스를 스캔해 클래스를 생성하므로 조합이 아닌 완성 문자열이어야 한다
      expect(classes).toMatch(/(^|\s)bg-[a-z]+-\d+(\s|$)/);
      expect(classes).toMatch(/(^|\s)text-[a-z]+-\d+(\s|$)/);
      expect(classes).toMatch(/(^|\s)dark:bg-[a-z]+-\d+(\s|$)/);
      expect(classes).toMatch(/(^|\s)dark:text-[a-z]+-\d+(\s|$)/);
      expect(classes).not.toMatch(/\$\{|undefined/);
    }
  );

  it("6개 색 계열이 서로 다르고 기본값(zinc)과도 다르다", () => {
    const families = entries.map(
      ([, classes]) => /(?:^|\s)bg-([a-z]+)-\d+/.exec(classes)?.[1]
    );
    expect(families).toHaveLength(6);
    expect(families).not.toContain(undefined);
    expect(new Set(families).size).toBe(6);
    expect(families).not.toContain("zinc");
  });

  it("content/posts 의 실제 subcategory 값이 모두 매핑에 있다", () => {
    const dir = path.join(process.cwd(), "content/posts");
    const subcategories = new Set(
      fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
        .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf8")).data)
        .map((data) => data.subcategory as string | undefined)
        .filter((s): s is string => typeof s === "string")
    );

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
