import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../src/config/env.js';

const client = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey,
});

const { collections } = await client.getCollections();
console.log('Connected. Collections:', collections.map((c) => c.name));