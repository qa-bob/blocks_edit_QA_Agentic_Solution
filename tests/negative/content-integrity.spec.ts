/**
 * tests/negative/content-integrity.spec.ts
 *
 * Negative content integrity tests — verify that published pages contain no
 * placeholder text, broken images, empty headings, or developer artifacts.
 *
 * Tag: @negative
 */

import { test, expect } from '@fixtures/site.fixture';

// Pages checked for content integrity
const PAGES_TO_CHECK = [
  { name: 'Homepage', path: '' },
  { name: 'Features', path: '/features/' },
  { name: 'Pricing', path: '/pricing/' },
  { name: 'Integrations', path: '/integrations/' },
] as const;

// Strings that must never appear in production page content
const FORBIDDEN_STRINGS = [
  'lorem ipsum',
  'todo:',
  'fixme:',
  '[placeholder]',
  '[insert',
  'coming soon placeholder',
  'under construction',
  'your company name',
] as const;

test.describe('Content Integrity — Negative @negative', () => {
  // ── Placeholder / dev-artifact text ──────────────────────────────────────────

  for (const pg of PAGES_TO_CHECK) {
    test(`"${pg.name}" page has no Lorem Ipsum placeholder text @negative`, async ({
      page,
      siteConfig,
    }) => {
      const url = siteConfig.url.replace(/\/$/, '') + pg.path;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const bodyText = await page.evaluate<string>(() => document.body.innerText.toLowerCase());
      expect(
        bodyText,
        `"${pg.name}" contains "lorem ipsum" — placeholder text was not replaced before publish`
      ).not.toContain('lorem ipsum');
    });
  }

  for (const forbidden of FORBIDDEN_STRINGS) {
    test(`homepage does not contain developer artifact "${forbidden}" @negative`, async ({
      page,
      siteConfig,
    }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      const bodyText = await page.evaluate<string>(() => document.body.innerText.toLowerCase());
      expect(
        bodyText,
        `Homepage contains "${forbidden}" — this looks like unpublished placeholder content`
      ).not.toContain(forbidden.toLowerCase());
    });
  }

  // ── Broken images ─────────────────────────────────────────────────────────────

  for (const pg of PAGES_TO_CHECK) {
    test(`"${pg.name}" page has no broken images @negative`, async ({ page, siteConfig }) => {
      const url = siteConfig.url.replace(/\/$/, '') + pg.path;
      await page.goto(url, { waitUntil: 'load' });

      const brokenImages = await page.evaluate<string[]>(() => {
        return Array.from(document.querySelectorAll('img'))
          .filter((img) => {
            // Skip images that haven't started loading yet
            if (!img.complete) return false;
            // Skip data URIs (inline SVG etc.)
            if (img.src.startsWith('data:')) return false;
            // naturalWidth === 0 on a completed image means it failed to load
            return img.naturalWidth === 0 && img.src.length > 0;
          })
          .map((img) => img.src);
      });

      expect(
        brokenImages,
        `"${pg.name}" has ${brokenImages.length} broken image(s):\n${brokenImages.join('\n')}`
      ).toHaveLength(0);
    });
  }

  // ── Empty headings ────────────────────────────────────────────────────────────

  for (const pg of PAGES_TO_CHECK) {
    test(`"${pg.name}" page has no empty H1 or H2 tags @negative`, async ({ page, siteConfig }) => {
      const url = siteConfig.url.replace(/\/$/, '') + pg.path;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const emptyHeadings = await page.evaluate<string[]>(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2'));
        return headings
          .filter((h) => (h.textContent ?? '').trim().length === 0)
          .map((h) => h.tagName);
      });

      expect(
        emptyHeadings,
        `"${pg.name}" has ${emptyHeadings.length} empty heading tag(s): ${emptyHeadings.join(', ')}`
      ).toHaveLength(0);
    });
  }

  // ── Meta tag integrity ────────────────────────────────────────────────────────

  test('page title is not a generic CMS default @negative', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    const title = (await page.title()).toLowerCase().trim();

    const genericTitles = ['untitled', 'new page', 'home page', 'page title', 'default title'];
    for (const generic of genericTitles) {
      expect(
        title,
        `Page title "${title}" looks like an unpublished CMS default`
      ).not.toBe(generic);
    }
    expect(title.length, 'Page title should not be empty').toBeGreaterThan(3);
  });

  test('meta description does not contain placeholder text @negative', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const metaDesc = await page
      .locator('meta[name="description"]')
      .getAttribute('content');

    if (!metaDesc) return; // Absence of meta desc is covered by smoke tests

    const lower = metaDesc.toLowerCase();
    expect(lower, 'Meta description should not contain "lorem ipsum"').not.toContain('lorem ipsum');
    expect(lower, 'Meta description should not be a placeholder').not.toContain('[description]');
    expect(lower, 'Meta description should not reference "example.com"').not.toContain('example.com');
  });

  // ── Duplicate H1 ─────────────────────────────────────────────────────────────

  for (const pg of PAGES_TO_CHECK) {
    test(`"${pg.name}" page does not have more than one H1 @negative`, async ({ page, siteConfig }) => {
      const url = siteConfig.url.replace(/\/$/, '') + pg.path;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const h1Count = await page.locator('h1').count();
      expect(
        h1Count,
        `"${pg.name}" has ${h1Count} H1 tags — SEO best practice is exactly one H1 per page`
      ).toBeLessThanOrEqual(1);
    });
  }
});
