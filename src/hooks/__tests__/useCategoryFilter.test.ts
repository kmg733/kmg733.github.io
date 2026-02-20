import { renderHook, act } from "@testing-library/react";
import { useCategoryFilter } from "../useCategoryFilter";
import type { PostMeta } from "@/types";

// Next.js useSearchParams/useRouter mock
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/blog",
}));

const createPost = (overrides: Partial<PostMeta> = {}): PostMeta => ({
  slug: "test-post",
  title: "Test Post",
  date: "2026-01-01",
  description: "Test description",
  category: "개발",
  tags: [],
  readingTime: "5 min",
  ...overrides,
});

const samplePosts: PostMeta[] = [
  createPost({ slug: "p1", category: "개발", subcategory: "JavaScript" }),
  createPost({ slug: "p2", category: "개발", subcategory: "Next.js" }),
  createPost({ slug: "p3", category: "주식", subcategory: "분석" }),
  createPost({ slug: "p4", category: "개발" }),
];

describe("useCategoryFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset search params (새 객체로 교체)
    mockSearchParams = new URLSearchParams();
  });

  it("초기 상태에서 카테고리 선택 없이 전체 포스트를 반환한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("카테고리 트리를 올바르게 생성한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.categoryTree).toHaveLength(2);
    const dev = result.current.categoryTree.find((c) => c.name === "개발");
    expect(dev?.count).toBe(3);
    expect(dev?.subcategories).toHaveLength(2);
  });

  it("카테고리 선택 시 해당 카테고리 포스트만 필터링한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectCategory("개발");
    });

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.filteredPosts).toHaveLength(3);
  });

  it("카테고리 선택 시 URL을 업데이트한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectCategory("개발");
    });

    expect(mockPush).toHaveBeenCalledWith("/blog?category=%EA%B0%9C%EB%B0%9C", {
      scroll: false,
    });
  });

  it("서브카테고리 선택 시 해당 포스트만 필터링한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectSubcategory("개발", "JavaScript");
    });

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBe("JavaScript");
    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].slug).toBe("p1");
  });

  it("같은 카테고리 재클릭 시 선택을 해제한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectCategory("개발");
    });
    act(() => {
      result.current.selectCategory("개발");
    });

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("같은 서브카테고리 재클릭 시 서브카테고리만 해제한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectSubcategory("개발", "JavaScript");
    });
    act(() => {
      result.current.selectSubcategory("개발", "JavaScript");
    });

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(3);
  });

  it("clearFilter가 모든 필터를 해제한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    act(() => {
      result.current.selectSubcategory("개발", "JavaScript");
    });
    act(() => {
      result.current.clearFilter();
    });

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("전체 상태에서 서브카테고리 직접 선택 시 부모 카테고리도 함께 설정한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    // 초기 상태: 전체 (카테고리 미선택)
    expect(result.current.selectedCategory).toBeNull();

    // 서브카테고리 직접 선택
    act(() => {
      result.current.selectSubcategory("개발", "JavaScript");
    });

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBe("JavaScript");
    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].slug).toBe("p1");
  });

  it("트리 노드 접기/펼치기를 토글한다", () => {
    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    // 기본: 모두 펼쳐진 상태
    expect(result.current.isExpanded("개발")).toBe(true);

    // 접기
    act(() => {
      result.current.toggleExpanded("개발");
    });
    expect(result.current.isExpanded("개발")).toBe(false);

    // 다시 펼치기
    act(() => {
      result.current.toggleExpanded("개발");
    });
    expect(result.current.isExpanded("개발")).toBe(true);
  });

  it("URL 파라미터에서 초기 카테고리를 읽는다", () => {
    mockSearchParams.set("category", "개발");

    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.filteredPosts).toHaveLength(3);
  });

  it("URL 파라미터에서 초기 서브카테고리를 읽는다", () => {
    mockSearchParams.set("category", "개발");
    mockSearchParams.set("subcategory", "JavaScript");

    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBe("JavaScript");
    expect(result.current.filteredPosts).toHaveLength(1);
  });

  // M-2: URL 유효성 검증
  it("존재하지 않는 카테고리가 URL에 있으면 무시한다", () => {
    mockSearchParams.set("category", "존재하지않는카테고리");

    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("카테고리 없이 서브카테고리만 URL에 있으면 무시한다", () => {
    mockSearchParams.set("subcategory", "JavaScript");

    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("카테고리에 속하지 않는 서브카테고리가 URL에 있으면 서브카테고리만 무시한다", () => {
    mockSearchParams.set("category", "개발");
    mockSearchParams.set("subcategory", "분석"); // 분석은 주식의 서브카테고리

    const { result } = renderHook(() => useCategoryFilter(samplePosts));

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(3);
  });

  // M-2: URL-State 동기화
  it("URL 파라미터 변경 시 선택 상태가 동기화된다 (브라우저 뒤로가기)", () => {
    // 초기 상태: URL 파라미터 없음
    const { result, rerender } = renderHook(() =>
      useCategoryFilter(samplePosts)
    );
    expect(result.current.selectedCategory).toBeNull();

    // 브라우저 뒤로가기 시뮬레이션: URL이 변경됨
    mockSearchParams = new URLSearchParams("category=개발");
    rerender();

    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.filteredPosts).toHaveLength(3);
  });

  it("URL에서 카테고리가 제거되면 선택이 해제된다", () => {
    // 초기 상태: 카테고리 선택됨
    mockSearchParams = new URLSearchParams("category=개발&subcategory=JavaScript");
    const { result, rerender } = renderHook(() =>
      useCategoryFilter(samplePosts)
    );
    expect(result.current.selectedCategory).toBe("개발");
    expect(result.current.selectedSubcategory).toBe("JavaScript");

    // URL에서 파라미터 제거 (브라우저 뒤로가기)
    mockSearchParams = new URLSearchParams();
    rerender();

    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.selectedSubcategory).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });
});
