import { toggleSetItem } from "../set";

describe("toggleSetItem", () => {
  it("항목이 없으면 추가한다", () => {
    const set = new Set<string>();
    const result = toggleSetItem(set, "a");

    expect(result.has("a")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("항목이 있으면 제거한다", () => {
    const set = new Set<string>(["a", "b"]);
    const result = toggleSetItem(set, "a");

    expect(result.has("a")).toBe(false);
    expect(result.has("b")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("원본 Set을 변경하지 않는다 (불변성)", () => {
    const original = new Set<string>(["a"]);
    const result = toggleSetItem(original, "a");

    expect(original.has("a")).toBe(true);
    expect(result.has("a")).toBe(false);
  });

  it("숫자 타입에서도 동작한다", () => {
    const set = new Set<number>([1, 2, 3]);
    const result = toggleSetItem(set, 2);

    expect(result.has(2)).toBe(false);
    expect(result.size).toBe(2);
  });
});
