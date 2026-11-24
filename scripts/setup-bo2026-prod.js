#!/usr/bin/env node
// Configura a competição "bo2026" (Brazil Open 2026) em um projeto Firebase REAL.
//
// Pré-requisitos (uma vez):
//   cd scripts && npm install                       # instala o firebase-admin
//   scripts/service-account.json                    # chave de serviço do SEU projeto (no .gitignore)
//   (Console Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada)
//
// Uso (sem --confirm só SIMULA e mostra o que seria gravado):
//   node setup-bo2026-prod.js --admin voce@email.com \
//        --referee ref1@email.com:senha1 --referee ref2@email.com:senha2 --pin MEUPIN [--confirm]
//
// O que faz: grava as 9 equipes, a competição bo2026, as 6 provas e os slots (com os e-mails reais
// dos árbitros: manhã = 1º, tarde = 2º); cria as contas dos árbitros (se ainda não existem) e dá a
// você o papel de admin (a conta --admin precisa existir no Authentication, ou será criada com
// --admin-password). Pode ser rodado de novo: reescreve os mesmos documentos.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COMP_ID, ARENA, DEFAULT_PIN, TEAMS, COMP, buildSlots } from './bo2026-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = join(__dirname, '..', 'public', 'assets', 'referee-tool', 'tests');

// ── argumentos ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = (name, all = false) => {
  const out = [];
  args.forEach((a, i) => { if (a === `--${name}` && args[i + 1]) out.push(args[i + 1]); });
  return all ? out : out[0];
};
const confirm = args.includes('--confirm');
const adminEmail = opt('admin');
const adminPassword = opt('admin-password');
const pin = opt('pin') || DEFAULT_PIN;
const referees = opt('referee', true).map(r => { const i = r.indexOf(':'); return { email: r.slice(0, i), password: r.slice(i + 1) }; });

if (referees.length !== 2 || referees.some(r => !r.email.includes('@') || r.password.length < 6)) {
  console.error('Informe exatamente 2 árbitros: --referee email:senha (senha com 6+ caracteres).'); process.exit(1);
}
if (!adminEmail) { console.error('Informe --admin seu@email.com'); process.exit(1); }
if (pin === DEFAULT_PIN) console.warn('⚠  Usando o PIN padrão de teste (cbr2026). Passe --pin com um PIN seu.');

const slots = buildSlots(referees.map(r => r.email));
const index = JSON.parse(readFileSync(join(TESTS_DIR, 'index.json'), 'utf8'));
const tests = index.map(({ id }) => [id, JSON.parse(readFileSync(join(TESTS_DIR, `${id}.json`), 'utf8'))]);

console.log(`Competição ${COMP_ID} · ${TEAMS.length} equipes · ${tests.length} provas · ${slots.length} slots · arena ${ARENA}`);
console.log(`Árbitros: ${referees.map(r => r.email).join(', ')} · admin: ${adminEmail}`);
if (!confirm) { console.log('\nSIMULAÇÃO (nada foi gravado). Rode de novo com --confirm para gravar.'); process.exit(0); }

// ── gravação ────────────────────────────────────────────────────────────────
const saPath = join(__dirname, 'service-account.json');
if (!existsSync(saPath)) { console.error('Falta scripts/service-account.json (chave de serviço do seu projeto).'); process.exit(1); }
const sa = JSON.parse(readFileSync(saPath, 'utf8'));
const { default: admin } = await import('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore(), auth = admin.auth();
console.log(`\nProjeto: ${sa.project_id}`);

async function ensureUser(email, password) {
  try { return await auth.getUserByEmail(email); }
  catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    if (!password) throw new Error(`A conta ${email} não existe; crie-a no Console ou passe --admin-password.`);
    console.log(`  + conta criada: ${email}`);
    return auth.createUser({ email, password });
  }
}

for (const t of TEAMS) await db.doc(`teams/${t.id}`).set(t);
console.log(`  ✓ ${TEAMS.length} equipes`);
await db.doc(`competitions/${COMP_ID}`).set(COMP(pin));
console.log(`  ✓ competição ${COMP_ID}`);
for (const [id, def] of tests) await db.doc(`competitions/${COMP_ID}/tests/${id}`).set(def);
console.log(`  ✓ ${tests.length} provas`);
const old = await db.collection(`competitions/${COMP_ID}/slots`).get();
await Promise.all(old.docs.map(d => d.ref.delete()));
for (const [i, s] of slots.entries()) await db.doc(`competitions/${COMP_ID}/slots/slot_${String(i + 1).padStart(3, '0')}`).set(s);
console.log(`  ✓ ${slots.length} slots`);

for (const r of referees) await ensureUser(r.email, r.password);
console.log(`  ✓ contas dos árbitros: ${referees.map(r => r.email).join(', ')}`);
const adm = await ensureUser(adminEmail, adminPassword);
await auth.setCustomUserClaims(adm.uid, { admin: true });
console.log(`  ✓ ${adminEmail} agora é admin (saia e entre de novo no site para o papel valer)`);
process.exit(0);
