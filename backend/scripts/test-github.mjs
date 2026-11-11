import { cloneRepo, listRelevantFiles, cleanupClone } from '../src/services/github.service.js';

const localPath = await cloneRepo('https://github.com/expressjs/express.git');
console.log('Cloned to:', localPath);

const files = await listRelevantFiles(localPath);
console.log('Relevant files:', files.length);
files.slice(0, 10).forEach(f => console.log(' -', f.relativePath));

await cleanupClone(localPath);
console.log('Cleaned up.');