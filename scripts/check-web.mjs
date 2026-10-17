import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const expected = ['preview/index.html', 'preview/_headers'];
for (const path of expected) assert(existsSync(path), 'Berkas hilang: ' + path);
const html = readFileSync('preview/index.html', 'utf8');
assert.match(html, /<!doctype html>/i, 'Preview belum berupa dokumen HTML');
assert.match(html, /Pedagang Handal/i, 'Brand aplikasi tidak ditemukan');
assert.match(html, /PEDAGANG_CONFIG/, 'Konfigurasi frontend tidak ditemukan');
assert.match(html, /cncwhersxduslivnwbft\.supabase\.co/, 'Supabase proyek aplikasi berbeda');
assert.match(html, /publishableKey/, 'Publishable key tidak tersedia');
assert.match(html, /submitAuth\(form\)/, 'Handler autentikasi tidak ditemukan');
assert.match(html, /\/token\?grant_type=password/, 'Endpoint login tidak ditemukan');
assert.match(html, /\/signup/, 'Endpoint daftar tidak ditemukan');
assert.doesNotMatch(html, /sb_secret_|service_role.*(eyJ|sb_)/i, 'Ada kemungkinan secret server terekspos');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length > 0, 'Script aplikasi tidak ditemukan');
for (let i=0; i<scripts.length; i++) {
  const code = scripts[i][1].trim();
  if (code) new Script(code, {filename: 'preview/index.html:inline-script-' + (i+1)});
}
console.log('PASS: berkas Cloudflare, konfigurasi proyek, handler auth, dan sintaks JavaScript.');
