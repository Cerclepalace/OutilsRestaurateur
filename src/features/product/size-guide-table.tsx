import type { SizeGuide } from '@/types/catalog';

/** Measurement table. Scrolls horizontally on a phone rather than shrinking. */
export function SizeGuideTable({ guide }: { guide: SizeGuide }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-md border-collapse text-sm">
          <caption className="sr-only">Tableau des mesures</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4 text-left font-normal text-ink-muted">
                {guide.unit ? `Mesures (${guide.unit})` : 'Mesures'}
              </th>
              {guide.columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-2 text-center font-normal">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-soft">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={index} className="px-3 py-2 text-center tabular-nums">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guide.note ? <p className="text-xs leading-relaxed text-ink-muted">{guide.note}</p> : null}
    </div>
  );
}
