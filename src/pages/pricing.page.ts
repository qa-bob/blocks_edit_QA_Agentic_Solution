import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '../types/site-config.types';

export class PricingPage extends BasePage {
  readonly heading: Locator;
  readonly planHeadings: Locator;
  readonly ctaButtons: Locator;
  readonly noCreditCardCopy: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heading = page.locator('h1').first();
    this.planHeadings = page.locator('h2, h3').filter({
      hasText: /solo editing|collaborate|integrations/i,
    });
    this.ctaButtons = page.getByRole('link', {
      name: /sign up free|try free for 30 days|use blocks edit for free/i,
    });
    this.noCreditCardCopy = page.getByText(/no credit card/i).first();
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${this.url}/pricing/`, { waitUntil: 'domcontentloaded' });
  }

  async getHeading(): Promise<string> {
    return (await this.heading.textContent())?.trim() ?? '';
  }

  async getPlanNames(): Promise<string[]> {
    const count = await this.planHeadings.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.planHeadings.nth(i).textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
  }

  async hasFreePlan(): Promise<boolean> {
    return (
      (await this.page.getByText(/solo editing/i).count()) > 0 &&
      (await this.page.getByText(/\$0|free/i).count()) > 0
    );
  }

  async hasPaidPlan(): Promise<boolean> {
    return (
      (await this.page.getByText(/collaborate/i).count()) > 0 &&
      (await this.page.getByText(/\$25/i).count()) > 0
    );
  }

  async hasNoCreditCardCopy(): Promise<boolean> {
    return (await this.noCreditCardCopy.count()) > 0;
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
