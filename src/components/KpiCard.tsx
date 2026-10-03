import type { Kpi } from '../types/demo'
export default function KpiCard({ label, value }: Kpi) {
  return <article className="rounded border border-slate-200 bg-white p-4">
    <h2 className="text-sm text-slate-600">{label}</h2>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </article>
}
