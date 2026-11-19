const { spawnSync } = require('child_process');

console.log('Running unit tests with experimental coverage...');
const res = spawnSync(
  process.execPath,
  [
    '--test',
    '--experimental-test-coverage',
    'test/unit/pure-functions.test.js',
    'test/unit/correctness-bugs.test.js'
  ],
  { encoding: 'utf-8' }
);

console.log(res.stdout);
if (res.stderr) console.error(res.stderr);

if (res.status !== 0) {
  console.error('❌ Unit tests failed!');
  process.exit(res.status || 1);
}

// Parse coverage report from stdout
const lines = res.stdout.split('\n');
let analyticsLineCoverage = null;

for (const line of lines) {
  if (line.includes('analytics.js')) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 2) {
      analyticsLineCoverage = parseFloat(parts[1]);
    }
  }
}

const THRESHOLD = 80.0;
if (analyticsLineCoverage === null || isNaN(analyticsLineCoverage)) {
  console.error('❌ Failed to parse coverage for analytics.js');
  process.exit(1);
}

console.log(
  `\n📊 Coverage check for shared/analytics.js: ${analyticsLineCoverage}% (Required: >= ${THRESHOLD}%)`
);

if (analyticsLineCoverage < THRESHOLD) {
  console.error(`❌ Coverage threshold violation: ${analyticsLineCoverage}% < ${THRESHOLD}%`);
  process.exit(1);
}

console.log('✅ Unit test coverage threshold passed!\n');
