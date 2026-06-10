/**
 * tests/functional/homepage.spec.ts
 *
 * Functional tests for the Blocks Edit homepage.
 * Verifies hero content, CTAs, feature sections, and nav auth links.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Homepage Functional @functional', () => {
  // homePage fixture auto-navigates to the root URL
  test('hero H1 heading is present @functional', async ({ homePage }) => {
    const heading = await homePage.getMainHeading();
    expect(heading.length, 'Homepage should have a non-empty H1 heading').toBeGreaterThan(0);
  });

  test('hero heading contains expected product copy @functional', async ({ homePage }) => {
    const heading = await homePage.getMainHeading();
    expect(
      heading.toLowerCase(),
      `H1 "${heading}" should reference content creation or editing`
    ).toMatch(/content|edit|creat/i);
  });

  test('primary CTA button is visible @functional', async ({ homePage }) => {
    const ctaButtons = await homePage.getCTAButtons();
    expect(
      ctaButtons.length,
      'At least one primary CTA button should be visible on the homepage'
    ).toBeGreaterThan(0);
  });

  test('primary CTA links to the app signup @functional', async ({ homePage, siteConfig }) => {
    const ctaButtons = await homePage.getCTAButtons();
    expect(ctaButtons.length, 'No CTA buttons found').toBeGreaterThan(0);

    // At least one CTA should point to the signup page
    let signupLinkFound = false;
    for (const btn of ctaButtons) {
      const href = await btn.getAttribute('href');
      if (href && href.includes('signup')) {
        signupLinkFound = true;
        break;
      }
    }

    expect(
      signupLinkFound,
      'At least one CTA button should link to the signup URL (href containing "signup")'
    ).toBeTruthy();
  });

  test('homepage is fully loaded with headings and navigation @functional', async ({ homePage }) => {
    const loaded = await homePage.isLoaded();
    expect(loaded, 'homePage.isLoaded() should return true when page renders correctly').toBeTruthy();
  });

  test('feature highlight sections are present on homepage @functional', async ({ homePage }) => {
    const h2Count = await homePage.page.locator('h2').count();
    expect(
      h2Count,
      'Homepage should have multiple H2 feature section headings'
    ).toBeGreaterThan(2);
  });

  test('sign-in link targets the app subdomain @functional', async ({ homePage }) => {
    const signInLink = homePage.page
      .getByRole('link', { name: /sign in/i })
      .first();

    if (await signInLink.count() === 0) {
      console.warn('[functional] No "Sign in" link found on homepage — skipping.');
      return;
    }

    const href = await signInLink.getAttribute('href');
    expect(href, 'Sign in link should have an href').not.toBeNull();
    expect(
      href,
      `Sign in href "${href}" should point to app.blocksedit.com`
    ).toContain('app.blocksedit.com');
  });

  test('footer contains essential navigation links @functional', async ({ homePage }) => {
    const footer = homePage.page.locator('footer').first();

    if (await footer.count() === 0) {
      console.warn('[functional] No <footer> found — skipping footer link check.');
      return;
    }

    const footerLinks = await footer.locator('a[href]').all();
    expect(
      footerLinks.length,
      'Footer should contain at least 5 navigation links'
    ).toBeGreaterThanOrEqual(5);
  });

  test('page has a canonical nav with expected items @functional', async ({ homePage, siteConfig }) => {
    const navLinks = homePage.page
      .locator('nav, [role="navigation"]')
      .first()
      .locator('a[href]');

    const count = await navLinks.count();
    expect(count, 'Primary navigation should have at least 3 links').toBeGreaterThanOrEqual(3);

    // If config declares expected nav items, verify each is present
    if (siteConfig.expectedNavItems.length > 0) {
      for (const label of siteConfig.expectedNavItems) {
        // Use locator+filter instead of getByRole so hidden (CSS-collapsed) links
        // on mobile viewports are still matched — getByRole only finds visible roles.
        const link = homePage.page
          .locator('nav, [role="navigation"]')
          .first()
          .locator('a')
          .filter({ hasText: new RegExp(label, 'i') });
        expect(
          await link.count(),
          `Nav item "${label}" (from site.config.json) not found in navigation`
        ).toBeGreaterThan(0);
      }
    }
  });
});
