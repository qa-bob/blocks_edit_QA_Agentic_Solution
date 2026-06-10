/**
 * src/fixtures/site.fixture.ts
 *
 * Extends Playwright's base `test` with pre-constructed page objects and the
 * loaded site config.  All test files should import {test, expect} from here
 * instead of from '@playwright/test' directly.
 *
 * Usage in test files:
 *   import { test, expect } from '@fixtures/site.fixture';
 */

import { test as base, expect } from '@playwright/test';
import { loadSiteConfig, type SiteConfig } from '../types/site-config.types';
import { HomePage } from '@pages/home.page';
import { NavigationPage } from '@pages/navigation.page';
import { ContactFormPage } from '@pages/contact.page';
import { FeaturesPage } from '@pages/features.page';
import { PricingPage } from '@pages/pricing.page';
import { IntegrationsPage } from '@pages/integrations.page';
import { GettingStartedPage } from '@pages/getting-started.page';

// ── Fixture type definitions ─────────────────────────────────────────────────

export interface Fixtures {
  /** Fully resolved site configuration loaded from site.config.json */
  siteConfig: SiteConfig;
  /** Pre-navigated HomePage page object */
  homePage: HomePage;
  /** NavigationPage page object (does not auto-navigate) */
  navigationPage: NavigationPage;
  /** ContactFormPage page object (does not auto-navigate) */
  contactPage: ContactFormPage;
  /** FeaturesPage page object (does not auto-navigate) */
  featuresPage: FeaturesPage;
  /** PricingPage page object (does not auto-navigate) */
  pricingPage: PricingPage;
  /** IntegrationsPage page object (does not auto-navigate) */
  integrationsPage: IntegrationsPage;
  /** GettingStartedPage page object (does not auto-navigate) */
  gettingStartedPage: GettingStartedPage;
}

// ── Extended test object ─────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  siteConfig: async ({}, use) => {
    const config = loadSiteConfig();
    await use(config);
  },

  homePage: async ({ page, siteConfig }, use) => {
    const homePage = new HomePage(page, siteConfig);
    await homePage.navigate();
    await use(homePage);
  },

  navigationPage: async ({ page, siteConfig }, use) => {
    const navigationPage = new NavigationPage(page, siteConfig);
    await use(navigationPage);
  },

  contactPage: async ({ page, siteConfig }, use) => {
    const contactPage = new ContactFormPage(page, siteConfig);
    await use(contactPage);
  },

  featuresPage: async ({ page, siteConfig }, use) => {
    const featuresPage = new FeaturesPage(page, siteConfig);
    await use(featuresPage);
  },

  pricingPage: async ({ page, siteConfig }, use) => {
    const pricingPage = new PricingPage(page, siteConfig);
    await use(pricingPage);
  },

  integrationsPage: async ({ page, siteConfig }, use) => {
    const integrationsPage = new IntegrationsPage(page, siteConfig);
    await use(integrationsPage);
  },

  gettingStartedPage: async ({ page, siteConfig }, use) => {
    const gettingStartedPage = new GettingStartedPage(page, siteConfig);
    await use(gettingStartedPage);
  },
});

// Re-export expect so tests only need one import source
export { expect };
