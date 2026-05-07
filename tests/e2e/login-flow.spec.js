const { test, expect } = require('@playwright/test');

test.describe('login flow (E2E browser test)', () => {
  test.skip(!process.env.SANDBOX_URL, 'no SANDBOX_URL — skipping browser E2E');

  test('user can sign up then log in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('heading')).toHaveText('Stub App');

    const email = `pw+${Date.now()}@example.com`;

    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill('password123');
    await page.getByTestId('signup-submit').click();
    await expect(page.getByTestId('signup-result')).toContainText('Account created');

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-result')).toContainText('Logged in as ' + email);
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-email').fill('nobody@example.com');
    await page.getByTestId('login-password').fill('wrongpw');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-result')).toContainText('Login failed');
  });

  test('clicking add-visit increments the visit count', async ({ page }) => {
    await page.goto('/');
    const before = await page.getByTestId('visit-count').textContent();
    await page.getByTestId('visit-add').click();
    await expect(page.getByTestId('visit-count')).not.toHaveText(before);
  });
});
