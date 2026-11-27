// SPDX-License-Identifier: AGPL-3.0-only
// L4-07 exit: bumping a tool in tools.json fails the claims gate with the claim
// named (fixture = a temp copy of src/generated with count bumped, then reverted
// by simply deleting the temp dir — the real manifest is never touched).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(genDir) {
  try {
    const out = execFileSync('node', [join(ROOT, 'scripts', 'check-claims.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, CHECK_CLAIMS_GEN: genDir, CHECK_CLAIMS_DIST: join(genDir, 'no-dist') },
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('a bumped tools.json fails the gate naming the tools claim', () => {
  const gen = mkdtempSync(join(tmpdir(), 'claims-fixture-'));
  cpSync(join(ROOT, 'src', 'generated'), gen, { recursive: true });
  const tools = JSON.parse(readFileSync(join(gen, 'tools.json'), 'utf8'));
  tools.count = tools.count + 1;
  tools.tools.push({ name: 'extra_tool', args: '()' });
  writeFileSync(join(gen, 'tools.json'), JSON.stringify(tools, null, 2) + '\n');
  const r = run(gen);
  assert.equal(r.code, 1, `expected exit 1, got 0:\n${r.out}`);
  assert.match(r.out, /tools: claim 21 != tools\.json count 22/);
  rmSync(gen, { recursive: true, force: true });
});

test('the real manifest passes the gate', () => {
  const r = run(join(ROOT, 'src', 'generated'));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /6\/6 claims verified/);
});
