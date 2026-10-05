import { Children, cloneElement, isValidElement, useId, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { DataTable, DetailDialog, FilterBar, PageHeader, StatusBadge } from '../common/ui'
import type { Column } from '../common/ui'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return <div className="admin-field"><label htmlFor={id}>{label}</label>{Children.map(children, child => isValidElement(child) && typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type) ? cloneElement(child as ReactElement<{ id?: string }>, { id }) : child)}</div>
}
export function Check({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) { return <label className="admin-check"><input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />{label}</label> }
export function Active({ value }: { value: boolean }) { return <StatusBadge tone={value ? 'success' : 'neutral'}>{value ? '활성' : '비활성'}</StatusBadge> }
export function Editor({ title, children, onClose, onSave }: { title: string; children: ReactNode; onClose: () => void; onSave: () => string | null }) {
  const [error, setError] = useState('')
  return <DetailDialog title={title} onClose={onClose}><form className="admin-form" onSubmit={e => { e.preventDefault(); const result = onSave(); if (result) setError(result); else onClose() }}><div className="field-grid">{children}</div>{error && <p role="alert" className="form-error">{error}</p>}<button className="button primary" type="submit">저장</button></form></DetailDialog>
}
export function AdminList<T>({ title, description, rows, columns, rowKey, searchText, onCreate, extraFilter }: { title: string; description: string; rows: T[]; columns: Column<T>[]; rowKey: (v: T) => string; searchText: (v: T) => string; onCreate?: () => void; extraFilter?: ReactNode }) {
  const [query, setQuery] = useState('')
  const filtered = rows.filter(r => searchText(r).toLowerCase().includes(query.trim().toLowerCase()))
  return <><PageHeader eyebrow="PLATFORM ADMIN" title={title} description={description} actions={onCreate && <button className="button primary" onClick={onCreate}>신규 등록</button>} /><section className="panel"><FilterBar><Field label="검색"><input placeholder="이름 또는 코드 검색" value={query} onChange={e => setQuery(e.target.value)} /></Field>{extraFilter}<span className="count-label">{filtered.length}건</span></FilterBar><DataTable caption={title} rows={filtered} columns={columns} rowKey={rowKey} /></section></>
}
