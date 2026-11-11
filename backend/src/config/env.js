import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  tmpCloneDir: process.env.TMP_CLONE_DIR || './tmp/cloned-repos',
  geminiApiKey: process.env.GEMINI_API_KEY,
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY,
  mongodbUri: process.env.MONGODB_URI,
};