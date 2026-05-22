import { render, screen, act, fireEvent, within } from "@testing-library/react";
import ImageLightbox from "../ImageLightbox";

/**
 * ImageLightbox 갤러리 기능 테스트 (이슈 #116).
 *
 * 포스트 내 여러 이미지를 갤러리로 탐색한다.
 * - 클릭한 이미지가 시작 인덱스
 * - 좌우 네비게이션 + 위치 인디케이터(N / M)
 * - clamp 경계 (첫에서 이전 비활성, 마지막에서 다음 비활성)
 * - 테마쌍은 현재 테마 기준 1개로 카운트
 * - 단일 이미지일 때 네비 UI 미표시 (하위호환)
 *
 * jsdom 기본 테마는 light (document.documentElement에 dark 클래스 없음).
 */

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

/** 특정 figure의 라이트 이미지를 클릭해 갤러리를 연다. */
function openAt(letter: string) {
  act(() => {
    fireEvent.click(screen.getByTestId(`img-${letter}-light`));
  });
}

function getCounter(): HTMLElement | null {
  return document.querySelector(".lightbox-counter");
}

function getLightboxImageSrc(): string {
  return (
    document.querySelector(".lightbox-image")?.getAttribute("src") ?? ""
  );
}

afterEach(() => {
  document.body.style.overflow = "";
});

describe("갤러리 - 시작 인덱스", () => {
  test("클릭한 이미지가 시작 위치가 된다", () => {
    renderGallery(3);

    openAt("b");

    expect(getCounter()).toHaveTextContent("2 / 3");
    expect(getLightboxImageSrc()).toContain("b-light.png");
  });

  test("첫 이미지 클릭 시 1 / N 로 표시된다", () => {
    renderGallery(3);

    openAt("a");

    expect(getCounter()).toHaveTextContent("1 / 3");
  });
});

describe("갤러리 - 위치 인디케이터", () => {
  test("테마쌍은 현재 테마 기준 1개로 카운트한다 (중복 없음)", () => {
    renderGallery(3); // 테마쌍 3개 = 논리 이미지 3개

    openAt("a");

    expect(getCounter()).toHaveTextContent("1 / 3");
  });
});

describe("갤러리 - 좌우 네비게이션", () => {
  test("다음 버튼 클릭 시 다음 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "다음 이미지" }));
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
    expect(getLightboxImageSrc()).toContain("b-light.png");
  });

  test("이전 버튼 클릭 시 이전 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("c");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "이전 이미지" }));
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
    expect(getLightboxImageSrc()).toContain("b-light.png");
  });

  test("네비게이션 버튼 클릭은 라이트박스를 닫지 않는다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "다음 이미지" }));
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).not.toHaveClass("closing");
  });
});

describe("갤러리 - clamp 경계", () => {
  test("첫 이미지에서 이전 버튼은 비활성화된다", () => {
    renderGallery(3);
    openAt("a");

    expect(screen.getByRole("button", { name: "이전 이미지" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "다음 이미지" })
    ).not.toBeDisabled();
  });

  test("마지막 이미지에서 다음 버튼은 비활성화된다", () => {
    renderGallery(3);
    openAt("c");

    expect(screen.getByRole("button", { name: "다음 이미지" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "이전 이미지" })
    ).not.toBeDisabled();
  });

  test("마지막에서 다음 버튼을 눌러도 인덱스가 넘어가지 않는다", () => {
    renderGallery(3);
    openAt("c");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "다음 이미지" }));
    });

    expect(getCounter()).toHaveTextContent("3 / 3");
  });
});

describe("갤러리 - 키보드 네비게이션", () => {
  test("→ 화살표로 다음 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
    expect(getLightboxImageSrc()).toContain("b-light.png");
  });

  test("← 화살표로 이전 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("c");

    act(() => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
    expect(getLightboxImageSrc()).toContain("b-light.png");
  });

  test("마지막에서 → 화살표를 눌러도 인덱스가 넘어가지 않는다", () => {
    renderGallery(3);
    openAt("c");

    act(() => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    });

    expect(getCounter()).toHaveTextContent("3 / 3");
  });

  test("ESC 키는 화살표 핸들러 추가 후에도 닫기를 동작시킨다 (회귀 방지)", () => {
    renderGallery(3);
    openAt("a");

    const dialog = screen.getByRole("dialog");
    act(() => {
      fireEvent.keyDown(dialog, { key: "Escape" });
    });

    expect(dialog).toHaveClass("closing");
  });
});

describe("갤러리 - 터치 스와이프", () => {
  function getContent(): HTMLElement {
    return document.querySelector(".lightbox-content") as HTMLElement;
  }

  test("왼쪽 스와이프 시 다음 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("a");

    act(() => {
      fireEvent.touchStart(getContent(), {
        touches: [{ clientX: 250, clientY: 100 }],
      });
      fireEvent.touchEnd(getContent(), {
        changedTouches: [{ clientX: 100, clientY: 110 }],
      });
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
  });

  test("오른쪽 스와이프 시 이전 이미지로 이동한다", () => {
    renderGallery(3);
    openAt("c");

    act(() => {
      fireEvent.touchStart(getContent(), {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(getContent(), {
        changedTouches: [{ clientX: 250, clientY: 110 }],
      });
    });

    expect(getCounter()).toHaveTextContent("2 / 3");
  });
});

describe("갤러리 - 단일 이미지 하위호환", () => {
  test("이미지가 1개면 네비 버튼과 인디케이터를 표시하지 않는다", () => {
    renderGallery(1);
    openAt("a");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이전 이미지" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다음 이미지" })
    ).not.toBeInTheDocument();
    expect(getCounter()).not.toBeInTheDocument();
  });

  test("이미지가 1개여도 닫기 버튼은 존재한다", () => {
    renderGallery(1);
    openAt("a");

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "이미지 닫기" })
    ).toBeInTheDocument();
  });
});
