# Architecture

## Overview

_(Diagram to be added once ingestion + retrieval flow is implemented.)_

## Components

### 1. Repo Ingestion Service
_Status: not yet implemented._
Fetches a GitHub repo's content, filters out non-meaningful files
(binaries, lockfiles, `node_modules`), and prepares raw text for chunking.

### 2. Chunking Layer
_Status: not yet implemented._
Splits markdown/docs by structure (headers, paragraphs). Splits code by
function/class boundaries rather than fixed character counts, to avoid
cutting logical units in half.

### 3. Embedding + Vector Store
_Status: not yet implemented._
Each chunk is embedded and stored in Qdrant with metadata
(`repo_url`, `file_path`, `line_start`, `line_end`) for citation and
per-repo scoping.

### 4. Retrieval + Agent Layer
_Status: not yet implemented._
Retrieves top-k relevant chunks for a query, and gives the LLM at least
one callable tool (e.g. fetch full file, list repo structure) so it can
pull more context when retrieval alone isn't enough.

## Design decisions

_(This section will document each non-obvious choice as we make it —
e.g. why Qdrant over Pinecone, chunk size/overlap chosen, why BullMQ for
ingestion jobs. Filling this in as we go, not after the fact, so the
reasoning stays accurate.)_

## Evaluation

_(Retrieval quality and latency numbers will go here once the pipeline
is working end to end — see `docs/evaluation.md`.)_
