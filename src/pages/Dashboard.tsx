import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import KpiCard from '../components/KpiCard'
import { chartData, kpis } from '../data/demo'
export default function Dashboard() {
  return <>
    <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
    <div className="grid gap-4 lg:grid-cols-3">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
    <section className="mt-6 rounded border border-slate-200 bg-white p-4" aria-label="월별 mock 집행액 차트">
      <h2 className="mb-4 font-semibold">Recharts 테스트 (만원)</h2>
      <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip />
          <Bar dataKey="amount" name="집행액 (만원)" fill="#475569" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer></div>
    </section>
  </>
}
