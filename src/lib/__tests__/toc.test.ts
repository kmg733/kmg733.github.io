import GithubSlugger from "github-slugger";
import { extractHeadings } from "@/lib/toc";

/**
 * extractHeadings 슬러그 생성 테스트.
 *
 * 핵심 이슈: 목차 링크 slug와 실제 heading id(rehype-slug = github-slugger)가
 * 서로 다른 규칙으로 생성되어, 엠대시(—) 등이 든 제목에서
 * getElementById가 null을 반환 → 목차 클릭 시 스크롤 안 됨.
 *
 * 수정 방향: extractHeadings도 rehype-slug와 동일한 github-slugger로 slug를 생성해
 * 두 지점의 slug 규칙을 단일 출처로 통일한다.
 */
describe("extractHeadings", () => {
  test("### / ## 헤딩을 level·text와 함께 추출한다", () => {
    const content = ["## 소개", "### 설치 방법", "본문", "## 사용법"].join("\n");

    const result = extractHeadings(content);

    expect(result).toEqual([
      { slug: "소개", text: "소개", level: 2 },
      { slug: "설치-방법", text: "설치 방법", level: 3 },
      { slug: "사용법", text: "사용법", level: 2 },
    ]);
  });

  test("헤딩이 아닌 라인(#, ####)은 무시한다", () => {
    const content = ["# 최상위 제목", "#### 너무 깊은 제목", "일반 문단"].join(
      "\n"
    );

    expect(extractHeadings(content)).toEqual([]);
  });

  describe("rehype-slug(github-slugger)와 slug 규칙이 일치한다", () => {
    // 실제 렌더된 heading id의 출처인 github-slugger와 동일해야
    // 목차 클릭 시 getElementById가 요소를 찾는다.
    const cases = [
      // 버그 재현: 엠대시(—) 양옆 공백 → github-slugger는 이중 하이픈(--) 생성
      "왜 필요했나 — 같은 DB를 보는 두 서버",
      "기대 — UPDATE가 자동으로 막아줄 것이다",
      "동시성 경합의 정체 — Lost Update와 TOCTOU",
      // 기존 정상 케이스(회귀 방지)
      "Lost Update (갱신 손실)",
      "TOCTOU (Time-Of-Check-To-Time-Of-Use)",
    ];

    test.each(cases)("«%s»", (heading) => {
      const expected = new GithubSlugger().slug(heading);
      const [item] = extractHeadings(`## ${heading}`);
      expect(item.slug).toBe(expected);
    });
  });

  test("엠대시가 든 제목은 이중 하이픈 slug를 생성한다(버그 재현)", () => {
    const [item] = extractHeadings("## 왜 필요했나 — 같은 DB를 보는 두 서버");
    expect(item.slug).toBe("왜-필요했나--같은-db를-보는-두-서버");
  });

  test("동일 제목이 반복되면 github-slugger처럼 -1, -2 접미사를 붙인다", () => {
    const content = ["## 정리", "## 정리", "## 정리"].join("\n");

    const slugs = extractHeadings(content).map((h) => h.slug);

    expect(slugs).toEqual(["정리", "정리-1", "정리-2"]);
  });
});
