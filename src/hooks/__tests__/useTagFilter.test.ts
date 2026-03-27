import { renderHook, act } from "@testing-library/react";
import { useTagFilter } from "../useTagFilter";
import type { PostMeta } from "@/types";

// Next.js router mock
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
  createPost({ slug: "p1", tags: ["guide", "beginner"] }),
  createPost({ slug: "p2", tags: ["guide", "tutorial"] }),
  createPost({ slug: "p3", tags: ["beginner"] }),
  createPost({ slug: "p4", tags: [] }),
];

describe("useTagFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("초기 상태: 선택된 태그 없음, 전체 포스트 반환", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("사용 가능한 태그 목록을 개수와 함께 반환한다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    expect(result.current.availableTags).toEqual([
      { name: "beginner", count: 2 },
      { name: "guide", count: 2 },
      { name: "tutorial", count: 1 },
    ]);
  });

  it("태그 선택 시 해당 태그 포스트만 필터링한다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });

    expect(result.current.selectedTag).toBe("guide");
    expect(result.current.filteredPosts).toHaveLength(2);
    expect(result.current.filteredPosts.map((p) => p.slug)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("이미 선택된 태그를 다시 클릭하면 선택 해제한다 (토글)", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });
    act(() => {
      result.current.selectTag("guide");
    });

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("다른 태그를 클릭하면 선택이 전환된다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });
    act(() => {
      result.current.selectTag("tutorial");
    });

    expect(result.current.selectedTag).toBe("tutorial");
    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].slug).toBe("p2");
  });

  it("clearTag로 선택을 해제한다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });
    act(() => {
      result.current.clearTag();
    });

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("태그 선택 시 URL에 tag 파라미터를 추가한다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });

    expect(mockPush).toHaveBeenCalledWith("/blog?tag=guide", {
      scroll: false,
    });
  });

  it("태그 해제 시 URL에서 tag 파라미터를 제거한다", () => {
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });
    act(() => {
      result.current.selectTag("guide");
    });

    expect(mockPush).toHaveBeenLastCalledWith("/blog", { scroll: false });
  });

  it("기존 URL 파라미터(category 등)를 보존한다", () => {
    mockSearchParams = new URLSearchParams("category=개발");
    const { result } = renderHook(() => useTagFilter(samplePosts));

    act(() => {
      result.current.selectTag("guide");
    });

    const pushCall = mockPush.mock.calls[0][0] as string;
    expect(pushCall).toContain("category=");
    expect(pushCall).toContain("tag=guide");
  });

  it("URL에서 초기 태그 파라미터를 읽는다", () => {
    mockSearchParams = new URLSearchParams("tag=beginner");
    const { result } = renderHook(() => useTagFilter(samplePosts));

    expect(result.current.selectedTag).toBe("beginner");
    expect(result.current.filteredPosts).toHaveLength(2);
  });

  it("URL의 태그가 존재하지 않으면 무시한다", () => {
    mockSearchParams = new URLSearchParams("tag=nonexistent");
    const { result } = renderHook(() => useTagFilter(samplePosts));

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(4);
  });

  it("포스트 목록이 변경되면 태그 목록이 재계산된다", () => {
    const { result, rerender } = renderHook(
      ({ posts }) => useTagFilter(posts),
      { initialProps: { posts: samplePosts } }
    );

    expect(result.current.availableTags).toHaveLength(3);

    // 포스트를 줄임
    rerender({
      posts: [createPost({ slug: "p1", tags: ["guide"] })],
    });

    expect(result.current.availableTags).toHaveLength(1);
    expect(result.current.availableTags[0].name).toBe("guide");
  });

  it("선택된 태그가 포스트 변경으로 사라지면 자동 해제된다", () => {
    const { result, rerender } = renderHook(
      ({ posts }) => useTagFilter(posts),
      { initialProps: { posts: samplePosts } }
    );

    act(() => {
      result.current.selectTag("tutorial");
    });
    expect(result.current.selectedTag).toBe("tutorial");

    // tutorial 태그가 없는 포스트만 남김
    rerender({
      posts: [createPost({ slug: "p1", tags: ["guide"] })],
    });

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredPosts).toHaveLength(1);
  });
});
