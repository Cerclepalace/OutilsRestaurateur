import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The announcement banner is merchant-written prose, so it can name the
 * free-shipping threshold in whatever wording the brand wants. What it must not
 * do is state a number the checkout will not honour: a banner promising free
 * delivery from 200 € while the cart charges up to 249 € is a commercial claim
 * the shop does not keep. The `{seuil_franco}` token exists to close that gap,
 * and these tests are what stop it silently reverting to a literal number.
 */

/** Intl puts a no-break space before the currency symbol; normalise it like
 *  the formatter's own tests do, so the assertions stay readable. */
const plain = (value: string | undefined) => value?.replace(/[\u00a0\u202f]/g, ' ');

const rows = {
  announcement: { enabled: true, message: '', href: '/engagements' },
  shipping: [] as Array<{
    free_above_cents: number | null;
    country_codes: string[];
    is_active: boolean;
  }>,
};

vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => ({
    from(table: string) {
      if (table === 'settings') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { value: rows.announcement } }) }),
          }),
        };
      }
      // shipping_methods
      return {
        select: () => ({
          eq: () => ({ order: async () => ({ data: rows.shipping }) }),
        }),
      };
    },
  }),
}));

const { getAnnouncement } = await import('@/services/settings');

beforeEach(() => {
  rows.announcement = { enabled: true, message: '', href: '/engagements' };
  rows.shipping = [
    { free_above_cents: 20000, country_codes: ['FR'], is_active: true },
    { free_above_cents: 35000, country_codes: [], is_active: true },
  ];
});

describe('getAnnouncement', () => {
  it('replaces the token with the threshold actually configured', async () => {
    rows.announcement.message = "Livraison offerte dès {seuil_franco} d'achat";
    expect(plain((await getAnnouncement())?.message)).toBe("Livraison offerte dès 200 € d'achat");
  });

  it('follows the threshold when it changes, rather than restating an old number', async () => {
    rows.announcement.message = 'Franco dès {seuil_franco}';
    rows.shipping[0].free_above_cents = 24900;
    expect(plain((await getAnnouncement())?.message)).toBe('Franco dès 249 €');
  });

  it('shows centimes in full, so a threshold never reads as a typo', async () => {
    rows.announcement.message = 'Franco dès {seuil_franco}';
    rows.shipping[0].free_above_cents = 19950;
    expect(plain((await getAnnouncement())?.message)).toBe('Franco dès 199,50 €');
  });

  it('leaves a message without the token exactly as the merchant wrote it', async () => {
    rows.announcement.message = 'Nouvelle capsule en ligne';
    expect((await getAnnouncement())?.message).toBe('Nouvelle capsule en ligne');
  });

  it('drops the token rather than printing it when no method offers free shipping', async () => {
    rows.announcement.message = 'Franco dès {seuil_franco}.';
    rows.shipping = [{ free_above_cents: null, country_codes: ['FR'], is_active: true }];
    expect((await getAnnouncement())?.message).toBe('Franco dès .');
  });

  it('stays hidden when the banner is disabled', async () => {
    rows.announcement = { enabled: false, message: 'caché', href: '/x' };
    expect(await getAnnouncement()).toBeNull();
  });
});
