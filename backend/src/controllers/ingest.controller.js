import { ingestRepo, parseRepoUrl, IngestError } from '../services/ingest.service.js';
import { createJob, getJob, updateJob } from '../services/jobstore.service.js';

export function startIngest(req, res) {
  const { repoUrl } = req.body ?? {};

  // fail fast with a 400 before creating any job
  try {
    parseRepoUrl(repoUrl);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const job = createJob(repoUrl);
  res.status(202).json({ jobId: job.id, status: job.status });

  // fire and forget: the HTTP response has already been sent
  updateJob(job.id, { status: 'running' });
  ingestRepo(repoUrl, (stage) => updateJob(job.id, { stage }))
    .then((result) => updateJob(job.id, { status: 'completed', stage: 'done', result }))
    .catch((err) => {
      console.error(`Ingestion failed for job ${job.id}:`, err);
      const message =
        err instanceof IngestError ? err.message : 'Ingestion failed due to an internal error';
      updateJob(job.id, { status: 'failed', error: message });
    });
}

export function getIngestStatus(req, res) {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { id, status, stage, result, error } = job;
  res.json({ jobId: id, status, stage, result, error });
}