import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';

/**
 * The mega menu is data, not markup: merchandising can add a column or a
 * collection link without a deploy.
 */

export interface NavNode {
  id: string;
  label: string;
  href: string | null;
  columnLabel: string | null;
  imageUrl: string | null;
  children: NavNode[];
}

async function getNavigation(location: string): Promise<NavNode[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('navigation_items')
    .select('id, parent_id, label, href, column_label, image_url, position')
    .eq('location', location)
    .eq('is_published', true)
    .order('position');

  if (error || !data) return [];

  const byId = new Map<string, NavNode>();
  for (const row of data) {
    byId.set(row.id, {
      id: row.id,
      label: row.label,
      href: row.href,
      columnLabel: row.column_label,
      imageUrl: row.image_url,
      children: [],
    });
  }

  const roots: NavNode[] = [];
  for (const row of data) {
    const node = byId.get(row.id);
    if (!node) continue;
    if (row.parent_id) {
      byId.get(row.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function getHeaderNavigation() {
  return getNavigation('header');
}

export function getFooterNavigation() {
  return getNavigation('footer');
}
