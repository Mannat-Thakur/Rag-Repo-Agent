import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import { config } from '../config/env.js';

const COLLECTION_NAME = 'repo_chunks';
const VECTOR_SIZE = 3072; // must equal gemini-embedding-001's output length
const UPSERT_BATCH_SIZE = 64;

const client = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey,
});

const repoFilter = (repoId) => ({
  must: [{ key: 'repoId', match: { value: repoId } }],
});

// Create the collection (and the repoId index) if it doesn't exist yet.
// Safe to call on every ingestion.
export async function ensureCollection() {
  const { collections } = await client.getCollections();
  if (collections.some((c) => c.name === COLLECTION_NAME)) return;

  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
  });

  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: 'repoId',
    field_schema: 'keyword',
    wait: true,
  });
}

// Remove every stored chunk for one repo (used before re-ingesting it).
export async function deleteRepoVectors(repoId) {
  await client.delete(COLLECTION_NAME, {
    wait: true,
    filter: repoFilter(repoId),
  });
}

// Store chunks + their vectors. chunks[i] must correspond to vectors[i].
export async function upsertChunks(repoId, chunks, vectors) {
  if (chunks.length !== vectors.length) {
    throw new Error(
      `Chunk/vector count mismatch: ${chunks.length} chunks, ${vectors.length} vectors`
    );
  }
  if (vectors.length > 0 && vectors[0].length !== VECTOR_SIZE) {
    throw new Error(
      `Vector size ${vectors[0].length} does not match collection size ${VECTOR_SIZE}`
    );
  }

  for (let i = 0; i < chunks.length; i += UPSERT_BATCH_SIZE) {
    const points = chunks.slice(i, i + UPSERT_BATCH_SIZE).map((chunk, j) => ({
      id: randomUUID(),
      vector: vectors[i + j],
      payload: {
        repoId,
        content: chunk.content,
        ...chunk.metadata, // relativePath, chunkIndex, startLine, endLine
      },
    }));
    await client.upsert(COLLECTION_NAME, { wait: true, points });
  }
}

// Find the chunks closest in meaning to the query vector, within one repo.
export async function searchChunks(repoId, queryVector, limit = 5) {
  const result = await client.query(COLLECTION_NAME, {
    query: queryVector,
    limit,
    filter: repoFilter(repoId),
    with_payload: true,
  });
  return result.points.map((p) => ({ score: p.score, ...p.payload }));
}