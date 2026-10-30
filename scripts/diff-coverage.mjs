import { run } from "./diff-coverage-lib.mjs";

process.exitCode = run(process.argv.slice(2));
