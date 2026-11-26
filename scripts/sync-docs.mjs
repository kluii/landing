// SPDX-License-Identifier: AGPL-3.0-only
// sync-docs.mjs — copies the application repository's docs into src/content/docs/docs/v2/
// and derives the claims artifacts into src/generated/. The site never forks technical
// documentation: never edit a generated page here, change the app's doc and re-sync.
//
// Usage:
//   node scripts/sync-docs.mjs --from ../klui --tag v2.0.0 [--check]
//   node scripts/sync-docs.mjs --from ../klui-legacy --dest v1 --frozen   (one-time v1 freeze)
//
// --check runs everything in memory and diffs against the working tree (CI uses this).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSTALL_COMMANDS, MCP_CONFIG } from '../src/data/snippets.ts';
import { CLAIMS } from '../src/data/claims.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const FROM = resolve(ROOT, arg('from', '../klui'));
const TAG = arg('tag', 'v2.0.0');
const DEST = arg('dest', 'v2');
const CHECK = process.argv.includes('--check');
const FROZEN = process.argv.includes('--frozen');
const APP_DOCS = join(FROM, 'docs');

// The expected set. A missing expected file is a hard failure with the path (docs-sync.md §2).
const EXPECTED = [
  'architecture.md',
  'api.md',
  'mcp.md',
  'permissions.md',
  'security.md',
  'deployment.md',
  'testing.md',
  'decisions.md',
];

// Sidebar order comes from this map, not from the filesystem (docs/features/documentation-site.md §1).
const ORDER = {
  deployment: 2,
  mcp: 3,
  permissions: 4,
  security: 5,
  api: 6,
  architecture: 7,
  testing: 80,
  decisions: 81,
};

function fail(message) {
  console.error(`sync-docs: ${message}`);
  process.exit(1);
}

function listAppDocs() {
  if (!existsSync(APP_DOCS)) fail(`missing app docs directory: ${APP_DOCS}`);
  if (FROZEN) {
    // Frozen archive (legacy line): every top-level markdown file, whatever its name.
    return readdirSync(APP_DOCS)
      .filter((f) => f.endsWith('.md'))
      .sort();
  }
  const files = [];
  for (const name of EXPECTED) {
    if (!existsSync(join(APP_DOCS, name))) fail(`missing expected doc: docs/${name}`);
    files.push(name);
  }
  const featuresDir = join(APP_DOCS, 'features');
  if (existsSync(featuresDir)) {
    const features = readdirSync(featuresDir)
      .filter((f) => f.endsWith('.md'))
      .sort();
    for (const f of features) files.push(`features/${f}`);
  }
  return files;
}

