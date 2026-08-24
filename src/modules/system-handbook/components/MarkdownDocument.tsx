import type { ElementType, ReactNode } from 'react';

type DocumentIndexEntry = {
  id: string;
  source: string;
  title: string;
};

interface MarkdownDocumentProps {
  content: string;
  source: string;
  documents: readonly DocumentIndexEntry[];
}

function normalizePath(value: string) {
  const parts: string[] = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

function resolveDocumentHref(source: string, target: string, documents: readonly DocumentIndexEntry[]) {
  const [rawPath, fragment] = target.split('#', 2);
  if (!rawPath) return fragment ? `#${fragment}` : undefined;
  if (!rawPath.toLowerCase().endsWith('.md')) return undefined;
  const sourceDirectory = source.split('/').slice(0, -1).join('/');
  const resolved = normalizePath(`${sourceDirectory}/${rawPath}`);
  const entry = documents.find((document) => document.source === resolved);
  if (!entry) return undefined;
  return `/system-overview/docs/${entry.id}${fragment ? `#${fragment}` : ''}`;
}

function safeHref(source: string, target: string, documents: readonly DocumentIndexEntry[]) {
  const trimmed = target.trim().replace(/\s+(["']).*\1$/, '');
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return undefined;
  return resolveDocumentHref(source, trimmed, documents);
}

function inline(text: string, source: string, documents: readonly DocumentIndexEntry[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token = /(`[^`]+`|\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(token)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const value = match[0];
    if (value.startsWith('`')) {
      nodes.push(<code key={`inline-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 dark:bg-slate-800 dark:text-slate-200">{value.slice(1, -1)}</code>);
    } else if (value.startsWith('[')) {
      const link = value.match(/^\[([^\]]+)\]\(([^)]*)\)$/);
      const href = link ? safeHref(source, link[2], documents) : undefined;
      if (href) {
        const label = link?.[1] ?? value;
        nodes.push(<a key={`inline-${index}`} href={href} className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary" target={/^https?:/i.test(href) ? '_blank' : undefined} rel={/^https?:/i.test(href) ? 'noreferrer' : undefined}>{inline(label, source, documents)}</a>);
      } else {
        nodes.push(<span key={`inline-${index}`} className="text-slate-600 dark:text-slate-400">{link?.[1] ?? value}</span>);
      }
    } else if (value.startsWith('**') || value.startsWith('__')) {
      nodes.push(<strong key={`inline-${index}`}>{inline(value.slice(2, -2), source, documents)}</strong>);
    } else {
      nodes.push(<em key={`inline-${index}`}>{inline(value.slice(1, -1), source, documents)}</em>);
    }
    cursor = start + value.length;
    index += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function tableCells(line: string) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function renderMarkdown(content: string, source: string, documents: readonly DocumentIndexEntry[]) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockKey = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = line.match(/^\s*```(.*)$/);
    if (fence) {
      const language = fence[1].trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(<pre key={`block-${blockKey++}`} className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code data-language={language || undefined}>{code.join('\n')}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      const Heading = `h${level}` as ElementType;
      blocks.push(<Heading key={`block-${blockKey++}`} className={level === 1 ? 'text-2xl font-black tracking-tight text-slate-950 dark:text-white' : level === 2 ? 'text-xl font-black tracking-tight text-slate-900 dark:text-white' : 'text-base font-black text-slate-900 dark:text-white'}>{inline(heading[2], source, documents)}</Heading>);
      index += 1;
      continue;
    }
    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith('>')) {
        quote.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={`block-${blockKey++}`} className="border-l-4 border-primary/40 bg-primary/[0.04] px-4 py-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{quote.map((item, itemIndex) => <p key={itemIndex}>{inline(item, source, documents)}</p>)}</blockquote>);
      continue;
    }
    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const header = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(<div key={`block-${blockKey++}`} className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400"><tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="px-3 py-2 font-black">{inline(cell, source, documents)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100 align-top dark:border-slate-800">{header.map((_, cellIndex) => <td key={cellIndex} className="px-3 py-2 leading-5 text-slate-600 dark:text-slate-300">{inline(row[cellIndex] ?? '', source, documents)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const unordered = /^\s*[-*+]\s+/.test(line);
    const ordered = /^\s*\d+[.)]\s+/.test(line);
    if (unordered || ordered) {
      const items: string[] = [];
      const matcher = unordered ? /^\s*[-*+]\s+/ : /^\s*\d+[.)]\s+/;
      while (index < lines.length && matcher.test(lines[index])) {
        items.push(lines[index].replace(matcher, ''));
        index += 1;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={`block-${blockKey++}`} className={`${ordered ? 'list-decimal' : 'list-disc'} ml-5 space-y-1 text-sm leading-6 text-slate-600 dark:text-slate-300`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item, source, documents)}</li>)}</List>);
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^\s*```/.test(lines[index]) && !/^(#{1,6})\s+/.test(lines[index]) && !lines[index].startsWith('>') && !/^\s*[-*+]\s+/.test(lines[index]) && !/^\s*\d+[.)]\s+/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`block-${blockKey++}`} className="text-sm leading-7 text-slate-600 dark:text-slate-300">{inline(paragraph.join(' '), source, documents)}</p>);
  }
  return blocks;
}

export default function MarkdownDocument({ content, source, documents }: MarkdownDocumentProps) {
  return <article className="space-y-5">{renderMarkdown(content, source, documents)}</article>;
}
