#!/usr/bin/env node
// Configura a competição "bo2026" (RoboCup@Home Brazil Open 2026, João Pessoa) no EMULADOR local.
//
//   1. npm run emulator                      (terminal A; deixe rodando)
//   2. node scripts/setup-bo2026.js          (terminal B)
//
// Sem dependências (fala com os emuladores por HTTP) e só alcança o emulador (nunca produção).
// Se o emulador estiver em outro host (firebase.json usa 10.10.0.1), exporte:
//   FIRESTORE_EMULATOR_HOST=10.10.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=10.10.0.1:9099
//
// Não apaga contas nem competições existentes (só grava bo2026 e as 9 equipes).
// Contas de teste (só no emulador):  arbitro1@local / arbitro1  ·  arbitro2@local / arbitro2  ·  admin@local / admin123
// A agenda segue o Google Agenda do site (horários de Brasília), com cada equipe rodando uma vez por prova.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT   = 'robocup-home';
const FS_HOST   = process.env.FIRESTORE_EMULATOR_HOST     || 'localhost:8080';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FS   = `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const IDT  = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;
const AUTH = `http://${AUTH_HOST}`;
const TESTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'referee-tool', 'tests');

import { COMP_ID, ARENA, DEFAULT_REFEREES as REFEREES, DEFAULT_PIN as REFEREE_PIN, TEAMS, COMP, buildSlots } from './bo2026-config.js';

// ── FIRESTORE / AUTH (REST) ─────────────────────────────────────────────────
function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')  return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string')  return { stringValue: v };
  if (Array.isArray(v))       return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object')  return { mapValue: { fields: toFields(v) } };
  throw new Error(`valor não suportado: ${v}`);
}
const toFields = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
const H = { 'Authorization': 'Bearer owner', 'Content-Type': 'application/json' };

async function fsSet(path, data) {
  const r = await fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: toFields(data) }) });
  if (!r.ok) throw new Error(`Firestore ${path}: ${r.status} ${await r.text()}`);
}
async function fsClear(path) {
  const r = await fetch(`${FS}/${path}?pageSize=500`, { headers: H });
  if (!r.ok) return;
  const { documents = [] } = await r.json();
  await Promise.all(documents.map(d => fetch(`${FS}/${d.name.split('/documents/')[1]}`, { method: 'DELETE', headers: H })));
}
async function authCreate(email, password, claims) {
  const r = await fetch(`${IDT}/accounts:signUp?key=fake-api-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const j = await r.json();
  if (!r.ok) { if (JSON.stringify(j).includes('EMAIL_EXISTS')) return; throw new Error(`signUp ${email}: ${JSON.stringify(j)}`); }
  if (claims) await fetch(`${IDT}/accounts:update`, { method: 'POST', headers: H, body: JSON.stringify({ localId: j.localId, customAttributes: JSON.stringify(claims) }) });
}

// ── EXECUÇÃO ────────────────────────────────────────────────────────────────
async function main() {
  await Promise.all(TEAMS.map(t => fsSet(`teams/${t.id}`, t)));
  console.log(`  ✓ ${TEAMS.length} equipes`);

  await fsSet(`competitions/${COMP_ID}`, COMP(REFEREE_PIN));
  console.log(`  ✓ competição ${COMP_ID}`);

  const index = JSON.parse(readFileSync(join(TESTS_DIR, 'index.json'), 'utf8'));
  for (const { id } of index) await fsSet(`competitions/${COMP_ID}/tests/${id}`, JSON.parse(readFileSync(join(TESTS_DIR, `${id}.json`), 'utf8')));
  console.log(`  ✓ ${index.length} provas`);

  await fsClear(`competitions/${COMP_ID}/slots`);
  const slots = buildSlots();
  for (const [i, s] of slots.entries()) await fsSet(`competitions/${COMP_ID}/slots/slot_${String(i + 1).padStart(3, '0')}`, s);
  console.log(`  ✓ ${slots.length} slots (arena: ${ARENA})`);

  await authCreate('arbitro1@local', 'arbitro1');
  await authCreate('arbitro2@local', 'arbitro2');
  await authCreate('admin@local', 'admin123', { admin: true });
  console.log('  ✓ contas: arbitro1@local / arbitro1 · arbitro2@local / arbitro2 · admin@local / admin123');
}
main().catch(e => { console.error(e); process.exit(1); });
