/**
 * tests/functional/features.spec.ts
 *
 * Functional tests for the /features/ page.
 * Verifies all feature sections are present and the CTA leads to signup.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

// Features discovered from live site inspection (blocksedit.com/features/)
const EXPECTED_FEATURES = [
  'Build and edit visually',
  'Fully customizable editing',
  'Reuse templates',
  'Pin content',
  'Automated image options',
  'Build custom forms',
  'Feedback comments',
  'Helpful content tooltips',
  'Keep a checklist',
  'Revision history',
  'Use your own host',
] as const;

test.describe('Features Page @functional', () => {
  test.beforeEach(async ({ featuresPage }) => {
    await featuresPage.navigate();
  });

  test('features page loads with H1 heading @functional', async ({ featuresPage }) => {
    const loaded = await featuresPage.isLoaded();
    expect(loaded, 'Features page should load and display a heading').toBeTruthy();
  });

  test('features page H1 references editing @functional', async ({ featuresPage }) => {
    const heading = await featuresPage.getHeading();
    expect(heading.length, 'H1 should not be empty').toBeGreaterThan(0);
    expect(
      heading.toLowerCase(),
      `H1 "${heading}" should reference editing or content`
    ).toMatch(/edit|content|flexible/i);
  });

  test('page lists at least 8 feature sections @functional', async ({ featuresPage }) => {
    const names = await featuresPage.getFeatureNames();
    expect(
      names.length,
      `Expected at least 8 feature H2s, found ${names.length}: ${names.join(', ')}`
    ).toBeGreaterThanOrEqual(8);
  });

  for (const feature of EXPECTED_FEATURES) {
    test(`feature section "${feature}" is present @functional`, async ({ featuresPage }) => {
      const allFeatures = await featuresPage.getFeatureNames();
      const found = allFeatures.some((f) =>
        f.toLowerCase().includes(feature.toLowerCase())
      );
      expect(
        found,
        `Feature section "${feature}" not found. Available sections: ${allFeatures.join(', ')}`
      ).toBeTruthy();
    });
  }

  test('features page has a signup CTA @functional', async ({ featuresPage }) => {
    expect(
      await featuresPage.ctaLink.count(),
      'A "Use Blocks Edit for free" or "Sign up free" link should be on the features page'
    ).toBeGreaterThan(0);
  });

  test('features page CTA links to signup @functional', async ({ featuresPage }) => {
    const count = await featuresPage.ctaLink.count();
    test.skip(count === 0, 'No CTA link found on features page');
    const href = await featuresPage.ctaLink.getAttribute('href');
    expect(href, 'CTA href should not be null').not.toBeNull();
    // Accept /pricing/ as a valid CTA destination — some viewports route via pricing before signup
    expect(href, `CTA href "${href}" should point to signup or pricing`).toMatch(/signup|pricing/i);
  });
});
