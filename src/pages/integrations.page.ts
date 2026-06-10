import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '../types/site-config.types';

export class IntegrationsPage extends BasePage {
  readonly heading: Locator;
  readonly categoryHeadings: Locator;
  readonly customIntegrationCTA: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.categoryHeadings = page.locator('h2');
    this.customIntegrationCTA = page.getByRole('link', { name: /email us/i }).first();
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${this.url}/integrations/`, { waitUntil: 'domcontentloaded' });
  }

  async getHeading(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  async getCategoryNames(): Promise<string[]> {
    const count = await this.categoryHeadings.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.categoryHeadings.nth(i).textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
  }

  async hasIntegration(name: string): Promise<boolean> {
    return (await this.page.getByText(new RegExp(name, 'i')).first().count()) > 0;
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }
}
