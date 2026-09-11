import type { Metadata } from 'next';

import { getAddresses } from '@/services/account';
import { AddressManager } from '@/features/account/address-manager';

export const metadata: Metadata = {
  title: 'Mes adresses',
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const addresses = await getAddresses();
  return <AddressManager addresses={addresses} />;
}
