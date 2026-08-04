import { expect, test } from '@playwright/test';

/**
 * The core-loop golden path required by PLAN.md's Batch 7 gate: sign in,
 * complete every daily quest, verify stats update and a level-up fires.
 *
 * Every quest template is active every day now (no daily rotation/selection
 * — see the "show all quests each day" change), so this completes the
 * entire bank, not just 5 picks.
 *
 * Runs against `/e2e.html` (see `src/e2e-main.tsx`) rather than the real
 * app entry — that harness boots the actual `App` component with a
 * pre-authenticated fake auth client and a pre-seeded fake Firestore
 * client, sidestepping the real Google OAuth popup (which an automated
 * click can't trust-gesture its way through) and the Firestore emulator
 * (blocked by this machine's Group Policy). The Health domain starts at
 * 45xp — one small quest reward short of the 50xp level-2 threshold — so
 * the level-up fires deterministically as soon as its first quest is
 * completed, regardless of which one that happens to be.
 */
test('golden path: complete every daily quest and a level-up fires', async ({ page }) => {
  await page.goto('/e2e.html');
  await expect(page.getByTestId('signed-in-shell')).toBeVisible();

  await page.getByRole('link', { name: 'Daily quests' }).click();
  await expect(page.getByTestId('daily-quests-screen')).toBeVisible();
  await expect(page.getByTestId('daily-quests-progress')).toHaveText(/^0 of \d+ complete$/);

  const cards = page.locator('[data-testid^="quest-card-"]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(5); // sanity check: every quest is active, not just one per domain

  // Health sorts first (domain sortOrder 0), so its first card is always among the first few —
  // completing it is deterministic regardless of which specific Health quest ends up first.
  const healthCheckbox = cards.nth(0).getByRole('checkbox');
  await healthCheckbox.click();
  await expect(healthCheckbox).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('daily-quests-levelup')).toContainText('Health leveled up');
  await expect(page.getByTestId('daily-quests-levelup')).toContainText('level 2');

  for (let i = 1; i < count; i += 1) {
    const checkbox = cards.nth(i).getByRole('checkbox');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }

  await expect(page.getByTestId('daily-quests-progress')).toHaveText(
    `${count} of ${count} complete`,
  );

  await page.getByRole('link', { name: 'Character sheet' }).click();
  await expect(page.getByTestId('home-screen')).toBeVisible();

  await page.getByTestId('domain-row-health').click();
  await expect(page.getByTestId('domain-detail-screen')).toBeVisible();
  // Every Health quest (including its 60xp boss) has now been completed on top of the seeded
  // 45xp — 230xp total, past the level-3 (200xp) threshold, not just the level-2 one checked above.
  await expect(page.getByText(/Health · level 3/)).toBeVisible();
});
