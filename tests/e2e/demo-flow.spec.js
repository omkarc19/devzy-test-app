const { test, expect } = require('@playwright/test');

// Slow-paced demo flow that produces the recording embedded in the PR comment.
// Target duration ~22-25s. Regular regression tests live in login-flow.spec.js.

test.describe('demo flow (recorded for PR preview)', () => {
  test.skip(!process.env.SANDBOX_URL, 'no SANDBOX_URL — skipping recorded demo');

  test('full user journey: signup, login, add visits', async ({ page }) => {
    const PAUSE = 800;
    const TYPE_DELAY = 70;

    // 1. Land on the page
    await page.goto('/');
    await page.waitForTimeout(PAUSE);
    await expect(page.getByTestId('heading')).toBeVisible();

    const email = `demo+${Date.now()}@example.com`;
    const password = 'password123';

    // 2. Sign up
    await page.getByTestId('signup-email').click();
    await page.waitForTimeout(300);
    await page.getByTestId('signup-email').type(email, { delay: TYPE_DELAY });
    await page.waitForTimeout(PAUSE);

    await page.getByTestId('signup-password').click();
    await page.waitForTimeout(300);
    await page.getByTestId('signup-password').type(password, { delay: TYPE_DELAY });
    await page.waitForTimeout(PAUSE);

    await page.getByTestId('signup-submit').click();
    await expect(page.getByTestId('signup-result')).toContainText('Account created');
    await page.waitForTimeout(PAUSE * 2);

    // 3. Log in
    await page.getByTestId('login-email').click();
    await page.waitForTimeout(300);
    await page.getByTestId('login-email').type(email, { delay: TYPE_DELAY });
    await page.waitForTimeout(PAUSE);

    await page.getByTestId('login-password').click();
    await page.waitForTimeout(300);
    await page.getByTestId('login-password').type(password, { delay: TYPE_DELAY });
    await page.waitForTimeout(PAUSE);

    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-result')).toContainText('Logged in as ' + email);
    await page.waitForTimeout(PAUSE * 2);

    // 4. Add visits
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('visit-add').click();
      await page.waitForTimeout(700);
    }

    // 5. Final pause for visibility
    await page.waitForTimeout(PAUSE * 2);
  });
});
