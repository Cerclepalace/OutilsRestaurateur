import { NextResponse } from 'next/server';

import { createPublicClient } from '@/lib/supabase/public';

/** Autocomplete for the search overlay: products, collections, categories. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ products: [], collections: [], categories: [] });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('search_suggestions', {
    p_query: query,
    p_limit: 6,
  });

  if (error) {
    console.error('[api/search]', error);
    return NextResponse.json({ products: [], collections: [], categories: [] });
  }

  return NextResponse.json(data);
}
