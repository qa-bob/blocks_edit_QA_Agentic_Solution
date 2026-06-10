import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '../types/site-config.types';

export class GettingStartedPage extends BasePage {
  readonly heading: Locator;
  readonly subheadings: Locator;
  readonly ctaButtons: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.subheadings = page.locator('h2');
    this.ctaButtons = page.getByRole('link', {
      name: /sign up free|use blocks edit for free|view theme examples|read the docs/i,
    });
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${this.url}/getting-started/`, { waitUntil: 'domcontentloaded' });
  }

  async getHeading(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  async getSubheadings(): Promise<string[]> {
    const count = await this.subheadings.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.subheadings.nth(i).textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
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
