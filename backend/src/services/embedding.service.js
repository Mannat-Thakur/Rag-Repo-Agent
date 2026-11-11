import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const BATCH_SIZE = 50;
const MAX_RETRIES = 4;

if (!config.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env');
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One API call for a batch of texts, retried with exponential
// backoff (1s, 2s, 4s, 8s) so a rate-limit blip doesn't kill ingestion.
async function embedBatch(texts, taskType) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType },
      });
      return response.embeddings.map((e) => e.values);
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

// Embed many chunk texts. Returns one vector per input, same order.
export async function embedDocuments(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    vectors.push(...(await embedBatch(batch, 'RETRIEVAL_DOCUMENT')));
  }
  return vectors;
}

// Embed one user question for retrieval.
export async function embedQuery(text) {
  const [vector] = await embedBatch([text], 'RETRIEVAL_QUERY');
  return vector;
}