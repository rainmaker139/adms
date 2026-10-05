import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X, Inbox } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>
}
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'info' }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>
}
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>
}
export interface Column<T> { key: string; label: string; render: (row: T) => ReactNode }
export function DataTable<T>({ rows, columns, rowKey, caption }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; caption: string }) {
  return <div className="table-scroll"><table><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>
    {rows.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>)}
    {rows.length === 0 && <tr><td colSpan={columns.length}><div className="empty-state"><Inbox size={24} /><strong>표시할 데이터가 없습니다</strong><span>현재 사업과 접근 범위 또는 검색 조건을 확인해 주세요.</span></div></td></tr>}
  </tbody></table></div>
}
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="detail-list">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
}
export function DetailDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="detail-dialog" aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dialog-heading"><h2 id="detail-title">{title}</h2><button className="icon-button" aria-label="상세 닫기" onClick={onClose}><X size={20} /></button></div>{children}<div className="dialog-footer"><button className="button secondary" onClick={onClose}>닫기</button></div>
  </dialog>
}
