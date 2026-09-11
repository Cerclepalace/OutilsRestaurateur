import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdminProduct, listAdminCategories } from '@/services/admin';
import { ProductForm } from '@/features/admin/product-form';
import { VariantEditor } from '@/features/admin/variant-editor';
import { ImageEditor } from '@/features/admin/image-editor';

export default async function AdminProductPage(props: PageProps<'/admin/products/[id]'>) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([getAdminProduct(id), listAdminCategories()]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="bobo-display text-display-sm">{product.name}</h2>
        <Link href={`/product/${product.slug}`} className="bobo-link text-sm text-ink-soft">
          Voir la fiche publique
        </Link>
      </div>

      <ProductForm product={product} categories={categories} />

      <VariantEditor
        productId={product.id}
        variants={product.product_variants ?? []}
        basePriceCents={product.base_price_cents}
      />

      <ImageEditor productId={product.id} images={product.product_images ?? []} />
    </div>
  );
}
