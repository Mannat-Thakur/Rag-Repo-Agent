import { embedDocuments, embedQuery } from '../src/services/embedding.service.js';

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const docs = [
  'The login middleware verifies the JWT token before allowing access.',
  'Bake the cake at 180 degrees for 30 minutes until golden.',
];
const question = 'How does user authentication work?';

const docVectors = await embedDocuments(docs);
const queryVector = await embedQuery(question);

console.log('Vector length:', queryVector.length);
console.log('Question vs auth chunk:', cosine(queryVector, docVectors[0]).toFixed(4));
console.log('Question vs cake chunk:', cosine(queryVector, docVectors[1]).toFixed(4));