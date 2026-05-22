import { render, screen, act, fireEvent, within } from "@testing-library/react";
import ImageLightbox from "../ImageLightbox";

/**
 * ImageLightbox 썸네일 필름스트립 테스트.
 *
 * 갤러리가 열리면 포스트 내 모든 이미지를 작은 썸네일 목록으로 표시하고,
 * 썸네일 클릭 시 해당 이미지로 이동한다. 활성 썸네일은 강조 + scrollIntoView.
 * 단일 이미지일 때는 필름스트립을 표시하지 않는다.
 */

// jsdom은 scrollIntoView를 구현하지 않으므로 모킹한다.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  document.body.style.overflow = "";
});

/** 테마쌍 figure를 포함한 .prose 페이지를 렌더한다. */
function renderGallery(count: number) {
  const figures = Array.from({ length: count }, (_, i) => {
    const name = String.fromCharCode(97 + i); // a, b, c...
    return (
      <figure key={name}>
        <div className="figure-content">
          <div className="image-frame">
            <img
              className="theme-light"
              src={`/images/${name}-light.png`}
              alt={`이미지 ${name.toUpperCase()}`}
              data-testid={`img-${name}-light`}
            />
            <img
              className="theme-dark"
              src={`/images/${name}-dark.png`}
              alt={`이미지 ${name.toUpperCase()}`}
            />
          </div>
        </div>
      </figure>
    );
  });

  return render(
    <div>
      <div className="prose">{figures}</div>
      <ImageLightbox />
    </div>
  );
}

function openAt(letter: string) {
  act(() => {
    fireEvent.click(screen.getByTestId(`img-${letter}-light`));
  });
}

function getFilmstrip(): HTMLElement | null {
  return document.querySelector(".lightbox-filmstrip");
}

function getThumbs(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>(".lightbox-thumb")
  );
}

function getCounter(): HTMLElement | null {
  return document.querySelector(".lightbox-counter");
}

describe("필름스트립 - 렌더", () => {
  test("이미지가 2개 이상이면 이미지 수만큼 썸네일을 렌더한다", () => {
    renderGallery(3);
    openAt("a");

    expect(getFilmstrip()).toBeInTheDocument();
    expect(getThumbs()).toHaveLength(3);
  });

  test("각 썸네일은 해당 이미지의 src를 표시한다", () => {
    renderGallery(3);
    openAt("a");

    const thumbImgs = document.querySelectorAll<HTMLImageElement>(
      ".lightbox-thumb img"
    );
    expect(thumbImgs[0].getAttribute("src")).toContain("a-light.png");
    expect(thumbImgs[1].getAttribute("src")).toContain("b-light.png");
    expect(thumbImgs[2].getAttribute("src")).toContain("c-light.png");
  });
});

describe("필름스트립 - 클릭 이동", () => {
  test("썸네일 클릭 시 해당 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.click(getThumbs()[2]);
    });

    expect(getCounter()).toHaveTextContent("3 / 3");
    expect(
      document.querySelector(".lightbox-image")?.getAttribute("src")
    ).toContain("c-light.png");
  });

  test("썸네일 클릭은 라이트박스를 닫지 않는다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.click(getThumbs()[1]);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).not.toHaveClass("closing");
  });
});

describe("필름스트립 - 활성 표시", () => {
  test("현재 이미지의 썸네일에 active 클래스와 aria-current가 부여된다", () => {
    renderGallery(3);
    openAt("b");

    const thumbs = getThumbs();
    expect(thumbs[1]).toHaveClass("active");
    expect(thumbs[1]).toHaveAttribute("aria-current", "true");
    expect(thumbs[0]).not.toHaveClass("active");
    expect(thumbs[0]).not.toHaveAttribute("aria-current");
  });

  test("이동 시 활성 썸네일이 변경된다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "다음 이미지" }));
    });

    const thumbs = getThumbs();
    expect(thumbs[1]).toHaveClass("active");
    expect(thumbs[0]).not.toHaveClass("active");
  });
});

describe("필름스트립 - scrollIntoView", () => {
  test("이미지 이동 시 활성 썸네일을 화면에 스크롤한다", () => {
    renderGallery(5);
    openAt("a");
    (Element.prototype.scrollIntoView as jest.Mock).mockClear();

    act(() => {
      fireEvent.click(getThumbs()[4]);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});

describe("필름스트립 - 접근성", () => {
  test("필름스트립 컨테이너에 aria-label이 있다", () => {
    renderGallery(3);
    openAt("a");

    expect(getFilmstrip()).toHaveAttribute("aria-label");
  });

  test("각 썸네일 버튼에 위치를 알리는 aria-label이 있다", () => {
    renderGallery(3);
    openAt("a");

    const thumbs = getThumbs();
    expect(thumbs[0]).toHaveAttribute("aria-label", expect.stringContaining("1"));
    expect(thumbs[2]).toHaveAttribute("aria-label", expect.stringContaining("3"));
  });

  test("필름스트립 추가 후에도 ESC로 닫힌다 (회귀 방지)", () => {
    renderGallery(3);
    openAt("a");

    const dialog = screen.getByRole("dialog");
    act(() => {
      fireEvent.keyDown(dialog, { key: "Escape" });
    });

    expect(dialog).toHaveClass("closing");
  });

  test("필름스트립 추가 후에도 첫 포커스는 닫기 버튼이다 (회귀 방지)", () => {
    renderGallery(3);
    openAt("a");

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "이미지 닫기" })
    );
  });
});

describe("필름스트립 - 단일 이미지 하위호환", () => {
  test("이미지가 1개면 필름스트립을 표시하지 않는다", () => {
    renderGallery(1);
    openAt("a");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(getFilmstrip()).not.toBeInTheDocument();
    expect(getThumbs()).toHaveLength(0);
  });

  test("이미지가 1개여도 메인 이미지는 표시된다", () => {
    renderGallery(1);
    openAt("a");

    const main = document.querySelector(".lightbox-image");
    expect(main).toBeInTheDocument();
    expect(main?.getAttribute("src")).toContain("a-light.png");
  });
});
