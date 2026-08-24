import fs from 'node:fs';

const matrixFile = new URL('../docs/action-contract-matrix.md', import.meta.url);
const difficultMatrixFile = new URL('../docs/e2e/difficult-case-matrix.md', import.meta.url);
const reportFile = new URL('../test-results/e2e.json', import.meta.url);
const matrix = fs.readFileSync(matrixFile, 'utf8');
const difficultMatrix = fs.readFileSync(difficultMatrixFile, 'utf8');
const expected = [...matrix.matchAll(/^\| ((?:AUTH|CUSTOMER|OWNER|ADMIN)-\d+) \|/gm)].map((match) => match[1]);
const difficultRows = [...difficultMatrix.matchAll(/^\| (CASE-[A-Z0-9-]+) \| (P[0-2]) \| (mock|live) \|/gm)]
  .map((match) => ({ id: match[1], tier: match[2], runner: match[3] }));
const expectedDifficult = difficultRows.map((row) => row.id);
const criticalDifficult = difficultRows
  .filter((row) => row.runner === 'mock' && row.tier !== 'P2')
  .map((row) => row.id);
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const titles = [];
const walk = (suite) => {
  for (const spec of suite.specs ?? []) titles.push(spec.title);
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of report.suites ?? []) walk(suite);
const covered = new Set(titles.flatMap((title) => [...title.matchAll(/\b(?:AUTH|CUSTOMER|OWNER|ADMIN)-\d+\b/g)].map((match) => match[0])));
const coveredDifficult = new Set(titles.flatMap((title) => [...title.matchAll(/\bCASE-[A-Z0-9-]+\b/g)].map((match) => match[0])));
const missing = expected.filter((id) => !covered.has(id));
const missingDifficult = expectedDifficult.filter((id) => !coveredDifficult.has(id));
const missingCritical = criticalDifficult.filter((id) => !coveredDifficult.has(id));
const ratio = expected.length === 0 ? 1 : (expected.length - missing.length) / expected.length;
const difficultRatio = expectedDifficult.length === 0
  ? 1
  : (expectedDifficult.length - missingDifficult.length) / expectedDifficult.length;
console.log(`E2E use-case coverage: ${expected.length - missing.length}/${expected.length} (${(ratio * 100).toFixed(1)}%)`);
console.log(`E2E difficult-case coverage: ${expectedDifficult.length - missingDifficult.length}/${expectedDifficult.length} (${(difficultRatio * 100).toFixed(1)}%)`);
if (missing.length) console.log(`Missing action IDs: ${missing.join(', ')}`);
if (missingDifficult.length) console.log(`Missing difficult case IDs: ${missingDifficult.join(', ')}`);
if (missingCritical.length) console.log(`Missing critical mock cases: ${missingCritical.join(', ')}`);
if (missingCritical.length || ratio < 0.9 || difficultRatio < 0.9) process.exit(1);
