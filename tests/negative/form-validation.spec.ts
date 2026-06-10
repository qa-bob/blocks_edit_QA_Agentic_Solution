/**
 * tests/negative/form-validation.spec.ts
 *
 * Negative form validation tests — verify the contact form correctly REJECTS
 * invalid, empty, and malformed inputs before any submission occurs.
 *
 * IMPORTANT: No form is submitted in these tests.
 *
 * Tag: @negative
 */

import { test, expect } from '@fixtures/site.fixture';

const CONTACT_URL = 'https://blocksedit.com/contact';

test.describe('Form Validation — Negative @negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL, { waitUntil: 'domcontentloaded' });
  });

  // ── Email field rejection ─────────────────────────────────────────────────────

  test('email field rejects a clearly invalid format @negative', async ({ contactPage, page }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found — skipping validation test');
      return;
    }

    const emailField = form.locator(
      'input[type="email"], input[name*="email" i], input[placeholder*="email" i]'
    ).first();

    if (await emailField.count() === 0) {
      test.skip(true, 'No email field found');
      return;
    }

    await emailField.fill('notanemail');

    const isValid = await emailField.evaluate<boolean>((el) => {
      return (el as HTMLInputElement).validity?.valid ?? true;
    });

    expect(
      isValid,
      'Email field should report invalid for "notanemail" (missing @ and domain)'
    ).toBeFalsy();
  });

  test('email field rejects input missing a domain @negative', async ({ contactPage, page }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const emailField = form.locator(
      'input[type="email"], input[name*="email" i]'
    ).first();

    if (await emailField.count() === 0) {
      test.skip(true, 'No email field found');
      return;
    }

    await emailField.fill('user@');

    const isValid = await emailField.evaluate<boolean>((el) => {
      return (el as HTMLInputElement).validity?.valid ?? true;
    });

    expect(
      isValid,
      'Email "user@" (missing domain) should be invalid'
    ).toBeFalsy();
  });

  test('email field is invalid when left completely empty @negative', async ({ contactPage, page }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const emailField = form.locator(
      'input[type="email"], input[name*="email" i]'
    ).first();

    if (await emailField.count() === 0) {
      test.skip(true, 'No email field found');
      return;
    }

    // Ensure the field is empty
    await emailField.fill('');

    const isRequired = await emailField.getAttribute('required');
    const valueMissing = await emailField.evaluate<boolean>((el) => {
      return (el as HTMLInputElement).validity?.valueMissing ?? false;
    });

    if (isRequired !== null) {
      expect(
        valueMissing,
        'Empty required email field should have valueMissing = true'
      ).toBeTruthy();
    }
  });

  // ── Required field rejection ──────────────────────────────────────────────────

  test('required name field is invalid when empty @negative', async ({ contactPage, page }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const nameField = form.locator(
      'input[name*="name" i], input[placeholder*="name" i], input[autocomplete*="name" i]'
    ).first();

    if (await nameField.count() === 0) {
      test.skip(true, 'No name field found');
      return;
    }

    const isRequired = await nameField.getAttribute('required');
    if (isRequired === null) {
      console.warn('[negative] Name field is not marked required — skipping valueMissing check.');
      return;
    }

    await nameField.fill('');

    const valueMissing = await nameField.evaluate<boolean>((el) => {
      return (el as HTMLInputElement).validity?.valueMissing ?? false;
    });

    expect(
      valueMissing,
      'Empty required name field should report valueMissing = true'
    ).toBeTruthy();
  });

  test('required message textarea is invalid when empty @negative', async ({ contactPage, page }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const textarea = form.locator('textarea').first();

    if (await textarea.count() === 0) {
      test.skip(true, 'No textarea found');
      return;
    }

    const isRequired = await textarea.getAttribute('required');
    if (isRequired === null) {
      console.warn('[negative] Textarea is not marked required — skipping.');
      return;
    }

    await textarea.fill('');

    const valueMissing = await textarea.evaluate<boolean>((el) => {
      return (el as HTMLTextAreaElement).validity?.valueMissing ?? false;
    });

    expect(
      valueMissing,
      'Empty required textarea should report valueMissing = true'
    ).toBeTruthy();
  });

  // ── Submit prevention ─────────────────────────────────────────────────────────

  test('form does NOT navigate away when submitted with all fields empty @negative', async ({
    contactPage,
    page,
  }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    let postRequestFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST') postRequestFired = true;
    });

    const submitBtn = form
      .locator('button[type="submit"], input[type="submit"], button:not([type="button"]):not([type="reset"])')
      .first();

    if (await submitBtn.count() === 0) {
      test.skip(true, 'No submit button found');
      return;
    }

    const urlBefore = page.url();
    await submitBtn.click({ force: true });

    // Brief settle time for any validation UI
    await page.locator('body').waitFor({ state: 'visible' });

    expect(
      postRequestFired,
      'A POST request should NOT fire when all required fields are empty'
    ).toBeFalsy();

    expect(
      page.url(),
      'URL should not change after submitting an empty form'
    ).toBe(urlBefore);
  });

  // ── Honeypot / spam trap ──────────────────────────────────────────────────────

  test('contact form has no visible honeypot or trap field shown to real users @negative', async ({
    contactPage,
    page,
  }) => {
    const form = await contactPage.findContactForm();
    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    // Honeypot fields are intentionally hidden from users — visible ones are a UX bug
    const suspiciousFields = form.locator(
      'input[name*="bot" i], input[name*="honeypot" i], input[name*="trap" i], input[name*="spam" i]'
    );

    const count = await suspiciousFields.count();
    for (let i = 0; i < count; i++) {
      const field = suspiciousFields.nth(i);
      const isVisible = await field.isVisible();
      expect(
        isVisible,
        'Honeypot/trap fields must be hidden from users — visible ones break UX'
      ).toBeFalsy();
    }
  });
});
