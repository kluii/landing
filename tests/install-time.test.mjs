// SPDX-License-Identifier: AGPL-3.0-only
// The install-time artifact (docs/content.md §6): both claims that read it —
// installMinutes and installInstance — must validate against the same file. The gate
// used to parse every claim with the numeric parser, so the string claim failed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CLAIMS } from '../src/data/claims.ts';

const ROOT = join(new URL('..', import.meta.url).pathname);

function runGateWithArtifact(content) {
  const gen = mkdtempSync(join(tmpdir(), 'claims-install-'));
  cpSync(join(ROOT, 'src', 'generated'), gen, { recursive: true });
  try {
    writeFileSync(join(gen, 'install-time.txt'), content);
    const out = execFileSync('node', [join(ROOT, 'scripts', 'check-claims.mjs')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        CHECK_CLAIMS_GEN: gen,
        CHECK_CLAIMS_DIST: join(gen, 'no-dist'),
      },
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('install-time.txt: the string claim validates next to the numeric claim', () => {
  // This used to be impossible: the gate ran the numeric parser over the whole
  // artifact for every claim, so any install-time.txt either failed installMinutes
  // or the file was never checked.
  const r = runGateWithArtifact('2 vCPU / 2 GB\n5\n');
  assert.equal(r.code, 0, r.out);
});

test('a wrong install-time measurement fails the gate naming the claim', () => {
  const r = runGateWithArtifact('2 vCPU / 2 GB\n6\n');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /installMinutes/);
});

test('an install-time.txt without the minutes line fails the gate', () => {
  const r = runGateWithArtifact('2 vCPU / 2 GB\n');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /installMinutes/);
});

test('an install-time.txt with a changed instance fails the gate', () => {
  const r = runGateWithArtifact('8 vCPU / 64 GB\n5\n');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /installInstance/);
});

test('the claims manifest still declares the two install claims', () => {
  assert.ok(CLAIMS.installMinutes.value);
  assert.ok(CLAIMS.installInstance.value.length > 0);
});
