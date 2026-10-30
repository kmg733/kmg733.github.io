import path from "path";
import {
  parseDiff,
  parseLcov,
  findUncovered,
  formatReport,
  run,
  defaultDeps,
} from "../../scripts/diff-coverage-lib.mjs";

/**
 * PR 변경 라인 커버리지 검사 테스트
 *
 * TDD: RED → GREEN → REFACTOR
 */

const ROOT = "/repo";

describe("parseDiff", () => {
  it("추가·수정된 라인 번호를 새 파일 기준으로 모은다", () => {
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -3,0 +4,2 @@ function a() {",
      "+  const x = 1;",
      "+  return x;",
      "@@ -10 +12 @@",
      "-old",
      "+new",
    ].join("\n");

    const changed = parseDiff(diff);

    expect([...changed.get("src/a.ts")!]).toEqual([4, 5, 12]);
  });

  it("삭제만 있는 hunk 와 삭제된 파일은 라인을 남기지 않는다", () => {
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -5,2 +4,0 @@",
      "-gone1",
      "-gone2",
      "diff --git a/src/b.ts b/src/b.ts",
      "--- a/src/b.ts",
      "+++ /dev/null",
      "@@ -1 +0,0 @@",
      "-gone",
    ].join("\n");

    const changed = parseDiff(diff);

    expect(changed.get("src/a.ts")?.size ?? 0).toBe(0);
    expect(changed.has("src/b.ts")).toBe(false);
    expect(changed.has("/dev/null")).toBe(false);
  });

  it("문맥 라인과 '\\ No newline' 표시는 번호만 넘기거나 무시한다", () => {
    const diff = [
      "+++ b/src/c.ts",
      "@@ -1,2 +1,3 @@",
      " keep",
      "+added",
      " keep",
      "\\ No newline at end of file",
    ].join("\n");

    expect([...parseDiff(diff).get("src/c.ts")!]).toEqual([2]);
  });

  it("빈 diff 는 빈 결과를 돌려준다", () => {
    expect(parseDiff("").size).toBe(0);
  });
});

describe("parseLcov", () => {
  it("파일별 라인 실행 횟수와 라인별 분기 실행 여부를 모은다", () => {
    const lcov = [
      "TN:",
      `SF:${path.join(ROOT, "src/a.ts")}`,
      "DA:1,1",
      "DA:2,0",
      "BRDA:3,0,0,2",
      "BRDA:3,0,1,0",
      "BRDA:4,1,0,-",
      "end_of_record",
      "SF:src/b.ts",
      "DA:1,5",
      "end_of_record",
    ].join("\n");

    const coverage = parseLcov(lcov, ROOT);
    const a = coverage.get("src/a.ts")!;

    expect(a.lines.get(1)).toBe(1);
    expect(a.lines.get(2)).toBe(0);
    expect(a.branches.get(3)).toEqual({ total: 2, taken: 1 });
    expect(a.branches.get(4)).toEqual({ total: 1, taken: 0 });
    expect(coverage.get("src/b.ts")!.lines.get(1)).toBe(5);
    expect(coverage.has(path.join(ROOT, "src/a.ts"))).toBe(false);
  });

  it("SF 앞에 나온 기록은 버린다", () => {
    expect(parseLcov("DA:1,1\nBRDA:1,0,0,1\n", ROOT).size).toBe(0);
  });
});

describe("findUncovered", () => {
  const coverage = parseLcov(
    [
      "SF:src/a.ts",
      "DA:1,1",
      "DA:2,0",
      "DA:3,4",
      "BRDA:3,0,0,4",
      "BRDA:3,0,1,0",
      "DA:4,1",
      "BRDA:4,0,0,1",
      "BRDA:4,0,1,1",
      "end_of_record",
    ].join("\n"),
    ROOT
  );

  it("실행되지 않은 변경 라인과 일부만 실행된 분기를 찾는다", () => {
    const changed = new Map([["src/a.ts", new Set([1, 2, 3, 4])]]);

    const result = findUncovered(changed, coverage);

    expect(result.uncovered).toEqual([
      { file: "src/a.ts", line: 2, kind: "line" },
      { file: "src/a.ts", line: 3, kind: "branch", taken: 1, total: 2 },
    ]);
    expect(result.checkedLines).toBe(4);
    expect(result.checkedBranches).toBe(4);
  });

  it("lcov 기록이 없는 라인(주석·타입)과 lcov 에 없는 파일(테스트·문서)은 건너뛴다", () => {
    const changed = new Map([
      ["src/a.ts", new Set([1, 99])],
      ["content/posts/x.md", new Set([1, 2])],
    ]);

    const result = findUncovered(changed, coverage);

    expect(result.uncovered).toEqual([]);
    expect(result.checkedLines).toBe(1);
    expect(result.checkedBranches).toBe(0);
  });

  it("실행되지 않은 라인의 분기는 라인 미실행 하나로만 보고한다", () => {
    const cov = parseLcov(
      "SF:src/z.ts\nDA:7,0\nBRDA:7,0,0,-\nBRDA:7,0,1,-\nend_of_record",
      ROOT
    );

    const result = findUncovered(new Map([["src/z.ts", new Set([7])]]), cov);

    expect(result.uncovered).toEqual([{ file: "src/z.ts", line: 7, kind: "line" }]);
  });
});

