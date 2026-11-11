import fs from 'fs/promises';
import path from 'path';

const TARGET_CHUNK_CHARS = 700;
const OVERLAP_CHARS = 80;

const PROSE_EXTENSIONS = new Set(['.md', '.mdx', '.txt']);

// A single paragraph/block can itself exceed the target size.
// Cut it with a sliding window so no chunk balloons past the target.
// A single paragraph/block can itself exceed the target size.
// Cut it with a sliding window, preferring line breaks so chunks
// start and end on whole lines instead of mid-statement.
function splitOversized(text) {
  if (text.length <= TARGET_CHUNK_CHARS) return [text];

  const pieces = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + TARGET_CHUNK_CHARS, text.length);

    // prefer ending on a line break so chunks don't stop mid-line
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start + OVERLAP_CHARS * 2) end = lastNewline;
    }

    pieces.push(text.slice(start, end));
    if (end === text.length) break;

    start = end - OVERLAP_CHARS;
    // start the next chunk on a whole line when one begins inside the overlap
    const nextNewline = text.indexOf('\n', start);
    if (nextNewline !== -1 && nextNewline < end) start = nextNewline + 1;
  }
  return pieces;
}
// Prose: split on paragraphs, pack them up to the target size,
// and carry the tail of each chunk into the next as overlap.
function chunkProse(text) {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    for (const piece of splitOversized(para)) {
      if (current.length + piece.length > TARGET_CHUNK_CHARS && current.length > 0) {
        chunks.push(current.trim());
        current = current.slice(-OVERLAP_CHARS) + '\n\n' + piece;
      } else {
        current += (current ? '\n\n' : '') + piece;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Code: split on blank-line-separated blocks (a heuristic stand-in
// for function boundaries), then pack the same way as prose.
function chunkCode(text) {
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
  const chunks = [];
  let current = '';

  for (const block of blocks) {
    for (const piece of splitOversized(block)) {
      if (current.length + piece.length > TARGET_CHUNK_CHARS && current.length > 0) {
        chunks.push(current.trim());
        current = piece;
      } else {
        current += (current ? '\n\n' : '') + piece;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Locate a chunk inside the original file to get its line range.
function findLineRange(fullText, chunkText) {
  const index = fullText.indexOf(chunkText.slice(0, 50));
  if (index === -1) return { startLine: null, endLine: null };

  const startLine = fullText.slice(0, index).split('\n').length;
  const endLine = startLine + chunkText.split('\n').length - 1;
  return { startLine, endLine };
}

// Read a file, pick the right chunker by extension, attach metadata.
export async function chunkFile(fileEntry) {
  const text = await fs.readFile(fileEntry.fullPath, 'utf-8');
  const ext = path.extname(fileEntry.relativePath).toLowerCase();

  const rawChunks = PROSE_EXTENSIONS.has(ext) ? chunkProse(text) : chunkCode(text);

  return rawChunks.map((content, index) => {
    const { startLine, endLine } = findLineRange(text, content);
    return {
      content,
      metadata: {
        relativePath: fileEntry.relativePath,
        chunkIndex: index,
        startLine,
        endLine,
      },
    };
  });
}