import { useState } from 'react'
import type { ReactNode } from 'react'
import { DataTable, FilterBar, PageHeader } from '../common/ui'
import type { Column } from '../common/ui'
import { Field } from '../admin/AdminUI'
export default function AssociationList<T>({ title, description, rows, columns, rowKey, searchText, onCreate, extraFilter, showHeader=true }: { title:string; description:string; rows:T[]; columns:Column<T>[]; rowKey:(v:T)=>string; searchText:(v:T)=>string; onCreate?:()=>void; extraFilter?:ReactNode; showHeader?:boolean }) {
 const [query,setQuery]=useState(''), [page,setPage]=useState(1), [size,setSize]=useState(10)
 const filtered=rows.filter(r=>searchText(r).toLowerCase().includes(query.trim().toLowerCase())), max=Math.max(1,Math.ceil(filtered.length/size)), current=Math.min(page,max)
 return <>{showHeader && <PageHeader eyebrow="ASSOCIATION OPERATIONS" title={title} description={description} actions={onCreate && <button className="button primary" onClick={onCreate}>신규 등록</button>} />}<section className="panel"><FilterBar><Field label="검색"><input placeholder="이름 · 대표자 · 사업자번호" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} /></Field>{extraFilter}<span className="count-label">{filtered.length}건</span></FilterBar><DataTable caption={title} rows={filtered.slice((current-1)*size,current*size)} columns={columns} rowKey={rowKey} /><div className="association-pagination"><span>총 {filtered.length}건 · {current} / {max}페이지</span><select aria-label="페이지당 표시" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[10,20,50].map(n=><option key={n} value={n}>{n}개씩</option>)}</select><button className="button secondary" disabled={current===1} onClick={()=>setPage(current-1)}>이전</button><button className="button secondary" disabled={current===max} onClick={()=>setPage(current+1)}>다음</button></div></section></>
}
