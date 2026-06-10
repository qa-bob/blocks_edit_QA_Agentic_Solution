/**
 * tests/negative/routing.spec.ts
 *
 * Negative routing tests — verify the server correctly handles bad paths.
 * These tests assert error states, NOT success states.
 *
 * Tag: @negative
 */

import { test, expect } from '@fixtures/site.fixture';

// Paths that must not exist on blocksedit.com
const NONEXISTENT_PATHS = [
  '/this-page-does-not-exist-xyz',
  '/features/nonexistent-subpage',
  '/admin',
  '/wp-admin',
] as const;

test.describe('Routing — Negative @negative', () => {
  // ── 404 handling ─────────────────────────────────────────────────────────────

  test('non-existent page returns HTTP 404, not 200 @negative', async ({ page, siteConfig }) => {
    const url = siteConfig.url.replace(/\/$/, '') + '/this-page-does-not-exist-xyz';
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

    expect(response, 'Should receive a response for invalid path').not.toBeNull();
    expect(
      response!.status(),
      `Expected 404 for "${url}" but got HTTP ${response!.status()}`
    ).toBe(404);
  });

  test('404 page renders user-friendly content, not a blank page @negative', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url.replace(/\/$/, '') + '/this-page-does-not-exist-xyz', {
      waitUntil: 'domcontentloaded',
    });

    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    expect(
      bodyText.trim().length,
      '404 page body should not be blank — render a helpful error message'
    ).toBeGreaterThan(10);

    // Should not expose a raw server error stack trace
    expect(
      bodyText.toLowerCase(),
      '404 page should not expose a server-side stack trace'
    ).not.toContain('at object.<anonymous>');
    expect(
      bodyText.toLowerCase(),
      '404 page should not expose a raw 500 error message'
    ).not.toContain('internal server error');
  });

  test('404 page does not return HTTP 500 @negative', async ({ page, siteConfig }) => {
    const response = await page.goto(
      siteConfig.url.replace(/\/$/, '') + '/nonexistent-deep/path/xyz',
      { waitUntil: 'domcontentloaded' }
    );

    expect(response, 'Should receive a response').not.toBeNull();
    expect(
      response!.status(),
      'An unknown path should return 404, not a 500 server error'
    ).not.toBe(500);
  });

  test('homepage does not return a server error (5xx) @negative', async ({ page, siteConfig }) => {
    const response = await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(
      response!.status() < 500,
      `Homepage returned HTTP ${response!.status()} — server error`
    ).toBeTruthy();
  });

  // ── Known-bad paths that should not silently return 200 ───────────────────────

  for (const path of NONEXISTENT_PATHS) {
    test(`"${path}" does not return HTTP 200 @negative`, async ({ page, siteConfig }) => {
      const url = siteConfig.url.replace(/\/$/, '') + path;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

      expect(response, `No response for ${url}`).not.toBeNull();
      const status = response!.status();

      // A non-existent path returning 200 means the site is silently failing (common CMS bug)
      expect(
        status,
        `"${path}" returned HTTP 200 — site may be serving a catch-all page instead of a real 404`
      ).not.toBe(200);
    });
  }
});
