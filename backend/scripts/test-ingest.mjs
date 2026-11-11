import { ingestRepo, parseRepoUrl } from '../src/services/ingest.service.js';
import { embedQuery } from '../src/services/embedding.service.js';
import { searchChunks } from '../src/services/vectorstore.service.js';

// 1) input validation must reject unsafe URLs
for (const bad of ['file:///etc/passwd', 'https://example.com/a/b', 'https://github.com/../x']) {
  try {
    parseRepoUrl(bad);
    console.log('NOT REJECTED (bug):', bad);
  } catch (err) {
    console.log('rejected:', bad, '->', err.message);
  }
}

// 2) real ingestion of this project's own repo
const result = await ingestRepo(
  'https://github.com/Mannat-Thakur/Rag-Repo-Agent',
  (stage) => console.log('stage:', stage)
);
console.log(result);

// 3) ask it a question about itself
const question = 'How are repository files filtered before ingestion?';
const results = await searchChunks(result.repoId, await embedQuery(question), 3);
console.log('\nQuestion:', question);
for (const r of results) {
  console.log(`${r.score.toFixed(4)}  ${r.relativePath}:${r.startLine}-${r.endLine}`);
}