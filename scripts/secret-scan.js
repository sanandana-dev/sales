const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Starting Security & Secret Scanning Audit...');

const secretPatterns = [
  { name: 'Private Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: 'AWS Access Key',
    regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/
  },
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/ },
  {
    name: 'Generic Secret Assignment',
    regex: /(api_key|apikey|secret|password|passwd|auth_token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/i
  }
];

// Check .gitignore covers .env
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.error('❌ .gitignore file not found!');
  process.exit(1);
}

const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
if (!gitignoreContent.includes('.env')) {
  console.error('❌ .gitignore does not cover .env files!');
  process.exit(1);
}
console.log('✅ .gitignore verified: covers .env and local secret files.');

// Scan committed files via git ls-files
const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean);

let findings = 0;

for (const file of trackedFiles) {
  // Skip binary files and this script
  if (
    file.endsWith('.sqlite') ||
    file.endsWith('.jpg') ||
    file.endsWith('.png') ||
    file === 'scripts/secret-scan.js'
  ) {
    continue;
  }

  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  for (const { name, regex } of secretPatterns) {
    if (regex.test(content)) {
      console.error(`❌ Potential secret detected in ${file}: pattern "${name}"`);
      findings++;
    }
  }
}

if (findings > 0) {
  console.error(`\n❌ Secret scan failed with ${findings} potential secret(s) found!`);
  process.exit(1);
}

console.log(
  `✅ Scanned ${trackedFiles.length} tracked files. Zero secrets or credentials detected!\n`
);
