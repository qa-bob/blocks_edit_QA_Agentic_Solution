import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '../types/site-config.types';

export class FeaturesPage extends BasePage {
  readonly heading: Locator;
  readonly featureSections: Locator;
  readonly ctaLink: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.featureSections = page.locator('h2');
    this.ctaLink = page.getByRole('link', { name: /use blocks edit for free|sign up free/i }).first();
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${this.url}/features/`, { waitUntil: 'domcontentloaded' });
  }

  async getHeading(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  async getFeatureNames(): Promise<string[]> {
    const count = await this.featureSections.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.featureSections.nth(i).textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
      return (await this.featureSections.count()) > 0;
    } catch {
      return false;
    }
  }
}
