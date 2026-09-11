import { listAdminCategories } from '@/services/admin';
import { ProductForm } from '@/features/admin/product-form';

export default async function NewProductPage() {
  const categories = await listAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="bobo-display text-display-sm">Nouveau produit</h2>
      <p className="text-sm text-ink-soft">
        Enregistrez d&apos;abord la fiche, puis ajoutez ses déclinaisons et ses images.
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
