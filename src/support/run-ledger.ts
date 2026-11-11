import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUN_ID } from '../config/run.ts';

/**
 * Which test users each run still has on dev: one empty file per user, in `playwright/.runs/<run ID>/`.
 * A user is recorded when it is created and forgotten when it is deleted, so whatever is left is what a run left
 * behind. One file per user means parallel workers never write to the same file.
 *
 * Kept outside `test-results/`, which Playwright empties at the start of every run.
 */
const LEDGER_DIR = fileURLToPath(new URL('../../playwright/.runs/', import.meta.url));

/** A usable file name, and nothing else: test API usernames are `e2e-<hex>`. */
const SAFE_NAME = /^[\w-]+$/;

function runDir(runId: string): string {
  if (!SAFE_NAME.test(runId)) throw new Error(`Not a run ID: "${runId}"`);
  return join(LEDGER_DIR, runId);
}

function userFile(runId: string, username: string): string {
  if (!SAFE_NAME.test(username)) throw new Error(`Not a test username: "${username}"`);
  return join(runDir(runId), username);
}

export function recordUser(username: string): void {
  mkdirSync(runDir(RUN_ID), { recursive: true });
  writeFileSync(userFile(RUN_ID, username), '');
}

export function forgetUser(username: string, runId = RUN_ID): void {
  rmSync(userFile(runId, username), { force: true });
}

/** The users a run created and hasn't deleted. */
export function leftoverUsers(runId = RUN_ID): string[] {
  try {
    return readdirSync(runDir(runId));
  } catch {
    return [];
  }
}

/** Removes a run's ledger once its users are all deleted. */
export function closeRun(runId = RUN_ID): void {
  rmSync(runDir(runId), { recursive: true, force: true });
}

/**
 * Earlier runs on this machine whose ledgers were last touched more than `olderThanMs` ago: runs that were
 * interrupted before their teardown. A run still in progress touches its ledger with every user, so it isn't listed.
 */
export function staleRuns(olderThanMs: number): string[] {
  let runs: string[];
  try {
    runs = readdirSync(LEDGER_DIR);
  } catch {
    return [];
  }
  const cutoff = Date.now() - olderThanMs;
  return runs.filter((run) => run !== RUN_ID && statSync(join(LEDGER_DIR, run)).mtimeMs < cutoff);
}
