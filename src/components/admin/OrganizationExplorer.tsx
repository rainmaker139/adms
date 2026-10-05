import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, ChevronRight, Search, X } from 'lucide-react'
import type { Organization } from '../../types/platform'

export default function OrganizationExplorer({ items, selectedId, onSelect }: { items: Organization[]; selectedId: string; onSelect: (id: string) => void }) {
  const index = useMemo(() => {
    const byId = new Map(items.map(o => [o.id, o]))
    const children = new Map<string | null, Organization[]>()
    for (const item of items) { const siblings = children.get(item.parentId) ?? []; siblings.push(item); children.set(item.parentId, siblings) }
    const ancestors = (id: string) => { const path: string[] = []; let parent = byId.get(id)?.parentId; while (parent && !path.includes(parent)) { path.push(parent); parent = byId.get(parent)?.parentId } return path }
    return { byId, children, ancestors }
  }, [items])
  const [expanded, setExpanded] = useState(() => new Set([...index.ancestors(selectedId), selectedId]))
  const [query, setQuery] = useState('')
  const [searchCollapsed, setSearchCollapsed] = useState(new Set<string>())
  const scroll = useRef<HTMLDivElement>(null)
  const priorScroll = useRef(0)
  const queryRef = useRef(query)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const term = query.trim().toLocaleLowerCase()
  const matches = useMemo(() => new Set(term ? items.filter(o => `${o.name} ${o.code ?? ''}`.toLocaleLowerCase().includes(term)).map(o => o.id) : []), [items, term])
  const visible = useMemo(() => {
    if (!term) return null
    const ids = new Set(matches)
    for (const id of matches) for (const parent of index.ancestors(id)) ids.add(parent)
    return ids
  }, [matches, index, term])
  const isOpen = (id: string) => term ? !searchCollapsed.has(id) : expanded.has(id)
  const branches = [...index.children.keys()].filter((id): id is string => id !== null)
  const flat: string[] = []
  function visit(parent: string | null) { for (const o of index.children.get(parent) ?? []) { if (visible && !visible.has(o.id)) continue; flat.push(o.id); if (isOpen(o.id)) visit(o.id) } }
  visit(null)
  useEffect(() => {
    // 생성/이동한 조직도 선택 경로를 열어 찾을 수 있게 한다. 검색은 기존 탐색 상태를 바꾸지 않는다.
    if (!queryRef.current.trim()) setExpanded(previous => new Set([...previous, ...index.ancestors(selectedId)]))
  }, [selectedId, index])
  function search(value: string) {
    queryRef.current = value
    if (!term && value.trim()) priorScroll.current = scroll.current?.scrollTop ?? 0
    setQuery(value); setSearchCollapsed(new Set())
    requestAnimationFrame(() => { if (scroll.current) scroll.current.scrollTop = value.trim() ? 0 : priorScroll.current })
  }
  function toggle(id: string) {
    const update = (previous: Set<string>) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next }
    if (term) setSearchCollapsed(update); else setExpanded(update)
  }
  function tree(parentId: string | null, level = 1): React.ReactNode {
    return <ul role={parentId === null ? 'tree' : 'group'} aria-label={parentId === null ? '조직 Tree' : undefined}>{(index.children.get(parentId) ?? []).filter(o => !visible || visible.has(o.id)).map(o => {
      const hasChildren = index.children.has(o.id)
      const open = hasChildren && isOpen(o.id)
      return <li key={o.id} role="treeitem" aria-label={o.name} aria-selected={selectedId === o.id} aria-expanded={hasChildren ? open : undefined} aria-level={level}>
        <div className={`org-node ${selectedId === o.id ? 'selected' : ''} ${matches.has(o.id) ? 'search-match' : ''}`}>
          {hasChildren ? <button className="org-toggle" aria-label={`${o.name} ${open ? '접기' : '펼치기'}`} aria-expanded={open} onClick={() => toggle(o.id)}><ChevronRight size={15} className={open ? 'expanded' : ''} /></button> : <span className="org-leaf" aria-hidden="true" />}
          <button className="org-select" ref={element => { if (element) buttons.current.set(o.id, element); else buttons.current.delete(o.id) }} onClick={() => onSelect(o.id)} onKeyDown={e => {
            let target: string | undefined
            if (e.key === 'ArrowDown') target = flat[flat.indexOf(o.id) + 1]
            if (e.key === 'ArrowUp') target = flat[flat.indexOf(o.id) - 1]
            if (e.key === 'Home') target = flat[0]
            if (e.key === 'End') target = flat.at(-1)
            if (e.key === 'ArrowRight' && hasChildren) { if (!open) toggle(o.id); else target = flat[flat.indexOf(o.id) + 1] }
            if (e.key === 'ArrowLeft') { if (open) toggle(o.id); else target = o.parentId ?? undefined }
            if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); if (target) buttons.current.get(target)?.focus() }
          }} title={`${o.name} · ${o.code ?? ''}`}><span className="org-node-name">{level === 1 && <Building2 size={14} aria-hidden="true" />}{o.name}</span><span className="org-node-meta"><span className="org-type">{o.type}</span>{hasChildren && <span>{index.children.get(o.id)!.length}개 하위</span>}{!o.active && <span>비활성</span>}</span></button>
        </div>{open && tree(o.id, level + 1)}
      </li>
    })}</ul>
  }
  return <section className="panel org-explorer" aria-label="조직 탐색"><div className="org-explorer-tools"><h2>조직 탐색 <span>{items.length}개</span></h2><label className="org-search"><Search size={16} aria-hidden="true" /><span className="sr-only">조직 검색</span><input placeholder="조직명 또는 코드" value={query} onChange={e => search(e.target.value)} />{query && <button aria-label="조직 검색 초기화" onClick={() => search('')}><X size={15} /></button>}</label><div className="org-tree-actions"><button onClick={() => term ? setSearchCollapsed(new Set()) : setExpanded(new Set(branches))}>전체 펼치기</button><button onClick={() => term ? setSearchCollapsed(new Set(branches)) : setExpanded(new Set())}>전체 접기</button></div>{term && <p role="status">검색 결과 {matches.size}개 · 상위 경로 함께 표시</p>}</div><div className="org-tree-scroll" ref={scroll}><nav aria-label="조직 계층">{tree(null)}</nav>{term && !matches.size && <p className="org-empty">검색 결과가 없습니다.</p>}</div></section>
}
