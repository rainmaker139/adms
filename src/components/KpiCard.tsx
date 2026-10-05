export default function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <article className="kpi-card">
    <h2>{label}</h2>
    <p className="kpi-value">{value}</p>
    {hint && <p className="kpi-hint">{hint}</p>}
  </article>
}
