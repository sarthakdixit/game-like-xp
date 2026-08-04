import { expect, test } from '@playwright/test';

/**
 * The core-loop golden path required by PLAN.md's Batch 7 gate: sign in,
 * complete all 5 daily quests, verify stats update and a level-up fires.
 *
 * Runs against `/e2e.html` (see `src/e2e-main.tsx`) rather than the real
 * app entry — that harness boots the actual `App` component with a
 * pre-authenticated fake auth client and a pre-seeded fake Firestore
 * client, sidestepping the real Google OAuth popup (which an automated
 * click can't trust-gesture its way through) and the Firestore emulator
 * (blocked by this machine's Group Policy). The Health domain starts at
 * 45xp — one small quest reward short of the 50xp level-2 threshold — so
 * the level-up fires deterministically regardless of which template the
 * day's random quest selection happens to pick.
 */
test('golden path: complete all five daily quests and a level-up fires', async ({ page }) => {
  await page.goto('/e2e.html');
  await expect(page.getByTestId('signed-in-shell')).toBeVisible();

  await page.getByRole('link', { name: 'Daily quests' }).click();
  await expect(page.getByTestId('daily-quests-screen')).toBeVisible();
  await expect(page.getByTestId('daily-quests-progress')).toHaveText('0 of 5 complete');

  const cards = page.locator('[data-testid^="quest-card-"]');
  await expect(cards).toHaveCount(5);

  // Health sorts first (domain sortOrder 0), so completing it first — and checking the
  // banner right away — is what's actually deterministic. (Any other domain has its own
  // independent chance of drawing its boss quest today, which alone is also enough to
  // cross the 50xp threshold from 0; that's correct app behavior, but since the level-up
  // banner is a single last-write-wins slot, asserting on it only after all 5 are done
  // would be racing against those other, non-deterministic level-ups.)
  const healthCheckbox = cards.nth(0).getByRole('checkbox');
  await healthCheckbox.click();
  await expect(healthCheckbox).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('daily-quests-levelup')).toContainText('Health leveled up');
  await expect(page.getByTestId('daily-quests-levelup')).toContainText('level 2');

  for (let i = 1; i < 5; i += 1) {
    const checkbox = cards.nth(i).getByRole('checkbox');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }

  await expect(page.getByTestId('daily-quests-progress')).toHaveText('5 of 5 complete');

  await page.getByRole('link', { name: 'Character sheet' }).click();
  await expect(page.getByTestId('home-screen')).toBeVisible();

  await page.getByTestId('domain-row-health').click();
  await expect(page.getByTestId('domain-detail-screen')).toBeVisible();
  await expect(page.getByText(/Health · level 2/)).toBeVisible();
});