function appVersion() {
  const pkgPath = join(FROM, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (typeof pkg.version === 'string' && pkg.version !== '') return pkg.version;
  }
  // Pre-release: the app has no package.json yet, the tag is the documented version.
  return TAG.replace(/^v/, '');
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function firstDescription(md) {
  const withoutTitle = md.replace(/^#\s+.+$/m, '');
  const para = withoutTitle
    .split(/\n\s*\n/)
    .find((p) => p.trim() !== '' && !p.trim().startsWith('#'));
  if (!para) return '';
  const text = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .trim();
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > 160 ? `${sentence.slice(0, 157).trimEnd()}...` : sentence;
}

function yamlQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sidebarOrderFor(rel) {
  const base = rel.replace(/\.md$/, '');
  if (ORDER[base] !== undefined) return ORDER[base];
  if (base.startsWith('features/')) {
    const features = listAppDocs()
      .filter((f) => f.startsWith('features/'))
      .map((f) => f.replace(/\.md$/, ''));
    return 10 + features.indexOf(base);
  }
  return 50;
}

// Rewrites relative links to site paths; absolute http(s) links are untouched;
// a link to a file outside the expected set fails the run (docs-sync.md §2 step 5).
function rewriteLinks(md, relDoc, expectedSet, destVersion) {
  return md.replace(/\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (whole, text, target, rest) => {
    if (/^(https?:|mailto:|#|\/)/.test(target)) return whole;
    let resolved = resolve(APP_DOCS, dirname(relDoc), target);
    let rel = relative(APP_DOCS, resolved);
    if (!expectedSet.has(rel)) {
      resolved = resolve(APP_DOCS, target);
      rel = relative(APP_DOCS, resolved);
    }
    if (!expectedSet.has(rel)) {
      fail(`link target not in the expected set: ${target} (in ${relDoc})`);
    }
    const [file, anchor] = rel.split('#');
    const sitePath = `/docs/${destVersion}/${file.replace(/\.md$/, '')}`;
    return `[${text}](${sitePath}${anchor ? `#${anchor}` : ''}${rest})`;
  });
}

function frontmatter(rel, md, version) {
  const title = firstHeading(md);
  if (!title) fail(`no first heading in ${rel}`);
  const description = firstDescription(md);
  const order = sidebarOrderFor(rel);
  const lines = [
    '---',
    `title: ${yamlQuote(title)}`,
    `description: ${yamlQuote(description)}`,
    'sidebar:',
    `  order: ${order}`,
    `generated: ${FROZEN ? 'false' : 'true'}`,
    ...(FROZEN ? [`frozen: true`] : [`app_version: ${yamlQuote(version)}`]),
    '---',
    '',
  ];
  return lines.join('\n') + md;
}

// Derives the claims artifacts from the app checkout (the app publishes its own at release;
// pre-release the sync derives them from the app's docs so every number stays greppable in the app).
function parseTools() {
  const mcp = readFileSync(join(APP_DOCS, 'mcp.md'), 'utf8');
  const toolsSection = mcp.split(/^##\s/m).find((s) => s.startsWith('3. Tools'));
  if (!toolsSection) fail('could not find the tool table in docs/mcp.md §3');
  // Greedy args cell: the app's table has an unescaped pipe inside export_board's args.
  return [...toolsSection.matchAll(/^\|\s*`([a-z_]+)`\s*\|(.*)\|\s*$/gm)].map((m) => ({
    name: m[1],
    args: m[2].trim().replace(/`/g, ''),
  }));
}

function parseEnvVars() {
  const deployment = readFileSync(join(APP_DOCS, 'deployment.md'), 'utf8');
  const vars = {};
  for (const m of deployment.matchAll(/^\|\s*`([A-Z0-9_]+)`\s*\|\s*([^|]+)\|/gm)) {
    vars[m[1]] = m[2].trim().replace(/`/g, '');
  }
  return vars;
}

function deriveArtifacts(version, tools, vars) {
  const out = {};
  out['app-version.txt'] = `${version}\n`;
  out['tools.json'] = `${JSON.stringify(
    { count: tools.length, tools, source: 'klui/docs/mcp.md §3 tool table', app_version: version },
    null,
    2,
  )}\n`;
  out['env.json'] = `${JSON.stringify(
    { vars, source: 'klui/docs/deployment.md env table', app_version: version },
    null,
    2,
  )}\n`;

  const installTime = ['install-time.txt', 'docs/install-time.txt'].find((p) =>
    existsSync(join(FROM, p)),
  );
  if (installTime) out['install-time.txt'] = readFileSync(join(FROM, installTime), 'utf8');

  return out;
}

// Generated reference pages (L2-05, L2-06), rendered from the parsed artifacts so the page
// can never drift from tools.json/env.json. Pipes inside cells are escaped for markdown.
function referencePages(version, tools, vars) {
  const minor = version.split('.').slice(0, 2).join('.');
  const fm = (title, description, order) =>
    [
      '---',
      `title: ${yamlQuote(title)}`,
      `description: ${yamlQuote(description)}`,
      'sidebar:',
      `  order: ${order}`,
      'generated: true',
      `app_version: ${yamlQuote(version)}`,
      '---',
      '',
    ].join('\n');
  const envMd =
    fm(
      'Environment variables',
      `Every KLUI_* variable with its default, generated from the app at ${version}.`,
      82,
    ) +
    `# Environment variables\n\nGenerated from the application at ${version}.\n\n| Variable | Default |\n|---|---|\n` +
    Object.entries(vars)
      .map(([k, v]) => `| \`${k}\` | \`${v.replace(/\|/g, '\\|')}\` |`)
      .join('\n') +
    '\n';
  const toolsMd =
    fm(
      'MCP tools',
      `The ${tools.length} MCP tools and their arguments, generated from the app registry at ${version}.`,
      83,
    ) +
    `# MCP tools\n\n${tools.length} tools, frozen at ${minor}, generated from the application registry at ${version}.\nSee [MCP reference](/docs/${DEST}/mcp) for the protocol.\n\n| Tool | Arguments |\n|---|---|\n` +
    tools.map((t) => `| \`${t.name}\` | \`${t.args.replace(/\|/g, '\\|')}\` |`).join('\n') +
    '\n';
  return { 'reference/env.md': envMd, 'reference/tools.md': toolsMd };
}

function run() {
  const version = appVersion();
  const docs = listAppDocs();
  const expectedSet = new Set(docs);
  const outputs = new Map();

  for (const rel of docs) {
    const md = readFileSync(join(APP_DOCS, rel), 'utf8');
    const rewritten = rewriteLinks(md, rel, expectedSet, DEST);
    const destRel = FROZEN ? rel.replace(/\.md$/, '').replace(/^(\d+)-/, '') + '.md' : rel;
    const abs = join(ROOT, 'src/content/docs', 'docs', DEST, destRel);
    if (existsSync(abs) && readFileSync(abs, 'utf8').includes('generated: false')) {
      fail(
        `refusing to overwrite a hand-written site page: src/content/docs/docs/${DEST}/${destRel}`,
      );
    }
    outputs.set(
      join('src/content/docs', 'docs', DEST, destRel),
      frontmatter(rel, rewritten, version),
    );
  }

  // Site-only pages live in src/site-docs/ and are merged at sync time into the docs
  // collection (PROMPT.md §8). They stay outside src/content/docs so the content loader
  // never sees the sources, only the merged copies. Snippet markers are replaced from
  // src/data/snippets.ts so the install command exists in exactly one place.
  const siteDir = DEST === 'v2' ? join(ROOT, 'src', 'site-docs') : null;
  if (siteDir && existsSync(siteDir)) {
    for (const name of readdirSync(siteDir).filter(
      (f) => f.endsWith('.md') || f.endsWith('.mdx'),
    )) {
      let content = readFileSync(join(siteDir, name), 'utf8');
      content = content
        .replace('<!--@snippet:install-->', `\`\`\`bash\n${INSTALL_COMMANDS}\n\`\`\``)
        .replace('<!--@snippet:mcp-->', `\`\`\`json\n${MCP_CONFIG}\n\`\`\``)
        .replace(/<!--@claim:(\w+)-->/g, (_m, key) => {
          const claim = CLAIMS[key];
          if (!claim) fail(`unknown claim marker: ${key}`);
          return Array.isArray(claim.value)
            ? claim.value.map((v) => `- ${v}`).join('\n')
            : String(claim.value);
        });
      outputs.set(join('src/content/docs', 'docs', DEST, name), content);
    }
  }

  if (!FROZEN) {
    const tools = parseTools();
    const vars = parseEnvVars();
    for (const [name, content] of Object.entries(deriveArtifacts(version, tools, vars))) {
      outputs.set(join('src/generated', name), content);
    }
    for (const [name, content] of Object.entries(referencePages(version, tools, vars))) {
      outputs.set(join('src/content/docs', 'docs', DEST, name), content);
    }
  }

  if (CHECK) {
    let dirty = false;
    for (const [dest, content] of outputs) {
      const abs = join(ROOT, dest);
      if (!existsSync(abs)) {
        console.error(`sync-docs --check: missing ${dest}`);
        dirty = true;
      } else if (readFileSync(abs, 'utf8') !== content) {
        console.error(`sync-docs --check: differs ${dest}`);
        dirty = true;
      }
    }
    if (dirty) {
      console.error('sync-docs --check: working tree is not in sync; re-run without --check');
      process.exit(1);
    }
    console.log(`sync-docs --check: ${outputs.size} files in sync (app ${version}, dest ${DEST})`);
    return;
  }

  for (const [dest, content] of outputs) {
    const abs = join(ROOT, dest);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  console.log(
    `sync-docs: wrote ${outputs.size} files from ${FROM} (app ${version}, dest ${DEST}${FROZEN ? ', frozen' : ''})`,
  );
}

run();
