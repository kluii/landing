// SPDX-License-Identifier: AGPL-3.0-only
// Unit tests for the data modules (PROMPT.md §11: content, claims, links helpers).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAIMS } from '../src/data/claims.ts';
import { LINKS } from '../src/data/links.ts';
import { INSTALL_COMMANDS, MCP_CONFIG } from '../src/data/snippets.ts';
import { LEGAL, isPlaceholder } from '../src/data/legal.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('claims: every claim names a source, an artifact and a verifiedAt', () => {
  for (const [key, claim] of Object.entries(CLAIMS)) {
    assert.ok(claim.source.length > 10, `${key}: source missing`);
    assert.ok(
      claim.artifact.endsWith('.json') || claim.artifact.endsWith('.txt'),
      `${key}: artifact must be a synced file`,
    );
    assert.equal(
      claim.verifiedAt,
      CLAIMS.appVersion.value,
      `${key}: verifiedAt must equal the documented app version`,
    );
  }
});

test('claims: artifacts exist for non-pending claims', () => {
  for (const [key, claim] of Object.entries(CLAIMS)) {
    if (claim.pending) continue;
    assert.ok(
      existsSync(join(ROOT, 'src/generated', claim.artifact)),
      `${key}: missing src/generated/${claim.artifact}`,
    );
  }
});

test('claims: tools count matches the derived artifact', () => {
  const tools = JSON.parse(readFileSync(join(ROOT, 'src/generated/tools.json'), 'utf8'));
  assert.equal(tools.count, CLAIMS.tools.value);
  assert.equal(tools.count, tools.tools.length);
});

test('snippets: the install command is three complete commands', () => {
  const lines = INSTALL_COMMANDS.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^git clone https:\/\/.+\.git klui$/);
  assert.match(lines[1], /^cd klui && cp \.env\.example \.env$/);
  assert.match(lines[2], /^docker compose up -d$/);
});

test('snippets: the MCP config parses and carries a placeholder key, never a token', () => {
  const parsed = JSON.parse(MCP_CONFIG);
  assert.equal(parsed.mcpServers.klui.headers.Authorization, 'Bearer kb_YOUR_KEY');
  assert.doesNotMatch(
    MCP_CONFIG,
    /kb_[A-Za-z0-9]{8,}/,
    'a token-shaped literal would be a leaked-credential smell',
  );
});

test('links: demo is empty by default (the link is omitted, never dead)', () => {
  assert.equal(LINKS.demo, '');
  assert.match(LINKS.github, /^https:\/\//);
  assert.equal(LINKS.wyliam, 'https://wyliam.dev');
});

test('legal: every field is a placeholder until the operator fills it', () => {
  for (const [field, value] of Object.entries(LEGAL)) {
    assert.ok(isPlaceholder(value), `${field} is not a {{PLACEHOLDER}}`);
  }
});
