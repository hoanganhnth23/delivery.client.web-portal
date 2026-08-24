#!/usr/bin/env node

/**
 * Generate the static, allowlisted Markdown corpus used by the public system
 * handbook. The browser never reads the workspace filesystem or a live API.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const write = args.includes('--write');
const check = args.includes('--check');
const rootIndex = args.indexOf('--workspace-root');
const workspaceRoot = path.resolve(rootIndex >= 0 ? args[rootIndex + 1] ?? '..' : '..');
const projectRoot = process.cwd();
const sourceManifestPath = path.join(
  workspaceRoot,
  'backend_delivery/docs/platform/system/handbook-catalog.json',
);
const outputPath = path.join(
  projectRoot,
  'src/modules/system-handbook/data/generatedDocumentManifest.ts',
);

if ((write && check) || (!write && !check)) {
  console.error('Usage: node scripts/generate-system-docs-portal.mjs --write|--check --workspace-root <path>');
  process.exit(2);
}

const excludedDirectoryNames = new Set([
  '.git', '.dart_tool', '.venv', 'node_modules', 'Pods', 'build', 'dist',
  'target', '.gradle', '.secrets', 'reference',
]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectoryNames.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, files);
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
  }
  return files;
}

function globRegExp(pattern) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    const next = pattern[index + 1];
    if (character === '*' && next === '*') {
      source += '.*';
      index += 1;
    } else if (character === '*') {
      source += '[^/]*';
    } else {
      source += /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character;
    }
  }
  return new RegExp(`${source}$`);
}

function matchesAny(relativePath, patterns) {
  return patterns.some((pattern) => globRegExp(pattern).test(relativePath));
}

function titleFromMarkdown(content, fallback) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading?.replace(/[`*_]/g, '') || fallback;
}

function sectionFor(source) {
  if (source.startsWith('backend_delivery/docs/platform/system/')) return 'system';
  if (source.startsWith('backend_delivery/docs/platform/product/')) return 'product';
  if (source.startsWith('backend_delivery/docs/platform/decisions/')) return 'decisions';
  if (source.startsWith('backend_delivery/docs/')) return 'backend';
  if (source.startsWith('delivery_app/')) return 'customer-app';
  if (source.startsWith('delivery_web/')) return 'web';
  if (source.startsWith('shipper_app2/')) return 'shipper';
  return 'platform';
}

function languageFor(content) {
  return /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(content) ? 'vi-or-mixed' : 'en';
}

function statusFor(source, manifest) {
  const relativeToPlatform = source.replace('backend_delivery/docs/platform/', '');
  return manifest.classificationDefaults?.[relativeToPlatform]
    ?? (source.includes('/operations/production-platform-decision-packet.md') ? 'decision-required' : 'current');
}

function classificationFor(source, manifest) {
  const relativeToPlatform = source.replace('backend_delivery/docs/platform/', '');
  return manifest.classificationDefaults?.[relativeToPlatform]
    ?? (source.includes('/simulator/') ? 'dev-only' : 'public');
}

function safeId(source) {
  return `doc-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function loadDocuments() {
  const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  const include = manifest.include ?? [];
  const exclude = manifest.exclude ?? [];
  const allFiles = walk(workspaceRoot);
  const selected = allFiles
    .map((file) => ({ file, source: path.relative(workspaceRoot, file).split(path.sep).join('/') }))
    .filter(({ source }) => matchesAny(source, include))
    .filter(({ source }) => !matchesAny(source, exclude))
    .sort((left, right) => left.source.localeCompare(right.source));

  const forbidden = (manifest.forbiddenContent ?? []).map((pattern) => new RegExp(pattern, 'i'));
  const documents = selected.map(({ file, source }) => {
    const content = fs.readFileSync(file, 'utf8').replace(/\0/g, '');
    const violation = forbidden.find((pattern) => pattern.test(content));
    if (violation) throw new Error(`Forbidden handbook content in ${source}: ${violation}`);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return {
      id: safeId(source),
      source,
      title: titleFromMarkdown(content, path.basename(source, '.md')),
      section: sectionFor(source),
      language: languageFor(content),
      status: statusFor(source, manifest),
      classification: classificationFor(source, manifest),
      verifiedAt: manifest.generatedAt,
      sha256: hash,
      content,
    };
  });

  return {
    generatedAt: manifest.generatedAt,
    sourceManifest: 'backend_delivery/docs/platform/system/handbook-catalog.json',
    documents,
  };
}

const value = loadDocuments();
const contents = `// Generated by scripts/generate-system-docs-portal.mjs. Do not edit by hand.\nexport const HANDBOOK_DOCUMENTS = ${JSON.stringify(value, null, 2)} as const;\n`;

if (check) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== contents) {
    throw new Error('Generated system docs portal is stale. Run with --write.');
  }
  console.log(`PASS: generated docs portal is current (${value.documents.length} documents).`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents);
  console.log(`Generated ${path.relative(projectRoot, outputPath)} (${value.documents.length} documents).`);
}
