// Pinned copies of what spin-trainer-api publishes (sibling repo, ../spin-trainer-api):
//   spec    openapi.yaml          → docs/openapi.yaml (contract; ADR-0004). The first line says where it comes from.
//   ranges  reference-ranges.json → src/shared/api/mock/reference-ranges.json (reference ranges from seed V5)
//
//   node scripts/sync.mjs check <spec|ranges>   → fails if the copy differs
//   node scripts/sync.mjs sync  <spec|ranges>   → fetches the API's version
// Without the sibling repo (e.g. in the web CI without a token) the check is skipped: the tests validate the mock against the copy.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILES = {
  spec: { copy: '../docs/openapi.yaml', source: '../../spin-trainer-api/openapi.yaml', header: true, sync: 'spec:sync' },
  ranges: {
    copy: '../src/shared/api/mock/reference-ranges.json', source: '../../spin-trainer-api/reference-ranges.json',
    header: false, sync: 'ranges:sync'
  }
};

const [mode, name] = process.argv.slice(2);
const file = FILES[name];
if (!['check', 'sync'].includes(mode) || !file) {
  console.error('Usage: node scripts/sync.mjs <check|sync> <spec|ranges>');
  process.exit(2);
}
const copy = fileURLToPath(new URL(file.copy, import.meta.url));
const source = fileURLToPath(new URL(file.source, import.meta.url));
const lf = text => text.replace(/\r\n/g, '\n');
// Without the copy's header (first line), if it has one.
const body = text => (file.header ? lf(text).split('\n').slice(1).join('\n') : lf(text));

if (!existsSync(source)) {
  console.log(`${name}: ${source} does not exist; nothing to compare.`);
  process.exit(mode === 'sync' ? 1 : 0);
}

const api = readFileSync(source, 'utf8');
if (mode === 'sync') {
  const header = file.header ? `${readFileSync(copy, 'utf8').split(/\r?\n/, 1)[0]}\n` : '';
  writeFileSync(copy, header + body(api));
  console.log(`${name}: ${file.copy.replace('../', '')} updated from spin-trainer-api.`);
} else if (body(api) !== body(readFileSync(copy, 'utf8'))) {
  console.error(`${name}: ${file.copy.replace('../', '')} differs from spin-trainer-api. Run \`npm run ${file.sync}\`.`);
  process.exit(1);
} else {
  console.log(`${name}: ${file.copy.replace('../', '')} is up to date.`);
}
