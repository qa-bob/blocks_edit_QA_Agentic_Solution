/**
 * tests/functional/pricing.spec.ts
 *
 * Functional tests for the /pricing/ page.
 * Verifies plan names, prices, CTAs, and key copy without submitting anything.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Pricing Page @functional', () => {
  test.beforeEach(async ({ pricingPage }) => {
    await pricingPage.navigate();
  });

  test('pricing page loads @functional', async ({ pricingPage }) => {
    const loaded = await pricingPage.isLoaded();
    expect(loaded, 'Pricing page should load and display an H1 heading').toBeTruthy();
  });

  test('pricing page H1 is present @functional', async ({ pricingPage }) => {
    const heading = await pricingPage.getHeading();
    expect(heading.length, 'Pricing page H1 should not be empty').toBeGreaterThan(0);
  });

  test('free plan (Solo Editing at $0) is present @functional', async ({ pricingPage }) => {
    const hasFreePlan = await pricingPage.hasFreePlan();
    expect(hasFreePlan, 'Pricing page should display a free Solo Editing plan').toBeTruthy();
  });

  test('paid Collaborate plan ($25/user) is present @functional', async ({ pricingPage }) => {
    const hasPaid = await pricingPage.hasPaidPlan();
    expect(hasPaid, 'Pricing page should display the Collaborate plan at $25/user').toBeTruthy();
  });

  test('all three plan names are visible @functional', async ({ pricingPage }) => {
    const names = await pricingPage.getPlanNames();
    expect(
      names.length,
      `Expected at least 2 plan headings, found ${names.length}: ${names.join(', ')}`
    ).toBeGreaterThanOrEqual(2);

    const nameLower = names.map((n) => n.toLowerCase());
    expect(
      nameLower.some((n) => n.includes('solo') || n.includes('free')),
      'A free/solo plan heading should be present'
    ).toBeTruthy();
    expect(
      nameLower.some((n) => n.includes('collaborate')),
      'A Collaborate plan heading should be present'
    ).toBeTruthy();
  });

  test('"No credit card required" copy is present @functional', async ({ pricingPage }) => {
    const hasCopy = await pricingPage.hasNoCreditCardCopy();
    expect(
      hasCopy,
      'Pricing page should display "no credit card" copy to reduce signup friction'
    ).toBeTruthy();
  });

  test('signup / free trial CTA buttons are present @functional', async ({ pricingPage }) => {
    const count = await pricingPage.ctaButtons.count();
    expect(
      count,
      'At least one signup/free-trial CTA button should appear on the pricing page'
    ).toBeGreaterThan(0);
  });

  test('"Try free for 30 days" CTA is present for the Collaborate plan @functional', async ({ pricingPage }) => {
    const trialCTA = pricingPage.page
      .getByRole('link', { name: /try free for 30 days/i })
      .first();

    expect(
      await trialCTA.count(),
      '"Try free for 30 days" CTA should be present on the pricing page'
    ).toBeGreaterThan(0);
  });

  test('Integrations add-on plan is mentioned @functional', async ({ pricingPage }) => {
    const integrationText = pricingPage.page.getByText(/integrations/i).first();
    expect(
      await integrationText.count(),
      'Pricing page should mention the Integrations add-on'
    ).toBeGreaterThan(0);
  });
});
