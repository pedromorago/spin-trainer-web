// Copias fijadas de lo que publica spin-trainer-api (repo hermano, ../spin-trainer-api):
//   spec    openapi.yaml          → docs/openapi.yaml (contrato; ADR-0004). La primera línea dice de dónde viene.
//   ranges  reference-ranges.json → src/shared/api/mock/reference-ranges.json (rangos de referencia del seed V5)
//
//   node scripts/sync.mjs check <spec|ranges>   → falla si la copia difiere
//   node scripts/sync.mjs sync  <spec|ranges>   → trae la versión de la API
// Sin el repo hermano (p. ej. en el CI de la web sin token) el check se omite: los tests validan el mock contra la copia.
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
  console.error('Uso: node scripts/sync.mjs <check|sync> <spec|ranges>');
  process.exit(2);
}
const copy = fileURLToPath(new URL(file.copy, import.meta.url));
const source = fileURLToPath(new URL(file.source, import.meta.url));
const lf = text => text.replace(/\r\n/g, '\n');
// Sin la cabecera de la copia (primera línea), si la lleva.
const body = text => (file.header ? lf(text).split('\n').slice(1).join('\n') : lf(text));

if (!existsSync(source)) {
  console.log(`${name}: no existe ${source}; nada que comparar.`);
  process.exit(mode === 'sync' ? 1 : 0);
}

const api = readFileSync(source, 'utf8');
if (mode === 'sync') {
  const header = file.header ? `${readFileSync(copy, 'utf8').split(/\r?\n/, 1)[0]}\n` : '';
  writeFileSync(copy, header + body(api));
  console.log(`${name}: ${file.copy.replace('../', '')} actualizado desde spin-trainer-api.`);
} else if (body(api) !== body(readFileSync(copy, 'utf8'))) {
  console.error(`${name}: ${file.copy.replace('../', '')} difiere de spin-trainer-api. Ejecuta \`npm run ${file.sync}\`.`);
  process.exit(1);
} else {
  console.log(`${name}: ${file.copy.replace('../', '')} está al día.`);
}
