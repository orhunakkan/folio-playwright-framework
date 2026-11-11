// Fails if any secret value is in the given files or folders: `node scripts/scan-secrets.ts playwright-report`.
// CI runs it on every report before uploading or publishing it. It prints where a secret is, never its value.
import { SECRETS } from '../src/support/redact.ts';
import { filesUnder, findSecrets } from '../src/support/secret-scan.ts';

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('Usage: node scripts/scan-secrets.ts <file or folder>...');
  process.exit(2);
}

const files = paths.flatMap(filesUnder);
if (files.length === 0) {
  console.error(`Nothing to scan in ${paths.join(', ')}.`);
  process.exit(2);
}

const found = findSecrets(files, SECRETS);
for (const { name, file } of found) console.error(`Secret found: ${name} in ${file}`);
if (found.length > 0) {
  console.error('Do not upload or publish these files. Find what wrote the secret, and redact it there.');
  process.exit(1);
}
console.log(`No secret values in ${String(files.length)} files (${paths.join(', ')}).`);
