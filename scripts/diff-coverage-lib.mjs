import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * PR 변경 라인 커버리지 검사
 *
 * `git diff <base>...HEAD` 로 추가·수정된 라인을 구하고,
 * `coverage/lcov.info` 에서 그 라인과 라인의 분기가 모두 실행됐는지 확인한다.
 * lcov 에 기록이 없는 라인(주석·타입 선언)과 파일(테스트·문서)은 검사 대상이 아니다.
 */

const LCOV_PATH = "coverage/lcov.info";
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/** unified diff → 파일(저장소 상대 경로)별 추가·수정 라인 번호 */
export function parseDiff(diffText) {
  const changed = new Map();
  let lines = null;
  let next = 0;

  for (const row of diffText.split("\n")) {
    if (row.startsWith("+++ ")) {
      const target = row.slice(4);
      lines = target === "/dev/null" ? null : new Set();
      if (lines) changed.set(target.replace(/^b\//, ""), lines);
      continue;
    }
    const hunk = HUNK_HEADER.exec(row);
    if (hunk) {
      next = Number(hunk[1]);
      continue;
    }
    if (!lines) continue;
    if (row.startsWith("+")) {
      lines.add(next++);
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

/** 변경 라인 중 실행되지 않은 라인과 일부 분기만 실행된 라인을 찾는다 */
export function findUncovered(changed, coverage) {
  const uncovered = [];
  let checkedLines = 0;
  let checkedBranches = 0;

  for (const [file, lines] of changed) {
    const fileCoverage = coverage.get(file);
    if (!fileCoverage) continue;

    for (const line of lines) {
      const hits = fileCoverage.lines.get(line);
      if (hits === undefined) continue;
      checkedLines++;
      const branch = fileCoverage.branches.get(line);
      if (branch) checkedBranches += branch.total;

      if (hits === 0) {
        uncovered.push({ file, line, kind: "line" });
      } else if (branch && branch.taken < branch.total) {
        uncovered.push({ file, line, kind: "branch", taken: branch.taken, total: branch.total });
      }
    }
  }
  return { uncovered, checkedLines, checkedBranches };
}

export function formatReport({ uncovered, checkedLines, checkedBranches }) {
  const summary = `실행 가능한 변경 라인 ${checkedLines}개, 분기 ${checkedBranches}개`;
  if (uncovered.length === 0) {
    return `변경 라인 커버리지 100%: ${summary}`;
  }
  const rows = uncovered.map(({ file, line, kind, taken, total }) =>
    kind === "line" ? `  ${file}:${line} (라인 미실행)` : `  ${file}:${line} (분기 ${taken}/${total})`
  );
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

/** 종료 코드: 0 통과, 1 미달, 2 실행 오류 (기준 ref 없음, lcov 없음) */
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

  const diffText = deps.git([
    "-c",
    "core.quotePath=false",
    "diff",
    "--no-color",
    "--no-ext-diff",
    "-U0",
    `${baseRef}...HEAD`,
  ]);
  const result = findUncovered(parseDiff(diffText), parseLcov(lcovText, deps.cwd));
  const report = formatReport(result);

  if (result.uncovered.length > 0) {
    deps.error(report);
    return 1;
  }
  deps.log(report);
  return 0;
}
