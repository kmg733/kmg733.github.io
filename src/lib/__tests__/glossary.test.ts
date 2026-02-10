import { parseGlossary } from "../glossary";
import type { GlossaryEntry } from "@/types";

describe("parseGlossary", () => {
  const validEntry: GlossaryEntry = {
    id: "closure",
    term: "클로저(Closure)",
    brief: "함수가 선언된 렉시컬 환경을 기억하는 현상",
    detail: "함수가 자신이 선언된 환경의 변수를 기억하고, 외부 함수 실행이 종료된 후에도 해당 변수에 접근할 수 있는 메커니즘이다.",
  };

  const validEntry2: GlossaryEntry = {
    id: "lexical-scope",
    term: "렉시컬 스코프(Lexical Scope)",
    brief: "함수 선언 위치에 따라 스코프가 결정되는 규칙",
    detail: "정적 스코프라고도 한다.",
  };

  it("정상 데이터를 GlossaryEntry 배열로 파싱한다", () => {
    const raw = [validEntry, validEntry2];
    const result = parseGlossary(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(validEntry);
    expect(result[1]).toEqual(validEntry2);
  });

  it("undefined 입력 시 빈 배열을 반환한다", () => {
    expect(parseGlossary(undefined)).toEqual([]);
  });

  it("null 입력 시 빈 배열을 반환한다", () => {
    expect(parseGlossary(null)).toEqual([]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(parseGlossary([])).toEqual([]);
  });

  it("배열이 아닌 입력 시 빈 배열을 반환한다", () => {
    expect(parseGlossary("not an array")).toEqual([]);
    expect(parseGlossary(42)).toEqual([]);
    expect(parseGlossary({})).toEqual([]);
  });

  it("필수 필드가 누락된 항목은 제외한다", () => {
    const raw = [
      validEntry,
      { id: "missing-term", brief: "설명", detail: "상세" }, // term 누락
      { term: "누락", brief: "설명", detail: "상세" }, // id 누락
      { id: "missing-brief", term: "테스트", detail: "상세" }, // brief 누락
      { id: "missing-detail", term: "테스트", brief: "설명" }, // detail 누락
    ];

    const result = parseGlossary(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validEntry);
  });

  it("필수 필드가 문자열이 아닌 항목은 제외한다", () => {
    const raw = [
      validEntry,
      { id: 123, term: "숫자ID", brief: "설명", detail: "상세" },
    ];

    const result = parseGlossary(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validEntry);
  });

  it("id가 HTML-safe 패턴이 아닌 항목은 제외한다", () => {
    const raw = [
      validEntry,
      { id: "has space", term: "공백", brief: "설명", detail: "상세" },
      { id: "has\"quote", term: "따옴표", brief: "설명", detail: "상세" },
      { id: "has>angle", term: "꺾쇠", brief: "설명", detail: "상세" },
      { id: "", term: "빈ID", brief: "설명", detail: "상세" },
      { id: "-leading-dash", term: "대시시작", brief: "설명", detail: "상세" },
      { id: "trailing-dash-", term: "대시끝", brief: "설명", detail: "상세" },
      { id: "UPPERCASE", term: "대문자", brief: "설명", detail: "상세" },
    ];

    const result = parseGlossary(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validEntry);
  });

  it("유효한 id 패턴은 통과한다", () => {
    const raw = [
      { id: "closure", term: "클로저", brief: "설명", detail: "상세" },
      { id: "lexical-scope", term: "스코프", brief: "설명", detail: "상세" },
      { id: "es6", term: "ES6", brief: "설명", detail: "상세" },
      { id: "web-api-v2", term: "API", brief: "설명", detail: "상세" },
    ];

    const result = parseGlossary(raw);
    expect(result).toHaveLength(4);
  });

  it("배열 내 null/undefined 항목은 제외한다", () => {
    const raw = [validEntry, null, undefined, validEntry2];

    const result = parseGlossary(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(validEntry);
    expect(result[1]).toEqual(validEntry2);
  });
});
