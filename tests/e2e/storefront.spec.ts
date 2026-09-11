import { test, expect } from '@playwright/test';

/**
 * Storefront journeys.
 *
 * Each test asserts on what a shopper can see and do, not on implementation
 * details, so a refactor of the components does not break the suite.
 */

test.describe('homepage', () => {
  test('opens on the featured capsule and offers the catalogue', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /toute la boutique/i }).first()).toBeVisible();

    // The editorial sections are driven by the CMS; at least one product row
    // must render or the homepage is empty.
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('reaches the shop from the header', async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      const open = page.getByRole('button', { name: /ouvrir le menu/i });
      await expect(open).toBeVisible();
      await open.click();

      // The panel renames itself as you drill in, so address it by position
      // rather than by its (changing) label.
      const drawer = page.locator('[role="dialog"]').first();
      await expect(drawer).toBeVisible();
      await drawer.getByRole('button', { name: 'Boutique', exact: true }).click();
      await drawer.getByRole('link', { name: /voir tout/i }).click();
    } else {
      await page.getByRole('navigation', { name: /navigation principale/i })
        .getByRole('link', { name: 'Boutique' })
        .click();
    }

    await expect(page).toHaveURL(/\/boutique/);
    await expect(page.getByRole('heading', { name: 'Boutique', level: 1 })).toBeVisible();
  });
});

