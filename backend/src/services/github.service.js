import simpleGit from "simple-git";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { config } from "../config/env.js";

// Extensions we consider meaningful for a code/docs RAG system.
// Images, binaries, fonts etc. would waste embedding calls for zero retrieval value.
const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".go",
  ".rb",
  ".rs",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".json",
  ".yml",
  ".yaml",
]);

// Conventional files with no extension that are still meaningful.
// path.extname('README') returns '', so these are matched by exact name.
const ALLOWED_EXTENSIONLESS_NAMES = new Set([
  "README",
  "LICENSE",
  "CONTRIBUTING",
  "CHANGELOG",
  "Dockerfile",
  "Makefile",
]);

// Folders that are never useful to ingest.
const IGNORED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "vendor",
  "__pycache__",
  ".venv",
  "coverage",
]);

// Lockfiles are allowed by extension (.json/.yaml) but are pure noise.
const IGNORED_FILE_NAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

// Anything larger is likely generated or data, not hand-written source.
const MAX_FILE_SIZE_BYTES = 200 * 1024;

/**
 * Shallow-clones a public GitHub repo into a unique temp directory.
 * Returns the local path where it was cloned.
 */
export async function cloneRepo(repoUrl) {
  const cloneId = randomUUID();
  const targetDir = path.resolve(config.tmpCloneDir, cloneId);

  await fs.mkdir(targetDir, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, targetDir, ["--depth", "1"]);

  return targetDir;
}

/**
 * Walks a cloned repo and returns the files worth ingesting,
 * filtered by extension, ignored folders, ignored filenames and size.
 * relativePath is kept for citations later.
 */
export async function listRelevantFiles(rootDir) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIR_NAMES.has(entry.name)) continue;
        await walk(path.join(currentDir, entry.name));
        continue;
      }

      if (IGNORED_FILE_NAMES.has(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
      const isAllowedExtensionless =
        ext === "" && ALLOWED_EXTENSIONLESS_NAMES.has(entry.name);
      if (!isAllowedExt && !isAllowedExtensionless) continue;

      const fullPath = path.join(currentDir, entry.name);
      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE_BYTES) continue;

      results.push({
        relativePath: path
          .relative(rootDir, fullPath)
          .split(path.sep)
          .join("/"),
        fullPath,
        sizeBytes: stat.size,
      });
    }
  }

  await walk(rootDir);
  return results;
}

/**
 * Deletes the temp clone once ingestion is done.
 */
export async function cleanupClone(localPath) {
  await fs.rm(localPath, { recursive: true, force: true });
}
