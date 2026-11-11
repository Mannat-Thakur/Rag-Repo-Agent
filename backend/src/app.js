import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import ingestRoutes from './routes/ingest.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rag-repo-agent-backend' });
});

app.use('/ingest', ingestRoutes);

app.listen(config.port, (err) => {
  if (err) {
    console.error(`Failed to start server on port ${config.port}:`, err.message);
    process.exit(1);
  }
  console.log(`Server running on port ${config.port}`);
});