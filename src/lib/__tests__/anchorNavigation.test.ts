import { navigateToAnchor } from "../anchorNavigation";
import { scrollAndHighlight } from "../scrollHighlight";
import { requestTocSync } from "../tocSync";

jest.mock("../scrollHighlight", () => ({
  scrollAndHighlight: jest.fn(),
}));

jest.mock("../tocSync", () => ({
  requestTocSync: jest.fn(),
}));

describe("navigateToAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = `<li id="fn-1">출처</li><span id="용어-1">용어</span>`;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
  });

  it("대상으로 부드럽게 스크롤해 강조하고 목차 동기화를 요청한다", () => {
    const target = document.getElementById("fn-1")!;

    expect(navigateToAnchor("fn-1", "glossary-entry-highlight")).toBe(true);

    expect(scrollAndHighlight).toHaveBeenCalledWith(target, "glossary-entry-highlight");
    expect(requestTocSync).toHaveBeenCalledWith(target);
  });

  it("주소창 해시를 대상 id로 바꾸되 방문 기록은 늘리지 않는다", () => {
    const lengthBefore = window.history.length;

    navigateToAnchor("fn-1", "glossary-highlight");

    expect(window.location.hash).toBe("#fn-1");
    expect(window.history.length).toBe(lengthBefore);
  });

  it("한글 id는 인코딩해 해시에 넣는다", () => {
    navigateToAnchor("용어-1", "glossary-highlight");

    expect(window.location.hash).toBe("#%EC%9A%A9%EC%96%B4-1");
    expect(decodeURIComponent(window.location.hash.slice(1))).toBe("용어-1");
  });

  it("이미 퍼센트 인코딩된 id(remark-gfm 한글 각주)는 다시 인코딩하지 않는다", () => {
    document.body.innerHTML = `<li id="fn-%EC%B6%9C%EC%B2%98">출처</li>`;

    navigateToAnchor("fn-%EC%B6%9C%EC%B2%98", "glossary-entry-highlight");

    expect(window.location.hash).toBe("#fn-%EC%B6%9C%EC%B2%98");
  });

  it("대상이 없으면 아무것도 하지 않고 false를 돌려준다", () => {
    expect(navigateToAnchor("missing", "glossary-highlight")).toBe(false);

    expect(window.location.hash).toBe("");
    expect(scrollAndHighlight).not.toHaveBeenCalled();
    expect(requestTocSync).not.toHaveBeenCalled();
  });
});
