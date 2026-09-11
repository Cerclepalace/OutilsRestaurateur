import { listAdminCustomers } from '@/services/admin';
import { formatDate } from '@/lib/format';

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-ink-muted">{customers.length} client(s)</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Client</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">E-mail</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Rôle</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Newsletter</th>
              <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-line last:border-0">
                <td className="py-3 pr-4">
                  {[customer.first_name, customer.last_name].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="py-3 pr-4 text-ink-soft">{customer.email}</td>
                <td className="py-3 pr-4 text-ink-soft">{customer.role}</td>
                <td className="py-3 pr-4 text-ink-soft">
                  {customer.accepts_marketing ? 'Oui' : 'Non'}
                </td>
                <td className="py-3 text-ink-muted">{formatDate(customer.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customers.length === 0 ? (
        <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
          Aucun client inscrit.
        </p>
      ) : null}
    </div>
  );
}
