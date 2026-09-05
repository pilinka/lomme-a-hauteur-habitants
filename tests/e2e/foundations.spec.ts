import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/explorer/carte?q=synthese',
  '/explorer/liste?q=synthese',
  '/contribuer',
  '/participation-enfants',
  '/protection',
  '/evolutions',
  '/route-inconnue',
];
const professionalRoutes = [
  '/',
  '/connexion',
  '/recuperation',
  '/contributions',
  '/qualite',
  '/acces-refuse',
  '/route-inconnue',
];

test.describe('fondations publiques', () => {
  for (const route of publicRoutes) {
    test(`@a11y route publique ${route}`, async ({ page }) => {
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      ).toEqual([]);
    });
  }

  test('la navigation carte-liste conserve les paramètres', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/explorer/carte?q=synthese');
    await page.getByRole('link', { name: 'Passer à la vue liste' }).click();
    await expect(page).toHaveURL(/\/explorer\/liste\?q=synthese$/);
    await expect(page.getByRole('textbox', { name: 'Rechercher dans le quartier' })).toHaveValue(
      'synthese',
    );
  });

  test('le lien d’évitement conduit au contenu principal', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' });
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page.locator('#contenu-principal')).toBeFocused();
  });
});

test.describe('fondations professionnelles', () => {
  for (const route of professionalRoutes) {
    test(`@a11y route professionnelle ${route}`, async ({ page }) => {
      await page.goto(`http://127.0.0.1:4174${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      ).toEqual([]);
    });
  }
});
