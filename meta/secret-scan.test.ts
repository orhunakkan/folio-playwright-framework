// The secret scan (src/support/secret-scan.ts) must find a secret wherever a report can hide one.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { deflateRawSync } from 'node:zlib';
import { findSecrets } from '../src/support/secret-scan.ts';

const SECRETS = [{ name: 'PLACEHOLDER_TOKEN', value: 'placeholder-token-1234' }];
const dir = mkdtempSync(join(tmpdir(), 'secret-scan-'));
after(() => {
  rmSync(dir, { recursive: true });
});

/** A zip with one entry per file, deflated or stored, as Playwright's reports are. */
function zip(files: Record<string, string | Buffer>, deflate = true): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const raw = Buffer.from(content);
    const data = deflate ? deflateRawSync(raw) : raw;
    const nameBytes = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralSize = centrals.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

function write(name: string, content: string | Buffer): string {
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

const leak = `Authorization: Bearer ${SECRETS[0]?.value ?? ''}`;

test('finds a secret in a plain file', () => {
  const file = write('plain.md', leak);
  assert.deepEqual(findSecrets([file], SECRETS), [{ name: 'PLACEHOLDER_TOKEN', file }]);
});

test('finds a secret in a deflated or stored zip entry, as in a blob report', () => {
  const deflated = write('deflated.zip', zip({ 'report.jsonl': leak }));
  const stored = write('stored.zip', zip({ 'report.jsonl': leak }, false));
  assert.deepEqual(findSecrets([deflated, stored], SECRETS), [
    { name: 'PLACEHOLDER_TOKEN', file: `${deflated} → report.jsonl` },
    // A stored entry is uncompressed, so the zip's own bytes hold the secret too.
    { name: 'PLACEHOLDER_TOKEN', file: stored },
    { name: 'PLACEHOLDER_TOKEN', file: `${stored} → report.jsonl` },
  ]);
});

test('finds a secret in a zip inside a zip, as a trace inside a report', () => {
  const file = write('nested.zip', zip({ 'trace.zip': zip({ 'trace.network': leak }) }));
  assert.deepEqual(findSecrets([file], SECRETS), [
    { name: 'PLACEHOLDER_TOKEN', file: `${file} → trace.zip → trace.network` },
  ]);
});

test("finds a secret in the HTML report's embedded base64 zip", () => {
  const embedded = zip({ 'report.json': leak }).toString('base64');
  const file = write(
    'index.html',
    `<template id="playwrightReportBase64">data:application/zip;base64,${embedded}</template>`,
  );
  assert.deepEqual(findSecrets([file], SECRETS), [
    { name: 'PLACEHOLDER_TOKEN', file: `${file} → embedded zip → report.json` },
  ]);
});

test('finds nothing in files without secrets, and in a missing folder', () => {
  const file = write('clean.zip', zip({ 'report.jsonl': 'Authorization: [redacted]' }));
  assert.deepEqual(findSecrets([file, join(dir, 'missing')], SECRETS), []);
});
