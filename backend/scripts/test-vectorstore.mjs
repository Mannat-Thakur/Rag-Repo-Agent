import { cloneRepo, listRelevantFiles, cleanupClone } from '../src/services/github.service.js';
import { chunkFile } from '../src/services/chunking.service.js';
import { embedDocuments, embedQuery } from '../src/services/embedding.service.js';
import {
  ensureCollection,
  deleteRepoVectors,
  upsertChunks,
  searchChunks,
} from '../src/services/vectorstore.service.js';

const REPO_ID = 'expressjs/express';

const localPath = await cloneRepo('https://github.com/expressjs/express.git');
const files = await listRelevantFiles(localPath);
const subset = files.filter(
  (f) => f.relativePath === 'Readme.md' || f.relativePath === 'lib/application.js'
);

const chunks = [];
for (const file of subset) chunks.push(...(await chunkFile(file)));
console.log('Chunks to embed:', chunks.length);

const vectors = await embedDocuments(chunks.map((c) => c.content));

await ensureCollection();
await deleteRepoVectors(REPO_ID);
await upsertChunks(REPO_ID, chunks, vectors);
console.log('Stored', chunks.length, 'chunks in Qdrant');

const question = 'How does the app start listening for connections?';
const queryVector = await embedQuery(question);
const results = await searchChunks(REPO_ID, queryVector, 3);

console.log('\nQuestion:', question);
for (const r of results) {
  console.log(`\nscore ${r.score.toFixed(4)}  ${r.relativePath}:${r.startLine}-${r.endLine}`);
  console.log(r.content.slice(0, 200).replace(/\n/g, ' '));
}

const other = await searchChunks('some-other/repo', queryVector, 3);
console.log('\nResults for a different repoId:', other.length);

await cleanupClone(localPath);