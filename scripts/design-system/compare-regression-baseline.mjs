import fs from "node:fs";

function readText(file) {
  const buffer = fs.readFileSync(file);
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let nulCount = 0;
  for (const byte of sample) if (byte === 0) nulCount += 1;
  const encoding = nulCount > sample.length * 0.1 ? "utf16le" : "utf8";
  return buffer.toString(encoding);
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

function failedFiles(file) {
  const text = stripAnsi(readText(file));
  const out = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("FAIL")) continue;
    const match = line.match(/(server\/[A-Za-z0-9._/-]+\.test\.(?:ts|tsx))/);
    if (match) out.add(match[1]);
  }
  return [...out].sort();
}

function summary(file) {
  const text = stripAnsi(readText(file));
  const fileMatches = [...text.matchAll(/Test Files\s+(\d+) failed\s*\|\s*(\d+) passed/g)];
  const testMatches = [...text.matchAll(/Tests\s+(\d+) failed\s*\|\s*(\d+) passed\s*\|\s*(\d+) skipped/g)];
  const files = fileMatches.at(-1);
  const tests = testMatches.at(-1);
  return {
    failedFiles: files ? Number(files[1]) : null,
    passedFiles: files ? Number(files[2]) : null,
    failedTests: tests ? Number(tests[1]) : null,
    passedTests: tests ? Number(tests[2]) : null,
    skippedTests: tests ? Number(tests[3]) : null,
  };
}

const [baselinePath, candidatePath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) throw new Error("baseline and candidate paths required");

const baseline = failedFiles(baselinePath);
const candidate = failedFiles(candidatePath);
const newFailures = candidate.filter((file) => !baseline.includes(file));
const resolvedHistorical = baseline.filter((file) => !candidate.includes(file));
const baselineSummary = summary(baselinePath);
const candidateSummary = summary(candidatePath);

const result = {
  baseline: baselineSummary,
  candidate: candidateSummary,
  baselineFailedFileSetCount: baseline.length,
  candidateFailedFileSetCount: candidate.length,
  newFailureFiles: newFailures,
  resolvedHistoricalFailureFiles: resolvedHistorical,
  sameHistoricalFailureSet:
    newFailures.length === 0 &&
    resolvedHistorical.length === 0 &&
    baseline.length === candidate.length,
  noNewFailureCount:
    candidateSummary.failedTests !== null &&
    baselineSummary.failedTests !== null &&
    candidateSummary.failedTests <= baselineSummary.failedTests,
};

result.pass = result.sameHistoricalFailureSet && result.noNewFailureCount;
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
