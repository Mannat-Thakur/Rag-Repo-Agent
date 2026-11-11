import { Router } from 'express';
import { startIngest, getIngestStatus } from '../controllers/ingest.controller.js';

const router = Router();

router.post('/', startIngest);
router.get('/:jobId', getIngestStatus);

export default router;