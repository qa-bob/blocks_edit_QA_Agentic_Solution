/**
 * tests/functional/integrations.spec.ts
 *
 * Functional tests for the /integrations/ page.
 * Verifies integration categories, known integration names, and custom-integration CTA.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

// Integrations confirmed on the live site
const KNOWN_INTEGRATIONS = [
  'Mailchimp',
  'Salesforce',
  'HubSpot',
  'Klaviyo',
  'ActiveCampaign',
  'Okta',
  'AWS',
] as const;

test.describe('Integrations Page @functional', () => {
  test.beforeEach(async ({ integrationsPage }) => {
    await integrationsPage.navigate();
  });

  test('integrations page loads @functional', async ({ integrationsPage }) => {
    const loaded = await integrationsPage.isLoaded();
    expect(loaded, 'Integrations page should load and display an H1 heading').toBeTruthy();
  });

  test('integrations page has a non-empty H1 @functional', async ({ integrationsPage }) => {
    const heading = await integrationsPage.getHeading();
    expect(heading.length, 'Integrations page H1 should not be empty').toBeGreaterThan(0);
  });

  test('integration categories are displayed @functional', async ({ integrationsPage }) => {
    const categories = await integrationsPage.getCategoryNames();
    expect(
      categories.length,
      `Expected at least 2 integration category headings, found ${categories.length}`
    ).toBeGreaterThanOrEqual(2);
  });

  for (const integration of KNOWN_INTEGRATIONS) {
    test(`"${integration}" integration is listed @functional`, async ({ integrationsPage }) => {
      const found = await integrationsPage.hasIntegration(integration);
      expect(
        found,
        `Integration "${integration}" should be listed on the integrations page`
      ).toBeTruthy();
    });
  }

  test('SSO integrations (Okta / OneLogin) are present @functional', async ({ integrationsPage }) => {
    const hasOkta = await integrationsPage.hasIntegration('Okta');
    const hasOneLogin = await integrationsPage.hasIntegration('OneLogin');
    expect(
      hasOkta || hasOneLogin,
      'At least one SSO integration (Okta or OneLogin) should be listed'
    ).toBeTruthy();
  });

  test('custom integration request CTA is present @functional', async ({ integrationsPage }) => {
    expect(
      await integrationsPage.customIntegrationCTA.count(),
      'An "Email us" link for custom integration requests should be present'
    ).toBeGreaterThan(0);
  });

  test('"Coming soon" section is present for future integrations @functional', async ({ integrationsPage }) => {
    const comingSoon = integrationsPage.page.getByText(/coming soon/i).first();
    expect(
      await comingSoon.count(),
      '"Coming soon" section for future integrations should be present'
    ).toBeGreaterThan(0);
  });

  test('hosting/CDN integrations section is present @functional', async ({ integrationsPage }) => {
    const hasHosting =
      (await integrationsPage.page.getByText(/hosting|cdn|ftp|aws|s3/i).first().count()) > 0;
    expect(hasHosting, 'A hosting or CDN integrations section should be present').toBeTruthy();
  });
});
