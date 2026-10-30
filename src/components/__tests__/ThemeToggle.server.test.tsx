/**
 * @jest-environment node
 */
import { renderToString } from "react-dom/server";
import ThemeToggle from "../ThemeToggle";

// 정적 내보내기 빌드처럼 document가 없는 환경에서 렌더링한다
describe("ThemeToggle (서버 렌더링)", () => {
  it("document 없이도 렌더링되고 테마 로딩 중 자리표시 버튼만 그린다", () => {
    expect(typeof document).toBe("undefined");

    const html = renderToString(<ThemeToggle />);

    expect(html).toContain("테마 로딩 중");
    expect(html).not.toContain("모드로 전환");
  });
});
