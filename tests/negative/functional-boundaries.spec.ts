/**
 * tests/negative/functional-boundaries.spec.ts
 *
 * Negative functional boundary tests — verify the site does NOT cross
 * business-logic lines: plans don't bleed pricing, CTAs go to correct
 * destinations, coming-soon features aren't presented as available.
 *
 * Tag: @negative
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Functional Boundaries — Negative @negative', () => {
  // ── Pricing plan isolation ────────────────────────────────────────────────────

  test('free plan section does NOT display the $25 paid price @negative', async ({ pricingPage }) => {
    await pricingPage.navigate();

    // Locate the Solo Editing card specifically — exclude containers that also contain
    // sibling plan text ("collaborate"), which would match a parent wrapping all plans.
    const freePlanSection = pricingPage.page
      .locator('*')
      .filter({ hasText: /solo editing/i })
      .filter({ hasNotText: /collaborate/i })
      .first();

    test.skip(await freePlanSection.count() === 0, 'Could not isolate free plan section');

    const sectionText = await freePlanSection.textContent() ?? '';

    // The free plan section should advertise $0, not the Collaborate plan's $25
    expect(
      sectionText,
      'Free plan section should not contain "$25" (that belongs to the Collaborate plan)'
    ).not.toContain('$25');
  });

  test('pricing page does NOT contain a credit card input field @negative', async ({ pricingPage }) => {
    await pricingPage.navigate();

    const cardFields = pricingPage.page.locator(
      'input[name*="card" i], input[name*="credit" i], input[name*="cvv" i], ' +
      'input[placeholder*="card number" i], input[placeholder*="cvv" i]'
    );

    expect(
      await cardFields.count(),
      'Pricing page should not have a payment card input — billing happens after signup in the app'
    ).toBe(0);
  });

  test('pricing page does NOT have a payment form @negative', async ({ pricingPage }) => {
    await pricingPage.navigate();

    // A <form> on the pricing page should not be a payment form
    const forms = await pricingPage.page.locator('form').all();
    for (const form of forms) {
      const action = (await form.getAttribute('action') ?? '').toLowerCase();
      expect(
        action,
        `Form action "${action}" looks like a payment endpoint — billing should be handled post-signup`
      ).not.toMatch(/pay|stripe|charge|checkout|billing/i);
    }
  });

  // ── CTA destination integrity ─────────────────────────────────────────────────

  test('primary signup CTA does NOT link to the contact page @negative', async ({ homePage, siteConfig }) => {
    const ctaButtons = await homePage.getCTAButtons();
    const contactUrl = siteConfig.url.replace(/\/$/, '') + '/contact';

    for (const btn of ctaButtons) {
      const href = await btn.getAttribute('href');
      if (!href) continue;

      const resolved = new URL(href, siteConfig.url).toString();
      expect(
        resolved,
        `A CTA button links to the contact page (${resolved}) — signup CTAs should go to the app`
      ).not.toBe(contactUrl);
      expect(
        resolved.toLowerCase(),
        `A CTA button href "${href}" should not be the contact page`
      ).not.toContain('/contact');
    }
  });

  test('sign-in CTA does NOT link to a page on the marketing site @negative', async ({ homePage, siteConfig }) => {
    const signInLink = homePage.page.getByRole('link', { name: /sign in/i }).first();

    test.skip(await signInLink.count() === 0, 'No "Sign in" link found');

    const href = await signInLink.getAttribute('href') ?? '';
    const marketingOrigin = new URL(siteConfig.url).origin;

    // Sign-in should go to the app subdomain, not back to the marketing site
    expect(
      href,
      `Sign-in link "${href}" should not point to the marketing site origin (${marketingOrigin})`
    ).not.toContain(marketingOrigin + '/');
  });

  // ── Coming-soon boundary ──────────────────────────────────────────────────────

  test('"Coming soon" integrations do not have active navigation links @negative', async ({
    integrationsPage,
  }) => {
    await integrationsPage.navigate();

    // Find all "coming soon" containers
    const comingSoonContainers = integrationsPage.page
      .locator('*')
      .filter({ hasText: /coming soon/i });

    const count = await comingSoonContainers.count();
    test.skip(count === 0, 'No "Coming soon" section found');

    // Within coming-soon sections, there should be no anchor links to actual pages
    for (let i = 0; i < count; i++) {
      const container = comingSoonContainers.nth(i);
      const containerText = (await container.textContent() ?? '').toLowerCase();

      // Only check leaf-level containers that are primarily about "coming soon" content
      if (!containerText.includes('coming soon')) continue;

      const linksInside = container.locator('a[href]:not([href="#"]):not([href=""])');
      const linkCount = await linksInside.count();

      // Coming-soon items should not have functional deep-links
      if (linkCount > 0) {
        for (let j = 0; j < linkCount; j++) {
          const href = await linksInside.nth(j).getAttribute('href') ?? '';
          // Allow mailto and external marketing links, but not integration-specific pages
          expect(
            href,
            `A "Coming soon" integration has an active link to "${href}" — it should not be navigable yet`
          ).not.toMatch(/^\/integrations\/.+/);
        }
      }
    }
  });

  test('features page does NOT show "coming soon" on live features @negative', async ({
    featuresPage,
  }) => {
    await featuresPage.navigate();

    // The listed H2 features (drag & drop, templates, etc.) should be live — not gated
    const featureNames = await featuresPage.getFeatureNames();

    for (const featureName of featureNames) {
      // Find the section containing this heading
      const section = featuresPage.page
        .locator('h2')
        .filter({ hasText: featureName })
        .locator('..')  // parent element
        .first();

      if (await section.count() === 0) continue;

      const sectionText = (await section.textContent() ?? '').toLowerCase();
      expect(
        sectionText,
        `Feature section "${featureName}" contains "coming soon" — live features should not be gated`
      ).not.toContain('coming soon');
    }
  });

  // ── Navigation integrity ──────────────────────────────────────────────────────

  test('nav links do not point to "#" (dead anchor-only hrefs) @negative', async ({
    navigationPage,
  }) => {
    await navigationPage.navigate();
    await navigationPage.waitForLoad();

    const navLinks = await navigationPage.getNavLinks();
    const deadLinks = navLinks.filter((l) => l.href === '#' || l.href === '/#');

    expect(
      deadLinks,
      `Found ${deadLinks.length} nav link(s) with href="#" (no destination):\n` +
        deadLinks.map((l) => `  "${l.text}" → ${l.href}`).join('\n')
    ).toHaveLength(0);
  });

  test('footer links do not include any "about:blank" or javascript: hrefs @negative', async ({
    homePage,
  }) => {
    const footer = homePage.page.locator('footer').first();
    test.skip(await footer.count() === 0, 'No footer found');

    const allLinks = await footer.locator('a[href]').all();
    for (const link of allLinks) {
      const href = (await link.getAttribute('href') ?? '').toLowerCase().trim();
      expect(href, 'Footer link should not use "about:blank"').not.toBe('about:blank');
      expect(href, 'Footer link should not use a javascript: URI').not.toMatch(/^javascript:/);
    }
  });
});
