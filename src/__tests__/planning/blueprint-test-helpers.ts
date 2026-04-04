import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function resolveLeaderRepoRoot() {
  const explicitRoot = process.env.OMX_LEADER_CWD ?? process.env.OMX_REPO_ROOT;

  if (explicitRoot && existsSync(path.join(explicitRoot, '.omx', 'plans'))) {
    return explicitRoot;
  }

  try {
    const commonGitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
    const repoRootFromCommonDir = path.resolve(commonGitDir, '..');

    if (existsSync(path.join(repoRootFromCommonDir, '.omx', 'plans'))) {
      return repoRootFromCommonDir;
    }
  } catch {
    // Fall through to local upward search.
  }

  let cursor = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(path.join(cursor, '.omx', 'plans'))) {
      return cursor;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) {
      break;
    }
    cursor = parent;
  }

  throw new Error('Unable to resolve repository root containing .omx/plans');
}

export const repoRoot = resolveLeaderRepoRoot();
export const plansDir = path.join(repoRoot, '.omx', 'plans');
export const specsDir = path.join(repoRoot, '.omx', 'specs');

export const artifactPaths = {
  prd: path.join(plansDir, 'prd-complete-care-master-blueprint-2026-04-04.md'),
  roadmap: path.join(plansDir, 'roadmap-complete-care-master-blueprint-2026-04-04.md'),
  testSpec: path.join(plansDir, 'test-spec-complete-care-master-blueprint-2026-04-04.md'),
  gapMatrix: path.join(plansDir, 'platform-feature-gap-matrix-2026-04-04.md'),
  deepInterviewSpec: path.join(specsDir, 'deep-interview-scheduling-complex-care-master-blueprint.md'),
} as const;

export type ArtifactKey = keyof typeof artifactPaths;

export function readArtifact(key: ArtifactKey) {
  return readFileSync(artifactPaths[key], 'utf8');
}

export function readProjectFile(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}
