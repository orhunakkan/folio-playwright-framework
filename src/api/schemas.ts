import { z } from 'zod';

/**
 * Zod schemas for the JSON Folio's own endpoints answer with, as dev sent it on 2026-11-11. They check the shape and
 * types, and allow extra fields: a field Folio adds doesn't break them, one it drops or changes does.
 */

const Timestamp = z.iso.datetime();
const Id = z.uuid();

/** Where a bookmark or highlight is, as Folio describes it back. */
const PlaceSchema = z.object({
  chapterIndex: z.number().int().nonnegative(),
  chapterTitle: z.string().min(1),
  chapter: z.string().regex(/^chapter-\d+$/),
  page: z.number().int().positive(),
  pageHref: z.string().startsWith('/read/'),
  /** As the reader shows it, e.g. `Ch. 1 · p. 1`. */
  label: z.string().min(1),
  position: z.number().int().nonnegative(),
});

export const HighlightColorSchema = z.enum(['yellow', 'green', 'blue', 'pink']);
export type HighlightColor = z.infer<typeof HighlightColorSchema>;

/** `POST /account/bookmarks/new` → 201. */
export const BookmarkCreatedSchema = z.object({
  bookmark: z.object({
    id: Id,
    status: z.literal('ok'),
    /** The start of the page's text. */
    opening: z.string(),
    place: PlaceSchema,
    createdAt: Timestamp,
  }),
});

/** `POST /account/highlights/new` → 201, and `POST /account/highlights/<id>` → 200. */
export const HighlightSavedSchema = z.object({
  highlight: z.object({
    id: Id,
    color: HighlightColorSchema,
    note: z.string().nullable(),
    text: z.string().min(1),
    status: z.literal('ok'),
    place: PlaceSchema.extend({
      href: z.string().startsWith('/read/'),
      start: z.number().int().nonnegative(),
      end: z.number().int().positive(),
    }),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
});

/** Removing a bookmark or highlight → 200. */
export const OkSchema = z.object({ ok: z.literal(true) });

/** `POST /account/sync` → 200. `skipped` counts places Folio didn't take, e.g. older than the one it has. */
export const SyncedSchema = z.object({ ok: z.literal(true), skipped: z.number().int().nonnegative() });

/** Folio's JSON error answers: 400 `invalid`, 401 `signed_out`, 404 `not_found`. */
export const ErrorSchema = z.object({ error: z.enum(['invalid', 'signed_out', 'not_found']) });

const BookRefSchema = z.object({ slug: z.string().min(1), title: z.string().min(1) });

/**
 * `GET /account/export` → 200: everything Folio holds about the account. It includes IP addresses (sessions and
 * activity), so a test never attaches or prints it.
 */
export const AccountExportSchema = z.object({
  format: z.literal('folio-account'),
  version: z.literal(1),
  exportedAt: Timestamp,
  site: z.url(),
  account: z.object({
    username: z.string().min(1),
    role: z.string().min(1),
    createdAt: Timestamp,
    email: z.string().nullable(),
  }),
  sessions: z.array(z.object({ device: z.string(), createdAt: Timestamp, expiresAt: Timestamp })),
  highlights: z.array(
    z.object({
      book: BookRefSchema,
      chapter: z.string(),
      page: z.number().int().positive(),
      text: z.string(),
      color: HighlightColorSchema,
      note: z.string().nullable(),
      createdAt: Timestamp,
      updatedAt: Timestamp,
    }),
  ),
  bookmarks: z.array(
    z.object({
      book: BookRefSchema,
      chapter: z.string(),
      page: z.number().int().positive(),
      text: z.string(),
      createdAt: Timestamp,
    }),
  ),
  readingPlaces: z.array(
    z.object({
      book: BookRefSchema,
      chapter: z.string(),
      page: z.number().int().positive(),
      at: Timestamp,
      device: z.string(),
    }),
  ),
});
export type AccountExport = z.infer<typeof AccountExportSchema>;

/** `GET /manifest.webmanifest` → 200: what a browser needs to install Folio as an app. */
export const ManifestSchema = z.object({
  name: z.literal('Folio'),
  short_name: z.string().min(1),
  start_url: z.string().startsWith('/'),
  scope: z.string().startsWith('/'),
  display: z.enum(['standalone', 'fullscreen', 'minimal-ui', 'browser']),
  icons: z
    .array(z.object({ src: z.string().startsWith('/'), sizes: z.string().regex(/^\d+x\d+$/), type: z.string() }))
    .min(1),
});
