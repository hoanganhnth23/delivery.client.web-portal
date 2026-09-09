import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(scriptDirectory);
const outputDirectory = join(projectDirectory, 'dist-preview-static');
const htmlPath = join(outputDirectory, 'preview-static.html');

const resolveOutputAsset = (assetPath) =>
  join(outputDirectory, assetPath.replace(/^\.\//, ''));

const readInlineAsset = async (assetPath) => readFile(resolveOutputAsset(assetPath), 'utf8');

const rewriteCssAssetUrls = (css) => css.replace(
  /url\((\s*["']?)(?!data:|https?:|#|\/)([^)"']+?)(["']?\s*)\)/g,
  (_match, opening, assetPath, closing) => {
    const normalizedPath = assetPath.replace(/^\.\//, '');
    return `url(${opening}./assets/${normalizedPath}${closing})`;
  },
);

let html = await readFile(htmlPath, 'utf8');
const scriptMatch = html.match(/<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/i);
if (!scriptMatch) throw new Error('Static preview JavaScript asset was not found');
const script = await readInlineAsset(scriptMatch[1]);
html = html.replace(scriptMatch[0], () => `<script type="module">${script}</script>`);

const styleMatches = [...html.matchAll(/<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi)];
for (const match of styleMatches) {
  const css = rewriteCssAssetUrls(await readInlineAsset(match[1]));
  html = html.replace(match[0], () => `<style>${css}</style>`);
}

await writeFile(htmlPath, html, 'utf8');
const relativePath = relative(projectDirectory, htmlPath);
console.log(`Standalone preview written to ${relativePath}`);
