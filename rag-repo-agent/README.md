# RAG Repo Agent

Chat with any public GitHub repository. Paste a repo URL, and ask questions
about its code, docs, and architecture — answers are grounded in the actual
repo content, with citations back to the exact file and line.

Unlike a static-dataset RAG demo, this system ingests **any** repository on
demand: cloning it, chunking its code and docs in a structure-aware way
(not naive fixed-size splitting), embedding those chunks, and retrieving
the most relevant ones at query time to ground the LLM's answer.

## Why this exists

Most RAG demos answer questions over one fixed dataset. This project treats
repo ingestion as a first-class, dynamic pipeline — solving problems like:
code-aware chunking (splitting by function/class instead of arbitrary
character counts), multi-tenant vector storage (many users, many repos,
no cross-contamination), and background job processing for ingestion,
which can take anywhere from seconds to minutes depending on repo size.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full design,
including the ingestion pipeline, chunking strategy, and agent tool-use
loop.

## Status

🚧 Actively being built. Ingestion pipeline in progress.

## Tech Stack

- **Backend:** Node.js, Express, BullMQ + Redis (background ingestion jobs)
- **Vector store:** Qdrant
- **Embeddings & generation:** Gemini
- **Database:** MongoDB (repo metadata, chat history)
- **Frontend:** React + Vite
- **Infra:** Docker, Docker Compose

## Local development

Setup instructions will be added once the backend skeleton is running.
