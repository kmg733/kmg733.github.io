import { render, screen } from "@testing-library/react";
import PostTitleCard from "../PostTitleCard";
import {
  POST_CARD_THEMES,
  DEFAULT_POST_CARD_THEME,
} from "@/lib/post-card-theme";

const javaPost = {
  title: "JVM 메모리 구조와 가비지 컬렉션",
  category: "개발",
  subcategory: "Java",
};

function getCard(container: HTMLElement): HTMLElement {
  const card = container.querySelector<HTMLElement>(
    '[data-testid="post-title-card"]'
  );
  if (!card) throw new Error("post-title-card not found");
  return card;
}

function expectClasses(el: HTMLElement, classes: string) {
  for (const cls of classes.split(/\s+/)) {
    expect(el).toHaveClass(cls);
  }
}

describe("PostTitleCard", () => {
  describe("공통", () => {
    it.each(["default", "compact"] as const)(
      "%s: 루트는 aria-hidden 이고 이미지 없이 칸을 꽉 채운다",
      (variant) => {
        const { container } = render(
          <PostTitleCard post={javaPost} variant={variant} />
        );
        const card = getCard(container);

        expect(container.firstElementChild).toBe(card);
        expect(card).toHaveAttribute("aria-hidden", "true");
        expect(card).toHaveClass("h-full", "w-full");
        expect(container.querySelector("img")).toBeNull();
      }
    );

    it("하위 카테고리 색 클래스를 적용한다", () => {
      const { container } = render(<PostTitleCard post={javaPost} />);
      expectClasses(getCard(container), POST_CARD_THEMES.Java);
    });

    it("매핑에 없는 하위 카테고리는 zinc 기본색을 쓴다", () => {
      const { container } = render(
        <PostTitleCard post={{ ...javaPost, subcategory: "Rust" }} />
      );
      const card = getCard(container);
      expectClasses(card, DEFAULT_POST_CARD_THEME);
      expect(card).not.toHaveClass("bg-rose-100");
    });

    it("className 을 루트에 덧붙인다", () => {
      const { container } = render(
        <PostTitleCard post={javaPost} className="group-hover:scale-105" />
      );
      expect(getCard(container)).toHaveClass("group-hover:scale-105", "h-full");
    });

    it("className 이 없으면 'undefined' 클래스를 남기지 않는다", () => {
      const { container } = render(<PostTitleCard post={javaPost} />);
      expect(getCard(container).className).not.toMatch(/undefined/);
    });
  });

  describe("default", () => {
    it("variant 를 생략하면 제목과 라벨을 그린다", () => {
      render(<PostTitleCard post={javaPost} />);

      const title = screen.getByText(javaPost.title);
      expect(title).toHaveClass("line-clamp-3");
      expect(screen.getByText("Java")).toBeInTheDocument();
    });

    it("라벨이 제목보다 앞(위)에 온다", () => {
      render(<PostTitleCard post={javaPost} variant="default" />);

      const label = screen.getByText("Java");
      const title = screen.getByText(javaPost.title);
      expect(
        label.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("시리즈 글은 '하위카테고리 · 시리즈 N편' 라벨을 쓴다", () => {
      render(
        <PostTitleCard
          post={{ ...javaPost, series: "java-memory", seriesOrder: 2 }}
        />
      );
      expect(screen.getByText("Java · 시리즈 2편")).toBeInTheDocument();
    });

    it("하위 카테고리가 없으면 카테고리를 라벨로 쓴다", () => {
      render(
        <PostTitleCard post={{ title: "회고", category: "일상" }} />
      );
      expect(screen.getByText("일상")).toBeInTheDocument();
    });
  });

  describe("compact", () => {
    it("제목 없이 짧은 라벨(하위 카테고리)만 그린다", () => {
      const { container } = render(
        <PostTitleCard
          post={{ ...javaPost, series: "java-memory", seriesOrder: 2 }}
          variant="compact"
        />
      );

      expect(screen.queryByText(javaPost.title)).toBeNull();
      expect(screen.queryByText(/시리즈/)).toBeNull();
      const label = screen.getByText("Java");
      expect(label).toHaveClass("truncate");
      expect(getCard(container)).toHaveTextContent(/^Java$/);
    });

    it("하위 카테고리가 없으면 카테고리를 짧은 라벨로 쓴다", () => {
      render(
        <PostTitleCard post={{ title: "회고", category: "일상" }} variant="compact" />
      );
      expect(screen.getByText("일상")).toHaveClass("truncate");
      expect(screen.queryByText("회고")).toBeNull();
    });

    it("긴 하위 카테고리는 줄임말 라벨을 쓴다 (JavaScript → JS)", () => {
      const { container } = render(
        <PostTitleCard
          post={{ ...javaPost, subcategory: "JavaScript" }}
          variant="compact"
        />
      );

      expect(screen.getByText("JS")).toHaveClass("truncate");
      expect(screen.queryByText("JavaScript")).toBeNull();
      expect(getCard(container)).toHaveTextContent(/^JS$/);
    });

    it("compact 도 하위 카테고리 색을 쓴다", () => {
      const { container } = render(
        <PostTitleCard post={javaPost} variant="compact" />
      );
      expectClasses(getCard(container), POST_CARD_THEMES.Java);
    });
  });
});
