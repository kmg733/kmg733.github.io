import { render, screen, fireEvent } from "@testing-library/react";
import RssMenu from "../RssMenu";

describe("RssMenu", () => {
  it("트리거는 네이티브 button이며 접근성 라벨을 가진다", () => {
    render(<RssMenu />);

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("기본 상태는 닫힘 (aria-expanded=false, 링크 미표시)", () => {
    render(<RssMenu />);

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "RSS 2.0" })).not.toBeInTheDocument();
  });

  it("트리거 클릭 시 열리고 RSS/Atom 링크가 노출된다", () => {
    render(<RssMenu />);

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const rss = screen.getByRole("link", { name: "RSS 2.0" });
    const atom = screen.getByRole("link", { name: "Atom 1.0" });
    expect(rss).toHaveAttribute("href", "/feed.xml");
    expect(atom).toHaveAttribute("href", "/atom.xml");
  });

  it("열린 상태에서 다시 클릭하면 닫힌다", () => {
    render(<RssMenu />);

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "RSS 2.0" })).not.toBeInTheDocument();
  });

  it("Escape 키를 누르면 닫히고 포커스가 트리거로 복귀한다", () => {
    render(<RssMenu />);

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "RSS 2.0" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "RSS 2.0" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("바깥 영역을 클릭하면 닫힌다", () => {
    render(
      <div>
        <RssMenu />
        <button type="button">바깥 버튼</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: /피드 구독/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "RSS 2.0" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "바깥 버튼" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "RSS 2.0" })).not.toBeInTheDocument();
  });

  it("닫힘 상태에서는 document 리스너를 등록하지 않는다", () => {
    const addSpy = jest.spyOn(document, "addEventListener");

    render(<RssMenu />);

    const relevant = addSpy.mock.calls.filter(
      ([type]) => type === "keydown" || type === "mousedown"
    );
    expect(relevant).toHaveLength(0);

    addSpy.mockRestore();
  });

  it("언마운트 시 등록한 리스너를 모두 해제한다", () => {
    const addSpy = jest.spyOn(document, "addEventListener");
    const removeSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(<RssMenu />);
    fireEvent.click(screen.getByRole("button", { name: /피드 구독/ })); // 열어서 리스너 등록

    unmount();

    const added = addSpy.mock.calls.filter(
      ([t]) => t === "keydown" || t === "mousedown"
    ).length;
    const removed = removeSpy.mock.calls.filter(
      ([t]) => t === "keydown" || t === "mousedown"
    ).length;
    expect(removed).toBe(added);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
