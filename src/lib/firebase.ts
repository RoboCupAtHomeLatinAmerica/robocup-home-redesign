import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore, memoryLocalCache,
  persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDZ86N09yQ7vQAXPX23HCP4PFGhozt4wjM',
  authDomain: 'robocupscoresystem.firebaseapp.com',
  projectId: 'robocupscoresystem',
  storageBucket: 'robocupscoresystem.firebasestorage.app',
  messagingSenderId: '487942139300',
  appId: '1:487942139300:web:5ca6301b7f5d12b5882531',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ── EMULATOR (localhost only) ── KEEP IN SYNC with public/assets/referee-tool/js/firebase.js ──
// localhost → local emulator, deployed → real DB. Decided automatically by hostname so
// production builds (johaq.github.io) are never affected. Also guarded against the static
// build step (no `window`), since this module runs at build time via teams.astro / LiveBanner.astro.
// 10.10.0.1 = this machine's WireGuard address, so an iPad on the VPN can use the local emulator too.
const EMULATOR_HOSTS = ['localhost', '127.0.0.1', '10.10.0.1'];
// Porta 4322 = site de produção (npx astro preview): usa o Firebase real em qualquer host.
const onLocalhost = typeof window !== 'undefined' && EMULATOR_HOSTS.includes(window.location.hostname) && window.location.port !== '4322';

// Force long-polling against the emulator: the default WebChannel transport is slow and
// flaky against the local Firestore emulator (causes "client is offline" + multi-second waits).
// Cache: IndexedDB-backed persistent cache in the browser (bounded LRU, survives reloads,
// multi-tab) — but fall back to memory cache during the static build (this module runs at
// build time in Node, which has no IndexedDB).
const inBrowser = typeof window !== 'undefined';
export const db = initializeFirestore(app, {
  localCache: inBrowser
    ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    : memoryLocalCache(),
  ...(onLocalhost ? { experimentalForceLongPolling: true } : {}),
});
export const auth = getAuth(app);

if (onLocalhost) {
  connectFirestoreEmulator(db, window.location.hostname, 8080);
  connectAuthEmulator(auth, `http://${window.location.hostname}:9099`, { disableWarnings: true });
}

export async function ensureAuth() {
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
