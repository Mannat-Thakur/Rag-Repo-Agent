import { randomUUID } from 'crypto';

// In-memory job store. Replaced by BullMQ + Redis in Phase 3,
// but the shape of a job stays the same.
const jobs = new Map();

export function createJob(repoUrl) {
  const job = {
    id: randomUUID(),
    repoUrl,
    status: 'queued', // queued | running | completed | failed
    stage: null,
    result: null,
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}

export function updateJob(id, patch) {
  Object.assign(jobs.get(id), patch);
}