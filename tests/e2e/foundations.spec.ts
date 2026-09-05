import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const forbiddenRuntimeMarkers =
  /(?:https?:\/\/[^\s"']+\.supabase\.(?:co|in)|VITE_SUPABASE_|synthetic-demo|fixture-(?:contribution|publication))/i;

function observeRuntime(page: Page) {
  const criticalErrors: string[] = [];
  const forbiddenRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') criticalErrors.push(message.text());
  });
  page.on('pageerror', (error) => criticalErrors.push(error.message));
  page.on('request', (request) => {
    if (/supabase\.(?:co|in)/i.test(request.url())) {
      forbiddenRequests.push(request.url());
    }
  });

  return { criticalErrors, forbiddenRequests };
}

async function expectCleanRuntime(page: Page, observations: ReturnType<typeof observeRuntime>) {
  const scripts = await page.locator('script[src]').evaluateAll(async (elements) =>
    Promise.all(
      elements.map(async (element) => {
        const response = await fetch((element as HTMLScriptElement).src);
        return response.text();
      }),
    ),
  );

  expect(scripts.join('\n')).not.toMatch(forbiddenRuntimeMarkers);
  expect(observations.criticalErrors).toEqual([]);
  expect(observations.forbiddenRequests).toEqual([]);
}

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
      const observations = observeRuntime(page);
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      ).toEqual([]);
      await expectCleanRuntime(page, observations);
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

  test('la navigation et le formulaire publics sont utilisables au clavier', async ({ page }) => {
    const observations = observeRuntime(page);
    await page.goto('http://127.0.0.1:4173/');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu principal' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Explorer' })).toBeFocused();
    await page.keyboard.press('Tab');
    const contributeLink = page.getByRole('link', { name: 'Contribuer' });
    await expect(contributeLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/contribuer$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

    await page.keyboard.press('Tab');
    const title = page.getByRole('textbox', { name: /Titre de la proposition/ });
    await expect(title).toBeFocused();
    await page.keyboard.type('Scénario clavier synthétique');
    await page.keyboard.press('Tab');
    const content = page.getByRole('textbox', { name: /Votre contribution/ });
    await expect(content).toBeFocused();
    await page.keyboard.type('Texte synthétique saisi uniquement au clavier.');
    await page.keyboard.press('Tab');
    const submit = page.getByRole('button', { name: 'Vérifier le parcours' });
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('status')).toContainText('Aucune donnée n’a été envoyée');
    await expectCleanRuntime(page, observations);
  });

  test('le retour du navigateur conserve une navigation fonctionnelle', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/');
    await page.getByRole('link', { name: 'Commencer à explorer' }).click();
    await expect(page).toHaveURL(/\/explorer\/carte$/);

    await page.goBack();
    await expect(page).toHaveURL('http://127.0.0.1:4173/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Le quartier à hauteur d’habitants',
    );
  });

  test('le formulaire applique les protections locales prévues', async ({ page }) => {
    const observations = observeRuntime(page);
    await page.goto('http://127.0.0.1:4173/contribuer');

    await expect(page.getByRole('note')).toContainText('ne saisissez pas de nom');

    const title = page.getByRole('textbox', { name: /Titre de la proposition/ });
    const content = page.getByRole('textbox', { name: /Votre contribution/ });
    await title.fill('   ');
    await content.fill('   ');
    await page.getByRole('button', { name: 'Vérifier le parcours' }).click();
    await expect(page.getByRole('alert')).toContainText('Ajoutez un titre et une contribution');

    await title.fill('Scénario synthétique');
    await content.fill('Texte synthétique réservé au contrôle E2E.');
    await page.getByRole('button', { name: 'Vérifier le parcours' }).click();
    await expect(page.getByRole('status')).toContainText('Aucune donnée n’a été envoyée');
    await expect(title).toHaveValue('');
    await expect(content).toHaveValue('');
    await expectCleanRuntime(page, observations);
  });
});

test.describe('fondations professionnelles', () => {
  for (const route of professionalRoutes) {
    test(`@a11y route professionnelle ${route}`, async ({ page }) => {
      const observations = observeRuntime(page);
      await page.goto(`http://127.0.0.1:4174${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      ).toEqual([]);
      await expectCleanRuntime(page, observations);
    });
  }

  test('la navigation professionnelle fonctionne au clavier sans backend', async ({ page }) => {
    const observations = observeRuntime(page);
    await page.goto('http://127.0.0.1:4174/');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu principal' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeFocused();
    await page.keyboard.press('Tab');
    const contributionsLink = page.getByRole('link', { name: 'Contributions' });
    await expect(contributionsLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/contributions$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contributions à relire');
    await expect(page.getByRole('status')).toContainText('Aucune donnée professionnelle');
    await expectCleanRuntime(page, observations);
  });
});
