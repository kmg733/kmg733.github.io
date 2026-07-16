import { SITE_URL } from "../constants";

describe("SITE_URL", () => {
  it("후행 슬래시 없이 정규화되어 export된다", () => {
    // sitemap/robots의 URL 조합이 이 불변식에 의존한다.
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("절대 URL 형태다", () => {
    expect(SITE_URL).toMatch(/^https?:\/\/[^/]+$/);
  });
});