describe("formatReport", () => {
  it("통과하면 검사한 라인·분기 수를 알려준다", () => {
    const text = formatReport({ uncovered: [], checkedLines: 3, checkedBranches: 2 });

    expect(text).toContain("100%");
    expect(text).toContain("라인 3개");
    expect(text).toContain("분기 2개");
  });

  it("실패하면 미실행 위치를 파일:라인 으로 나열한다", () => {
    const text = formatReport({
      uncovered: [
        { file: "src/a.ts", line: 2, kind: "line" },
        { file: "src/a.ts", line: 3, kind: "branch", taken: 1, total: 2 },
      ],
      checkedLines: 4,
      checkedBranches: 2,
    });

    expect(text).toContain("src/a.ts:2 (라인 미실행)");
    expect(text).toContain("src/a.ts:3 (분기 1/2)");
    expect(text).not.toContain("100%");
  });
});

describe("run", () => {
  const LCOV = "SF:src/a.ts\nDA:1,1\nDA:2,0\nend_of_record";

  function deps(diff: string, lcov: string | Error = LCOV) {
    const out: string[] = [];
    const err: string[] = [];
    const gitArgs: string[][] = [];
    return {
      out,
      err,
      gitArgs,
      deps: {
        cwd: ROOT,
        git: (args: string[]) => {
          gitArgs.push(args);
          return diff;
        },
        readFile: (file: string) => {
          if (lcov instanceof Error) throw lcov;
          expect(file).toBe(path.join(ROOT, "coverage/lcov.info"));
          return lcov;
        },
        log: (msg: string) => out.push(msg),
        error: (msg: string) => err.push(msg),
      },
    };
  }

  it("변경 라인이 모두 실행됐으면 0 을 돌려준다", () => {
    const d = deps("+++ b/src/a.ts\n@@ -0,0 +1 @@\n+ok");

    expect(run(["origin/develop"], d.deps)).toBe(0);
    expect(d.gitArgs[0]).toEqual([
      "-c",
      "core.quotePath=false",
      "diff",
      "--no-color",
      "--no-ext-diff",
      "-U0",
      "origin/develop...HEAD",
    ]);
    expect(d.out.join("\n")).toContain("100%");
    expect(d.err).toEqual([]);
  });

  it("미실행 변경 라인이 있으면 1 을 돌려주고 위치를 출력한다", () => {
    const d = deps("+++ b/src/a.ts\n@@ -0,0 +1,2 @@\n+ok\n+miss");

    expect(run(["origin/develop"], d.deps)).toBe(1);
    expect(d.err.join("\n")).toContain("src/a.ts:2 (라인 미실행)");
  });

  it("기준 ref 가 없으면 2 를 돌려준다", () => {
    const d = deps("");

    expect(run([], d.deps)).toBe(2);
    expect(d.err.join("\n")).toContain("사용법");
    expect(d.gitArgs).toEqual([]);
  });

  it("lcov 파일을 못 읽으면 통과시키지 않고 2 를 돌려준다", () => {
    const d = deps("", new Error("ENOENT"));

    expect(run(["origin/develop"], d.deps)).toBe(2);
    expect(d.err.join("\n")).toContain("ENOENT");
  });
});

describe("defaultDeps", () => {
  it("git 은 git 명령 출력을 문자열로 돌려준다", () => {
    expect(defaultDeps.git(["--version"])).toMatch(/^git version/);
  });

  it("readFile 은 파일 내용을 utf8 문자열로 읽는다", () => {
    expect(defaultDeps.readFile(path.join(process.cwd(), "package.json"))).toContain(
      '"name": "kmg733.github.io"'
    );
  });

  it("log·error 는 각각 console.log·console.error 로 출력한다", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    defaultDeps.log("ok");
    defaultDeps.error("fail");

    expect(log).toHaveBeenCalledWith("ok");
    expect(error).toHaveBeenCalledWith("fail");
    log.mockRestore();
    error.mockRestore();
  });

  it("run 의 기본 의존성으로 쓰인다", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(run([])).toBe(2);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("사용법"));
    error.mockRestore();
  });
});
