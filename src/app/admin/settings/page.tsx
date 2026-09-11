import { listSettings, listShippingMethodsAdmin } from '@/services/admin';
import { SettingForm, ShippingMethodForm } from '@/features/admin/settings-forms';

export default async function AdminSettingsPage() {
  const [settings, shippingMethods] = await Promise.all([
    listSettings(),
    listShippingMethodsAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="bobo-eyebrow text-ink-muted">Livraison</h2>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Les seuils de franco de port sont lus ici par le panier et par le paiement. Rien
            n&apos;est codé en dur : ce que vous saisissez est ce que le client voit et paie.
          </p>
        </div>

        {shippingMethods.map((method) => (
          <ShippingMethodForm key={method.id} method={method} />
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="bobo-eyebrow text-ink-muted">Contenus &amp; annonces</h2>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Bandeau d&apos;annonce, bloc « Nos engagements » et coordonnées. Format JSON.
          </p>
        </div>

        {settings.map((setting) => (
          <SettingForm
            key={setting.key}
            settingKey={setting.key}
            value={setting.value}
            description={setting.description}
          />
        ))}
      </section>
    </div>
  );
}
