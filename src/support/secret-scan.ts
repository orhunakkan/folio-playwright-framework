import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

/**
 * Looks for secret values in report files before they are uploaded or published. Reports hide much of their content
 * in zips: blob reports are zips, and the HTML report embeds its data as a base64 zip in index.html. So this reads
 * inside zips, at any depth, as well as plain files. It returns where each secret was found, never the value.
 */
export function findSecrets(paths: string[], secrets: { name: string; value: string }[]): { name: string; file: string }[] {
  const found: { name: string; file: string }[] = [];
  const needles = secrets.map(({ name, value }) => ({ name, value: Buffer.from(value) }));

  function scan(content: Buffer, file: string): void {
    for (const { name, value } of needles) if (content.includes(value)) found.push({ name, file });
    if (isZip(content)) {
      for (const entry of zipEntries(content)) scan(entry.content, `${file} → ${entry.name}`);
    }
    for (const match of content.toString('latin1').matchAll(/data:application\/zip;base64,([A-Za-z0-9+/=]+)/g)) {
      scan(Buffer.from(match[1] ?? '', 'base64'), `${file} → embedded zip`);
    }
  }

  for (const file of paths.flatMap(filesUnder)) scan(readFileSync(file), file);
  return found;
}

/** Every file under a path; a missing path has none. */
export function filesUnder(path: string): string[] {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    return [];
  }
  if (!stats.isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => filesUnder(join(path, name)));
}

function isZip(content: Buffer): boolean {
  return content.length >= 22 && content.readUInt32LE(0) === 0x04034b50;
}

/** A minimal zip reader (stored and deflated entries, no ZIP64): Node has no built-in one. */
function zipEntries(zip: Buffer): { name: string; content: Buffer }[] {
  // The end of central directory record is in the last 64 KiB + 22 bytes, after an optional comment.
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('Not a readable zip: no end of central directory');
  const count = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);

  const entries: { name: string; content: Buffer }[] = [];
  for (let index = 0; index < count; index++) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error('Not a readable zip: bad central directory');
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localHeader = zip.readUInt32LE(offset + 42);
    const name = zip.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (compressedSize === 0xffffffff || localHeader === 0xffffffff) throw new Error(`ZIP64 entry not supported: ${name}`);

    const dataStart = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
    const data = zip.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) entries.push({ name, content: data });
    else if (method === 8) entries.push({ name, content: inflateRawSync(data) });
    else throw new Error(`Zip compression method ${String(method)} not supported: ${name}`);

    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
