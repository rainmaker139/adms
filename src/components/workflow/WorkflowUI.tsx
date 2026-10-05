import { demoClock } from '../../data/workflowFormat'
import KpiCard from '../KpiCard'
import { Field } from '../admin/AdminUI'
import type { WeeklyRound, SettlementBatch } from '../../types/workflow'
export function WorkflowKpis({ items }: { items: [string, string | number][] }) { return <div className="association-kpis">{items.map(([label, value]) => <KpiCard key={label} label={label} value={String(value)} />)}</div> }
export function RoundSelect({ rounds, selected, onSelect }: { rounds: WeeklyRound[]; selected?: string; onSelect: (id: string) => void }) {
 const today=demoClock.slice(0,10), current=rounds.filter(r=>r.startsOn<=today && r.endsOn>=today), future=rounds.filter(r=>r.startsOn>today).sort((a,b)=>a.startsOn.localeCompare(b.startsOn)), past=rounds.filter(r=>r.endsOn<today).sort((a,b)=>b.startsOn.localeCompare(a.startsOn))
 const label=(r:WeeklyRound,prefix:string)=>`${prefix} ${r.name.match(/\d+차/)?.[0] || r.name} · ${r.startsOn} ~ ${r.endsOn}`
 return <Field label="행사주차"><select value={selected || ''} onChange={e=>onSelect(e.target.value)}>{current.map(r=><option key={r.id} value={r.id}>{label(r,'현재')}</option>)}{future.map((r,i)=><option key={r.id} value={r.id}>{label(r,i===0?'차주':'예정')}</option>)}{past.map(r=><option key={r.id} value={r.id}>{label(r,'지난')}</option>)}</select></Field>
}
export function BatchSelect({ batches, selected, onSelect }: { batches: SettlementBatch[]; selected?: string; onSelect: (id: string) => void }) { return <Field label="정산차수"><select value={selected || ''} onChange={e => onSelect(e.target.value)}>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field> }
