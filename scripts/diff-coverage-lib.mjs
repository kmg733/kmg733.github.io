import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * PR 변경 라인 커버리지 검사
 *
 * `git diff <base>...HEAD` 로 추가·수정된 라인을 구하고,
 * `coverage/lcov.info` 에서 그 라인과 라인의 분기가 모두 실행됐는지 확인한다.
 * 소스가 아닌 파일(테스트·문서·설정)과 lcov 에 기록이 없는 라인(주석·타입 선언)은 검사 대상이 아니다.
 * 소스 파일인데 lcov 에 없거나, 커버리지 제외 주석을 추가했으면 미달로 본다.
 */

const LCOV_PATH = "coverage/lcov.info";
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
// jest.config.ts collectCoverageFrom 과 같은 범위
const SOURCE_FILE = /^(src|scripts)\/.+\.[cm]?[jt]sx?$/;
const NOT_SOURCE_FILE = /(^|\/)__tests__\/|\.(test|spec)\.[cm]?[jt]sx?$|\.d\.ts$/;
const IGNORE_COMMENT = /\b(c8|v8|istanbul)\s+ignore\b/;

/** `+++ ` 헤더의 경로: 공백이 있으면 끝에 탭이, 특수문자가 있으면 따옴표가 붙는다 */
function headerPath(raw) {
  const target = raw.replace(/\t$/, "");
  return target.startsWith('"') ? JSON.parse(target) : target;
}

/** unified diff → 파일(저장소 상대 경로)별 추가·수정 라인 번호 → 내용 */
export function parseDiff(diffText) {
  const changed = new Map();
  let lines = null;
  let inHeader = false;
  let next = 0;

  for (const row of diffText.split("\n")) {
    if (row.startsWith("diff --git ")) {
      inHeader = true;
      continue;
    }
    // 본문의 "+++" 는 내용이 "++" 로 시작하는 추가 라인이므로 헤더 구간에서만 경로로 읽는다
    if (inHeader && row.startsWith("+++ ")) {
      const target = headerPath(row.slice(4));
      lines = target === "/dev/null" ? null : new Map();
      if (lines) changed.set(target.replace(/^b\//, ""), lines);
      continue;
    }
    const hunk = HUNK_HEADER.exec(row);
    if (hunk) {
      inHeader = false;
      next = Number(hunk[1]);
      continue;
    }
    if (!lines || inHeader) continue;
    if (row.startsWith("+")) {
      lines.set(next++, row.slice(1));
    } else if (row.startsWith(" ")) {
      next++;
    }
  }
  return changed;
}

/** lcov → 파일(rootDir 상대 경로)별 라인 실행 횟수, 라인별 분기 { total, taken } */
export function parseLcov(lcovText, rootDir) {
  const coverage = new Map();
  let current = null;

  for (const row of lcovText.split("\n")) {
    if (row.startsWith("SF:")) {
      const file = path.relative(rootDir, path.resolve(rootDir, row.slice(3)));
      current = { lines: new Map(), branches: new Map() };
      coverage.set(file, current);
    } else if (!current) {
      continue;
    } else if (row.startsWith("DA:")) {
      const [line, hits] = row.slice(3).split(",");
      current.lines.set(Number(line), Number(hits));
    } else if (row.startsWith("BRDA:")) {
      const [line, , , taken] = row.slice(5).split(",");
      const branch = current.branches.get(Number(line)) ?? { total: 0, taken: 0 };
      branch.total++;
      if (taken !== "-" && Number(taken) > 0) branch.taken++;
      current.branches.set(Number(line), branch);
    }
  }
  return coverage;
}

function isSourceFile(file) {
  return SOURCE_FILE.test(file) && !NOT_SOURCE_FILE.test(file);
}

/** 변경 라인 중 실행되지 않은 라인, 일부 분기만 실행된 라인, 커버리지 제외 주석을 찾는다 */
export function findUncovered(changed, coverage) {
  const result = { uncovered: [], checkedLines: 0, checkedBranches: 0 };

  for (const [file, lines] of changed) {
    if (lines.size === 0 || !isSourceFile(file)) continue;
    const fileCoverage = coverage.get(file);
    if (fileCoverage) {
      checkFile(file, lines, fileCoverage, result);
    } else {
      result.uncovered.push({ file, kind: "unmeasured" });
    }
  }
  return result;
}

function checkFile(file, lines, fileCoverage, result) {
  for (const [line, text] of lines) {
    if (IGNORE_COMMENT.test(text)) {
      result.uncovered.push({ file, line, kind: "ignore" });
      continue;
    }
    const hits = fileCoverage.lines.get(line);
    if (hits === undefined) continue;
    result.checkedLines++;
    const branch = fileCoverage.branches.get(line);
    if (branch) result.checkedBranches += branch.total;

    if (hits === 0) {
      result.uncovered.push({ file, line, kind: "line" });
    } else if (branch && branch.taken < branch.total) {
      result.uncovered.push({ file, line, kind: "branch", taken: branch.taken, total: branch.total });
    }
  }
}

function describeUncovered({ file, line, kind, taken, total }) {
  switch (kind) {
    case "line":
      return `  ${file}:${line} (라인 미실행)`;
    case "branch":
      return `  ${file}:${line} (분기 ${taken}/${total})`;
    case "ignore":
      return `  ${file}:${line} (커버리지 제외 주석 사용 금지)`;
    default:
      return `  ${file} (커버리지 측정 대상 아님: jest.config.ts collectCoverageFrom 확인)`;
  }
}

export function formatReport({ uncovered, checkedLines, checkedBranches }) {
  const summary = `실행 가능한 변경 라인 ${checkedLines}개, 분기 ${checkedBranches}개`;
  if (uncovered.length === 0) {
    return `변경 라인 커버리지 100%: ${summary}`;
  }
  const rows = uncovered.map(describeUncovered);
  return [
    `변경 라인 커버리지 미달: ${uncovered.length}곳이 테스트로 실행되지 않았다 (${summary})`,
    ...rows,
  ].join("\n");
}

export const defaultDeps = {
  cwd: process.cwd(),
  git: (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }),
  readFile: (file) => fs.readFileSync(file, "utf8"),
  log: (msg) => console.log(msg),
  error: (msg) => console.error(msg),
};

/** 종료 코드: 0 통과, 1 미달, 2 실행 오류 (기준 ref 없음, lcov 없음, git diff 실패) */
export function run(argv, deps = defaultDeps) {
  const [baseRef] = argv;
  if (!baseRef) {
    deps.error("사용법: node scripts/diff-coverage.mjs <기준 ref> (예: origin/develop)");
    return 2;
  }

  let lcovText;
  try {
    lcovText = deps.readFile(path.join(deps.cwd, LCOV_PATH));
  } catch (e) {
    deps.error(`${LCOV_PATH} 를 읽지 못했다. jest --coverage 를 먼저 실행한다: ${e.message}`);
    return 2;
  }

  let diffText;
  try {
    diffText = deps.git([
      "-c",
      "core.quotePath=false",
      "diff",
      "--no-color",
      "--no-ext-diff",
      "-U0",
      `${baseRef}...HEAD`,
    ]);
  } catch (e) {
    deps.error(`${baseRef} 와 비교한 변경 라인을 구하지 못했다: ${e.message}`);
    return 2;
  }
  const result = findUncovered(parseDiff(diffText), parseLcov(lcovText, deps.cwd));
  const report = formatReport(result);

  if (result.uncovered.length > 0) {
    deps.error(report);
    return 1;
  }
  deps.log(report);
  return 0;
}
