import { cloneRepo, listRelevantFiles, cleanupClone } from './github.service.js';
import { chunkFile } from './chunking.service.js';
import { embedDocuments } from './embedding.service.js';
import { ensureCollection, deleteRepoVectors, upsertChunks } from './vectorstore.service.js';

const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;
const MAX_FILES = 500;
const MAX_CHUNKS = 3000;

// Validate untrusted input and rebuild the clone URL ourselves,
// so nothing the user typed ever reaches `git clone` directly.
export function parseRepoUrl(repoUrl) {
  const match = GITHUB_URL_PATTERN.exec(String(repoUrl).trim());
  if (!match) {
    throw new Error('Only public https://github.com/<owner>/<repo> URLs are supported');
  }
  const [, owner, repo] = match;
  if (/^\.+$/.test(owner) || /^\.+$/.test(repo)) {
    throw new Error('Invalid repository name');
  }
  return {
    repoId: `${owner}/${repo}`.toLowerCase(),
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
  };
}

// Full pipeline: clone -> filter -> chunk -> embed -> store.
// onProgress(stage) lets a caller (e.g. a job worker) report status.
export async function ingestRepo(repoUrl, onProgress = () => {}) {
  const { repoId, cloneUrl } = parseRepoUrl(repoUrl);
  const startedAt = Date.now();
  let localPath;

  try {
    onProgress('cloning');
    localPath = await cloneRepo(cloneUrl);

    onProgress('filtering');
    const files = await listRelevantFiles(localPath);
    if (files.length === 0) {
      throw new Error('No ingestible files found in this repository');
    }
    if (files.length > MAX_FILES) {
      throw new Error(`Repository too large: ${files.length} files (limit ${MAX_FILES})`);
    }

    onProgress('chunking');
    const chunks = [];
    for (const file of files) chunks.push(...(await chunkFile(file)));
    if (chunks.length > MAX_CHUNKS) {
      throw new Error(`Repository too large: ${chunks.length} chunks (limit ${MAX_CHUNKS})`);
    }

    onProgress('embedding');
    const vectors = await embedDocuments(chunks.map((c) => c.content));

    onProgress('storing');
    await ensureCollection();
    await deleteRepoVectors(repoId); // re-ingest replaces old data, never duplicates it
    await upsertChunks(repoId, chunks, vectors);

    onProgress('done');
    return {
      repoId,
      files: files.length,
      chunks: chunks.length,
      seconds: Math.round((Date.now() - startedAt) / 1000),
    };
  } finally {
    if (localPath) await cleanupClone(localPath);
  }
}