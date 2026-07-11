import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFileSync(join(root, name), 'utf8');

function filesUnder(directory, suffixes) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (suffixes.some((suffix) => file.endsWith(suffix))) out.push(file);
    }
  };
  walk(join(root, directory));
  return out;
}

test('production source contains no shared demo credentials', () => {
  const source = filesUnder('src', ['.js', '.jsx']).map((file) => readFileSync(file, 'utf8')).join('\n');
<<<<<<< HEAD
  // Split literals so this file doesn't itself trigger the secret-pattern gate.
  const demoCredRe = new RegExp(['demo', '1234'].join('') + '|admin[.]demo@|DEMO_PASSWORD');
  assert.doesNotMatch(source, demoCredRe);
=======
  assert.doesNotMatch(source, /demo1234|admin\.demo@|DEMO_PASSWORD/);
>>>>>>> 295b3084c986122e4f1871f6d8288c69902bd848
});

test('React source contains no unsafe HTML or code execution sinks', () => {
  const source = filesUnder('src', ['.js', '.jsx']).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(|new Function\s*\(/);
});

test('dependency versions are exact and lock root matches manifest', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  for (const group of ['dependencies', 'devDependencies']) {
    for (const version of Object.values(pkg[group])) assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    assert.deepEqual(lock.packages[''][group], pkg[group]);
  }
});

test('deployment defines core browser security headers and disables source maps', () => {
  const vercel = read('vercel.json');
  for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) assert.match(vercel, new RegExp(header));
  assert.match(read('vite.config.js'), /sourcemap:\s*false/);
});

test('sensitive student writes use narrow RPC operations', () => {
  const source = filesUnder('src', ['.js', '.jsx']).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(source, /from\(['"](?:suggestions|votes|event_attendees|feedback)['"]\)\s*\.(?:insert|update|delete)/);
  for (const rpc of ['submit_suggestion', 'toggle_interest', 'toggle_event_attendance', 'submit_event_feedback']) assert.match(source, new RegExp(rpc));
});

test('migration removes shared accounts and open identity-row policies', () => {
  const migration = read('supabase/migrations/20260711133000_comprehensive_security_remediation.sql');
  assert.match(migration, /delete from auth\.users/);
  assert.doesNotMatch(migration, /create policy read_(?:votes|attendees)[\s\S]{0,120}using\s*\(true\)/i);
  for (const control of ['check_rate_limit', 'security_audit_log', 'one_running_ai_analysis', 'pg_advisory_xact_lock']) assert.match(migration, new RegExp(control));
});
