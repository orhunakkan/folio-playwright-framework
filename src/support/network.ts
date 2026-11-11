import type { Response } from '@playwright/test';

/** A `waitForResponse` predicate: a POST whose path matches `path` (a string matches exactly). */
export function isPostTo(path: string | RegExp): (response: Response) => boolean {
  return (response) => {
    if (response.request().method() !== 'POST') return false;
    const { pathname } = new URL(response.url());
    return typeof path === 'string' ? pathname === path : path.test(pathname);
  };
}