test.describe('catalogue', () => {
  test('filters by size and keeps the choice in the URL', async ({ page, isMobile }) => {
    await page.goto('/boutique');

    // The count line is rendered from the same query as the grid, so waiting on
    // it is deterministic where counting DOM nodes races the render.
    const countLine = page.locator('[aria-live="polite"]').first();
    await expect(countLine).toContainText(/\d+ pièces?/);
    const before = Number.parseInt((await countLine.textContent()) ?? '0', 10);
    expect(before).toBeGreaterThan(0);

    // On a phone the same rail lives in a drawer; wait for it to settle before
    // clicking, or the navigation races the opening animation.
    // Several dialogs live in the layout (menu, cart, search), so address the
    // filter panel by its own name rather than by position.
    const filterDrawer = page.getByRole('dialog', { name: 'Filtrer' });
    const rail = isMobile ? filterDrawer : page;

    if (isMobile) {
      await page.getByRole('button', { name: /^filtrer/i }).click();
      await expect(filterDrawer).toBeVisible();
    }

    await rail.getByRole('link', { name: /^XL/ }).first().click();

    await expect(page).toHaveURL(/size=XL/);
    await expect(countLine).toContainText(/\d+ pièces?/);

    const after = Number.parseInt((await countLine.textContent()) ?? '0', 10);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    await expect(page.locator('article')).toHaveCount(after);

    // A reload must restore exactly the same view.
    await page.reload();
    await expect(page).toHaveURL(/size=XL/);
    await expect(page.locator('article')).toHaveCount(after);
  });

  test('sorting by price orders the grid', async ({ page }) => {
    await page.goto('/boutique?sort=price-asc');

    const cards = await page.locator('article').all();
    const numbers: number[] = [];
    for (const card of cards) {
      // The first figure on a card is the price being charged; a reduced card
      // also shows the struck-through one.
      const text = await card.locator('.tabular-nums').first().textContent();
      const value = Number.parseFloat((text ?? '').replace(/[^\d,]/g, '').replace(',', '.'));
      if (Number.isFinite(value)) numbers.push(value);
    }

    expect(numbers.length).toBeGreaterThan(1);
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });

  test('an impossible filter combination shows an empty state, not a broken page', async ({
    page,
  }) => {
    await page.goto('/boutique?min=9000&max=9999');
    await expect(page.getByText(/rien pour l'instant/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /voir toute la boutique/i })).toBeVisible();
  });
});

test.describe('search', () => {
  test('finds a piece by model name', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration: before it, the control is a plain link to /search.
    const trigger = page.getByRole('link', { name: 'Rechercher' });
    await expect(trigger).toBeVisible();
    await page.waitForFunction(() => document.querySelector('[role="dialog"][aria-label="Recherche"]') !== null);
    await trigger.click();

    const input = page.getByRole('searchbox');
    await expect(input).toBeFocused();

    await input.fill('Gauthier');

    // Scope to the overlay: the page behind it also lists products.
    const overlay = page.getByRole('dialog', { name: 'Recherche' });
    await expect(overlay.getByRole('heading', { name: 'Pièces' })).toBeVisible();
    await overlay.getByRole('link', { name: /Gauthier/ }).first().click();

    await expect(page).toHaveURL(/\/product\//);
  });

  test('a query with no match offers a way out', async ({ page }) => {
    await page.goto('/search?q=zzzzzz');
    await expect(page.getByText(/aucune pièce ne correspond/i)).toBeVisible();
  });
});

test.describe('product page', () => {
  test('shows price, sizes and the size guide', async ({ page }) => {
    await page.goto('/product/veste-en-jean-gauthier');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gauthier');
    await expect(page.getByText('199', { exact: false }).first()).toBeVisible();

    await expect(page.getByRole('button', { name: 'M', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /^taille$/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('carries Product structured data for search engines', async ({ page }) => {
    await page.goto('/product/veste-en-jean-gauthier');

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = blocks.map((block) => JSON.parse(block)).find((data) => data['@type'] === 'Product');

    expect(product).toBeTruthy();
    expect(product.name).toContain('Gauthier');
    expect(product.offers.priceCurrency).toBe('EUR');
  });
});

test.describe('cart', () => {
  test('adds a piece, opens the drawer and survives a reload', async ({ page }) => {
    await page.goto('/product/veste-en-jean-gauthier');

    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: /ajouter au panier/i }).click();

    const drawer = page.getByRole('dialog', { name: 'Panier' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Gauthier')).toBeVisible();
    await expect(drawer.getByRole('link', { name: /passer commande/i })).toBeVisible();

    // Regression: images are anchored to a colourway's first variant, so a line
    // for any other size once resolved to no thumbnail at all.
    const thumbnail = drawer.locator('img').first();
    await expect(thumbnail).toBeVisible();
    expect(await thumbnail.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    await page.reload();
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Panier', level: 1 })).toBeVisible();
    await expect(page.getByText('Gauthier').first()).toBeVisible();
  });

  test('changing the quantity re-prices the line from the server', async ({ page }) => {
    await page.goto('/product/veste-en-jean-gauthier');
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: /ajouter au panier/i }).click();
    await page.goto('/cart');

    const increase = page.getByRole('button', { name: /augmenter la quantité/i }).first();
    await increase.click();

    await expect(page.getByText('398', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('removing the last line shows the empty state', async ({ page }) => {
    await page.goto('/product/bob-oasis');
    await page.getByRole('button', { name: /ajouter au panier/i }).click();
    await page.goto('/cart');

    await page.getByRole('button', { name: /^retirer /i }).first().click();
    await expect(page.getByRole('heading', { name: /votre panier est vide/i })).toBeVisible();
  });
});

test.describe('wishlist', () => {
  test('saves a piece and lists it', async ({ page }) => {
    await page.goto('/product/veste-en-jean-gauthier');

    await page.getByRole('button', { name: /ajouter .* à la liste de souhaits/i }).first().click();
    await page.goto('/wishlist');

    await expect(page.getByText('Gauthier').first()).toBeVisible();
  });
});

test.describe('editorial pages', () => {
  for (const path of ['/engagements', '/studio', '/qui-sommes-nous', '/journal', '/collections']) {
    test(`${path} renders its content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();
    });
  }
});

test.describe('accessibility and layout', () => {
  test('no horizontal overflow at any tested width', async ({ page }) => {
    for (const path of ['/', '/boutique', '/product/veste-en-jean-gauthier', '/cart']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow, `${path} scrolls sideways`).toBe(false);
    }
  });

  test('the skip link takes keyboard users to the content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is a desktop concern here.');

    await page.goto('/');
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: /aller au contenu/i });
    await expect(skip).toBeFocused();
  });

  test('protected areas send anonymous visitors to sign in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/account\/login/);
  });
});
