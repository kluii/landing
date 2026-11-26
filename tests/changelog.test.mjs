// SPDX-License-Identifier: AGPL-3.0-only
// L3-01 exit: the changelog generator against a fixture git repo — expected groups,
// cleaning rules, nothing-to-write, never-rewrite, bad tag. docs/features/changelog.md §1/§6.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'changelog.mjs');

function sh(cwd, args) {
  const list = Array.isArray(args) ? args : args.replace(/^git\s+/, '').split(' ');
  execFileSync('git', list, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
}

function commit(cwd, message, body = '', files = ['a.txt']) {
  for (const f of files) writeFileSync(join(cwd, f), `${message}\n`);
  sh(cwd, 'git add -A');
  const args = ['commit', '-m', message];
  if (body) args.push('-m', body);
  execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
}

function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'changelog-fixture-'));
  sh(dir, 'git init -q');
  sh(dir, 'git config user.email t@example.com');
  sh(dir, 'git config user.name T');
  sh(dir, 'git config commit.gpgsign false');
  commit(dir, 'feat: initial');
  sh(dir, 'git tag v1.0.0');
  commit(dir, 'feat(x): experimental flag');
  commit(dir, 'Revert "feat(x): experimental flag"');
  commit(dir, 'feat(board): add close-out summary');
  commit(dir, 'feat(api)!: change the move payload');
  commit(dir, 'feat(mcp): rename tools', 'BREAKING CHANGE: list_boards is now boards_list');
  commit(dir, 'fix(ui): correct card drop position');
  commit(dir, 'doc: update the README');
  commit(dir, 'chore(deps): bump dependencies');
  commit(dir, 'wip: scratch work');
  commit(dir, 'chore: lockfile only', '', ['package-lock.json']);
  sh(dir, 'git tag v1.1.0');
  sh(dir, 'git tag v1.1.1'); // same commit as v1.1.0: empty range
  return dir;
}

function run(args) {
  try {
    const out = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('dry run against a fixture repo produces the expected groups', () => {
  const repo = makeFixture();
  const outDir = join(repo, 'out');
  const r = run([
    '--repo',
    repo,
    '--from',
    'v1.0.0',
    '--to',
    'v1.1.0',
    '--out',
    outDir,
    '--dry-run',
  ]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /title: '1\.1\.0'/);
  assert.match(r.out, /draft: true/);
  assert.match(r.out, /TODO\(hand-written\)/);
  assert.match(r.out, /TODO: one sentence/);
  // Breaking first, from the "!" marker and the BREAKING CHANGE body
  const breaking = r.out.indexOf('## Breaking');
  const added = r.out.indexOf('## Added');
  const docs = r.out.indexOf('## Docs');
  const internal = r.out.indexOf('<details>');
  assert.ok(breaking !== -1 && added !== -1 && docs !== -1 && internal !== -1, r.out);
  assert.ok(breaking < added && added < docs && docs < internal, 'section order');
  assert.match(r.out, /- change the move payload/); // first letter lowercased
  assert.match(r.out, /- list_boards is now boards_list/);
  assert.match(r.out, /- add close-out summary/);
  assert.match(r.out, /- update the README/); // acronym/proper noun kept
  assert.match(r.out, /- bump dependencies/);
  // noise dropped: revert pair, wip, lockfile-only
  assert.doesNotMatch(r.out, /experimental flag/);
  assert.doesNotMatch(r.out, /scratch work/);
  assert.doesNotMatch(r.out, /lockfile only/);
  // the fix commit survives in its own section
  assert.match(r.out, /## Fixed\n\n- correct card drop position/);
  // internal collapsed
  assert.match(r.out, /<summary>Internal \(1 commits\)<\/summary>/);
  // range line
  assert.match(r.out, /Generated from commits/);
  assert.ok(!existsSync(join(outDir, '1.1.0.mdx')), 'dry run writes nothing');
});

test('writes the post, never rewrites it, exits 0 on already-exists', () => {
  const repo = makeFixture();
  const outDir = join(repo, 'out');
  const args = ['--repo', repo, '--from', 'v1.0.0', '--to', 'v1.1.0', '--out', outDir];
  const first = run(args);
  assert.equal(first.code, 0, first.out);
  const file = join(outDir, '1.1.0.mdx');
  assert.ok(existsSync(file));
  const content = readFileSync(file, 'utf8');
  assert.match(content, /date: \d{4}-\d{2}-\d{2}/);
  const second = run(args);
  assert.equal(second.code, 0);
  assert.match(second.out, /already exists/);
  assert.equal(readFileSync(file, 'utf8'), content, 'file untouched');
});

test('a tag range without commits exits 0 with nothing to write', () => {
  const repo = makeFixture();
  const r = run([
    '--repo',
    repo,
    '--from',
    'v1.1.0',
    '--to',
    'v1.1.1',
    '--out',
    join(repo, 'out2'),
  ]);
  assert.equal(r.code, 0);
  assert.match(r.out, /nothing to write/);
});

test('an unknown tag or a non-repo exits 1', () => {
  const repo = makeFixture();
  assert.equal(
    run(['--repo', repo, '--from', 'v9.9.9', '--to', 'v1.1.0', '--out', join(repo, 'o')]).code,
    1,
  );
  const notRepo = mkdtempSync(join(tmpdir(), 'not-a-repo-'));
  assert.equal(
    run(['--repo', notRepo, '--from', 'a', '--to', 'b', '--out', join(notRepo, 'o')]).code,
    1,
  );
});
