import { cloneRepo, listRelevantFiles, cleanupClone } from '../src/services/github.service.js';
import { chunkFile } from '../src/services/chunking.service.js';

const localPath = await cloneRepo('https://github.com/expressjs/express.git');
const files = await listRelevantFiles(localPath);

const targets = [
  files.find(f => f.relativePath.toLowerCase().startsWith('readme')),
  files.find(f => f.relativePath === 'lib/application.js'),
];

for (const file of targets) {
  const chunks = await chunkFile(file);
  const sizes = chunks.map(c => c.content.length);
  console.log(`\n${file.relativePath}`);
  console.log('  chunks:', chunks.length);
  console.log('  size range:', Math.min(...sizes), '-', Math.max(...sizes));
  console.log('  first chunk metadata:', chunks[0].metadata);
}

await cleanupClone(localPath);