import { scrollAndHighlight } from "../scrollHighlight";

describe("scrollAndHighlight", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("target이 null이면 아무 동작도 하지 않는다", () => {
    expect(() => scrollAndHighlight(null)).not.toThrow();
  });

  it("scrollIntoView를 smooth behavior로 호출한다", () => {
    const target = createMockElement();

    scrollAndHighlight(target);

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  describe("scrollend 지원 환경", () => {
    beforeEach(() => {
      Object.defineProperty(window, "onscrollend", {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      delete (window as Record<string, unknown>)["onscrollend"];
    });

    it("scrollend 이벤트 발생 후 강조 클래스를 추가한다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);

      expect(target.classList.add).not.toHaveBeenCalled();

      window.dispatchEvent(new Event("scrollend"));

      expect(target.classList.add).toHaveBeenCalledWith("glossary-highlight");
    });

    it("강조 클래스는 1500ms 시점에서는 아직 제거되지 않는다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);
      window.dispatchEvent(new Event("scrollend"));

      jest.advanceTimersByTime(1500);

      expect(target.classList.remove).not.toHaveBeenCalled();
    });

    it("강조 클래스는 2000ms 후 제거된다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);
      window.dispatchEvent(new Event("scrollend"));

      jest.advanceTimersByTime(2000);

      expect(target.classList.remove).toHaveBeenCalledWith("glossary-highlight");
    });

    it("scrollend 미발생 시 1000ms 안전 타임아웃으로 강조를 적용한다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);

      expect(target.classList.add).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(target.classList.add).toHaveBeenCalledWith("glossary-highlight");
    });

    it("scrollend와 안전 타임아웃 중 먼저 발생한 것만 적용된다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);
      window.dispatchEvent(new Event("scrollend"));

      jest.advanceTimersByTime(1000);

      expect(target.classList.add).toHaveBeenCalledTimes(1);
    });

    it("scrollend 발생 시 안전 타임아웃이 취소된다", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const target = createMockElement();
      scrollAndHighlight(target);

      window.dispatchEvent(new Event("scrollend"));

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe("scrollend 미지원 환경", () => {
    it("500ms 후 강조 클래스를 추가한다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);

      expect(target.classList.add).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      expect(target.classList.add).toHaveBeenCalledWith("glossary-highlight");
    });

    it("강조 클래스는 2000ms 후 제거된다", () => {
      const target = createMockElement();

      scrollAndHighlight(target);
      jest.advanceTimersByTime(500);

      expect(target.classList.remove).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);

      expect(target.classList.remove).toHaveBeenCalledWith("glossary-highlight");
    });
  });

  it("커스텀 클래스명을 지원한다", () => {
    Object.defineProperty(window, "onscrollend", {
      value: null,
      writable: true,
      configurable: true,
    });

    const target = createMockElement();

    scrollAndHighlight(target, "heading-highlight");
    window.dispatchEvent(new Event("scrollend"));

    expect(target.classList.add).toHaveBeenCalledWith("heading-highlight");

    jest.advanceTimersByTime(2000);

    expect(target.classList.remove).toHaveBeenCalledWith("heading-highlight");

    delete (window as Record<string, unknown>)["onscrollend"];
  });
});

function createMockElement(): HTMLElement {
  return {
    scrollIntoView: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  } as unknown as HTMLElement;
}
