import { TOC_SYNC_EVENT, findSectionHeading, requestTocSync } from "../tocSync";

describe("findSectionHeading", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <p id="before">도입부<sup><a id="ref-intro">1</a></sup></p>
      <h2 id="intro">소개</h2>
      <p>본문<sup><a id="ref-1">2</a></sup></p>
      <h2 id="setup">설치</h2>
      <h3 id="advanced">고급</h3>
      <section class="footnotes"><ol><li id="fn-1">출처</li></ol></section>
    `;
  });

  const slugs = ["intro", "setup", "advanced"];

  it("대상 바로 앞에 있는 제목을 돌려준다", () => {
    expect(findSectionHeading(document.getElementById("ref-1")!, slugs)).toBe("intro");
  });

  it("모든 제목 뒤에 있는 각주 목록은 마지막 제목에 속한다", () => {
    expect(findSectionHeading(document.getElementById("fn-1")!, slugs)).toBe("advanced");
  });

  it("대상이 제목 자신이면 그 제목을 돌려준다", () => {
    expect(findSectionHeading(document.getElementById("setup")!, slugs)).toBe("setup");
  });

  it("첫 제목보다 앞에 있으면 null을 돌려준다", () => {
    expect(findSectionHeading(document.getElementById("ref-intro")!, slugs)).toBeNull();
  });

  it("DOM에 없는 제목은 건너뛴다", () => {
    expect(
      findSectionHeading(document.getElementById("fn-1")!, ["intro", "missing"])
    ).toBe("intro");
  });
});

describe("requestTocSync", () => {
  it("대상 요소를 담은 목차 동기화 이벤트를 window에 보낸다", () => {
    const listener = jest.fn();
    window.addEventListener(TOC_SYNC_EVENT, listener);
    const target = document.createElement("li");

    requestTocSync(target);

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent<HTMLElement>).detail).toBe(target);
    window.removeEventListener(TOC_SYNC_EVENT, listener);
  });
});
