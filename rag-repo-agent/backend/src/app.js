import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rag-repo-agent-backend' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});