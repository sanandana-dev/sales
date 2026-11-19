const fs = require('fs');
const path = require('path');

const distAssetsDir = path.join(__dirname, '..', 'client', 'dist', 'assets');

if (!fs.existsSync(distAssetsDir)) {
  console.error('❌ client/dist/assets directory not found. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);

// Budgets in KB
const BUDGETS = {
  entryJsMaxKb: 100, // Initial index-*.js must be under 100 KB (was ~694 KB!)
  cssMaxKb: 60, // CSS must be under 60 KB (gzipped is ~9.1 KB)
  anyChunkMaxKb: 600 // No single chunk may exceed 600 KB
};

console.log('📊 Verifying Production Bundle Budget...');

let failed = false;
let entryJsFound = false;

for (const file of files) {
  const filePath = path.join(distAssetsDir, file);
  const sizeKb = fs.statSync(filePath).size / 1024;

  console.log(`  - ${file}: ${sizeKb.toFixed(2)} KB`);

  if (sizeKb > BUDGETS.anyChunkMaxKb) {
    console.error(
      `❌ Chunk ${file} (${sizeKb.toFixed(2)} KB) exceeds max chunk budget of ${BUDGETS.anyChunkMaxKb} KB!`
    );
    failed = true;
  }

  if (file.startsWith('index-') && file.endsWith('.js')) {
    entryJsFound = true;
    if (sizeKb > BUDGETS.entryJsMaxKb) {
      console.error(
        `❌ Entry JS ${file} (${sizeKb.toFixed(2)} KB) exceeds entry budget of ${BUDGETS.entryJsMaxKb} KB!`
      );
      failed = true;
    }
  }

  if (file.endsWith('.css') && sizeKb > BUDGETS.cssMaxKb) {
    console.error(
      `❌ CSS bundle ${file} (${sizeKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.cssMaxKb} KB!`
    );
    failed = true;
  }
}

if (!entryJsFound) {
  console.error('❌ Could not locate entry point index-*.js');
  process.exit(1);
}

if (failed) {
  console.error('\n❌ Bundle budget verification failed.');
  process.exit(1);
}

console.log('\n✅ All bundle size budgets passed successfully!\n');
