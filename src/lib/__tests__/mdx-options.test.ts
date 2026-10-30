import { remarkRehypeOptions } from "../mdx-options";

describe("remarkRehypeOptions", () => {
  it("각주 영역 제목을 한국어로 지정한다", () => {
    expect(remarkRehypeOptions.footnoteLabel).toBe("각주");
    expect(remarkRehypeOptions.footnoteLabel).not.toBe("Footnotes");
  });

  it("되돌아가기 링크 라벨에 각주 번호를 1부터 붙인다", () => {
    expect(remarkRehypeOptions.footnoteBackLabel(0, 1)).toBe(
      "본문 1번 각주 위치로 돌아가기"
    );
  });

  it("같은 각주를 여러 번 참조하면 몇 번째 참조인지 덧붙인다", () => {
    expect(remarkRehypeOptions.footnoteBackLabel(1, 2)).toBe(
      "본문 2번 각주 위치로 돌아가기 (2번째 참조)"
    );
  });
});
