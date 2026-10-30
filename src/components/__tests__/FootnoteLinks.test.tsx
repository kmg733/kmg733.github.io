import { render, fireEvent } from "@testing-library/react";
import FootnoteLinks from "../FootnoteLinks";
import { scrollAndHighlight } from "@/lib/scrollHighlight";
import { requestTocSync } from "@/lib/tocSync";

jest.mock("@/lib/scrollHighlight", () => ({
  scrollAndHighlight: jest.fn(),
}));

jest.mock("@/lib/tocSync", () => ({
  requestTocSync: jest.fn(),
}));

/**
 * remark-gfm이 실제로 만드는 각주 마크업과 같은 구조.
 */
function renderPost() {
  document.body.innerHTML = `
    <p>본문<sup><a href="#user-content-fn-advisory" id="user-content-fnref-advisory" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
    <p><a href="#other" id="plain">일반 링크</a></p>
    <section data-footnotes="" class="footnotes">
      <ol>
        <li id="user-content-fn-advisory">
          <p>출처 <a href="#user-content-fnref-advisory" data-footnote-backref="" class="data-footnote-backref">↩</a></p>
        </li>
      </ol>
    </section>
  `;
  return render(<FootnoteLinks />);
}

describe("FootnoteLinks", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
  });

  it("본문 각주 번호를 누르면 각주 항목으로 부드럽게 이동하고 강조한다", () => {
    renderPost();
    const ref = document.getElementById("user-content-fnref-advisory")!;
    const footnote = document.getElementById("user-content-fn-advisory")!;

    const notPrevented = fireEvent.click(ref);

    expect(notPrevented).toBe(false);
    expect(scrollAndHighlight).toHaveBeenCalledWith(footnote, "glossary-entry-highlight");
    expect(requestTocSync).toHaveBeenCalledWith(footnote);
    expect(window.location.hash).toBe("#user-content-fn-advisory");
  });

  it("각주의 ↩ 를 누르면 본문 각주 번호로 돌아가 강조한다", () => {
    renderPost();
    const backref = document.querySelector<HTMLElement>("[data-footnote-backref]")!;
    const ref = document.getElementById("user-content-fnref-advisory")!;

    const notPrevented = fireEvent.click(backref);

    expect(notPrevented).toBe(false);
    expect(scrollAndHighlight).toHaveBeenCalledWith(ref, "glossary-highlight");
    expect(requestTocSync).toHaveBeenCalledWith(ref);
    expect(window.location.hash).toBe("#user-content-fnref-advisory");
  });

  it("각주 번호 안쪽 요소를 눌러도 링크로 처리한다", () => {
    renderPost();
    const ref = document.getElementById("user-content-fnref-advisory")!;
    ref.innerHTML = "<span>1</span>";

    fireEvent.click(ref.querySelector("span")!);

    expect(scrollAndHighlight).toHaveBeenCalledTimes(1);
  });

  it("각주가 아닌 링크는 브라우저 기본 동작에 맡긴다", () => {
    renderPost();

    const notPrevented = fireEvent.click(document.getElementById("plain")!);

    expect(notPrevented).toBe(true);
    expect(scrollAndHighlight).not.toHaveBeenCalled();
    expect(requestTocSync).not.toHaveBeenCalled();
  });

  it("이동할 대상이 없으면 기본 동작에 맡긴다", () => {
    renderPost();
    document.getElementById("user-content-fn-advisory")!.removeAttribute("id");

    const notPrevented = fireEvent.click(document.getElementById("user-content-fnref-advisory")!);

    expect(notPrevented).toBe(true);
    expect(scrollAndHighlight).not.toHaveBeenCalled();
  });

  it("텍스트 노드처럼 요소가 아닌 대상의 클릭은 무시한다", () => {
    renderPost();
    const ref = document.getElementById("user-content-fnref-advisory")!;

    ref.firstChild!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(scrollAndHighlight).not.toHaveBeenCalled();
  });

  it("언마운트 후에는 각주 클릭을 가로채지 않는다", () => {
    const { unmount } = renderPost();
    unmount();

    fireEvent.click(document.getElementById("user-content-fnref-advisory")!);

    expect(scrollAndHighlight).not.toHaveBeenCalled();
  });

  it("한글 이름 각주도 remark-gfm이 만든 인코딩된 id 그대로 찾아 이동한다", () => {
    // remark-gfm 은 [^출처] 의 이름을 퍼센트 인코딩한 채로 href 와 id 에 넣는다
    document.body.innerHTML = `
      <p>본문<sup><a href="#user-content-fn-%EC%B6%9C%EC%B2%98" id="user-content-fnref-%EC%B6%9C%EC%B2%98" data-footnote-ref="">1</a></sup></p>
      <section data-footnotes="" class="footnotes"><ol>
        <li id="user-content-fn-%EC%B6%9C%EC%B2%98"><p>한글 각주 <a href="#user-content-fnref-%EC%B6%9C%EC%B2%98" data-footnote-backref="">↩</a></p></li>
      </ol></section>
    `;
    render(<FootnoteLinks />);
    const footnote = document.getElementById("user-content-fn-%EC%B6%9C%EC%B2%98")!;

    const notPrevented = fireEvent.click(document.getElementById("user-content-fnref-%EC%B6%9C%EC%B2%98")!);

    expect(notPrevented).toBe(false);
    expect(scrollAndHighlight).toHaveBeenCalledWith(footnote, "glossary-entry-highlight");
    // 주소창 해시도 링크 주소와 같다 (% 를 다시 인코딩하지 않음)
    expect(window.location.hash).toBe("#user-content-fn-%EC%B6%9C%EC%B2%98");
  });

  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Cmd", { metaKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["가운데 버튼", { button: 1 }],
  ])("%s+클릭은 새 탭 열기 등 브라우저 기본 동작에 맡긴다", (_label, init) => {
    renderPost();

    const notPrevented = fireEvent.click(document.getElementById("user-content-fnref-advisory")!, init);

    expect(notPrevented).toBe(true);
    expect(scrollAndHighlight).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("");
  });
});
