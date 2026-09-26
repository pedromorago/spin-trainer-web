// Mantiene docs/openapi.yaml como copia exacta del contrato de la API (../spin-trainer-api/openapi.yaml, ADR-0004).
//   node scripts/spec.mjs check   → falla si la copia difiere (salvo la primera línea, que dice de dónde viene)
//   node scripts/spec.mjs sync    → copia el contrato de la API
// Sin el repo hermano (p. ej. en CI de la web) el check se omite: el contract test sigue validando el mock contra la copia.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const copy = fileURLToPath(new URL('../docs/openapi.yaml', import.meta.url));
const source = fileURLToPath(new URL('../../spin-trainer-api/openapi.yaml', import.meta.url));
const body = text => text.replace(/\r\n/g, '\n').split('\n').slice(1).join('\n');

const mode = process.argv[2];
if (!['check', 'sync'].includes(mode)) {
  console.error('Uso: node scripts/spec.mjs <check|sync>');
  process.exit(2);
}
if (!existsSync(source)) {
  console.log(`spec: no existe ${source}; nada que comparar.`);
  process.exit(mode === 'sync' ? 1 : 0);
}

const header = readFileSync(copy, 'utf8').split(/\r?\n/, 1)[0];
const api = readFileSync(source, 'utf8');
if (mode === 'sync') {
  writeFileSync(copy, `${header}\n${body(api)}`);
  console.log('spec: docs/openapi.yaml actualizado desde spin-trainer-api.');
} else if (body(api) !== body(readFileSync(copy, 'utf8'))) {
  console.error('spec: docs/openapi.yaml difiere de spin-trainer-api/openapi.yaml. Ejecuta `npm run spec:sync`.');
  process.exit(1);
} else {
  console.log('spec: docs/openapi.yaml está al día.');
}
