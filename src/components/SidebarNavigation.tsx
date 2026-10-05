import { useState } from 'react'
import { ChevronDown, LayoutDashboard } from 'lucide-react'
import { NavLink } from 'react-router'
import type { navigationFor } from '../access/policy'

const memory = new Map<string, Record<string, boolean>>()
function readGroups(accountId: string): Record<string, boolean> {
  try {
    const stored = JSON.parse(localStorage.getItem(`adms.demo.navigation.v1.${accountId}`) ?? 'null')
    if (stored && typeof stored === 'object' && !Array.isArray(stored) && Object.values(stored).every(value => typeof value === 'boolean')) return stored
  } catch { /* 저장소가 없으면 현재 앱 세션에서 유지한다. */ }
  return memory.get(accountId) ?? {}
}
export default function SidebarNavigation({ menu, accountId, pathname, onNavigate }: { menu: ReturnType<typeof navigationFor>; accountId: string; pathname: string; onNavigate: () => void }) {
  const [preferences, setPreferences] = useState(() => readGroups(accountId))
  const [activeVisit, setActiveVisit] = useState<{ pathname: string; closedGroup: string | null }>({ pathname, closedGroup: null })
  if (activeVisit.pathname !== pathname) setActiveVisit({ pathname, closedGroup: null })
  const groups = [...new Set(menu.map(item => item.group))]
  const activeGroup = menu.find(p => pathname === `/p/${p.id}`)?.group
  function toggle(group: string, open: boolean) {
    const next = { ...preferences, [group]: !open }
    setPreferences(next); memory.set(accountId, next)
    if (group === activeGroup) setActiveVisit({ pathname, closedGroup: open ? group : null })
    try { localStorage.setItem(`adms.demo.navigation.v1.${accountId}`, JSON.stringify(next)) } catch { /* 메모리 fallback */ }
  }
  return <nav aria-label="주 메뉴"><NavLink className="home-link" to="/home" onClick={onNavigate}><LayoutDashboard size={18} />홈</NavLink>{groups.map(group => {
    const active = activeGroup === group
    const open = (active && !(activeVisit.closedGroup === group && activeVisit.pathname === pathname)) || preferences[group] === true
    return <details key={group} open={open} className={`menu-group ${active ? 'contains-active' : ''}`}><summary aria-expanded={open} onClick={e => { e.preventDefault(); toggle(group, open) }}><span>{group}</span><ChevronDown size={15} aria-hidden="true" /></summary><div className="menu-children">{menu.filter(p => p.group === group).map(p => <NavLink to={`/p/${p.id}`} key={p.id} style={p.depth ? { paddingLeft: 18 + p.depth * 12 } : undefined} onClick={onNavigate}>{p.depth > 0 && '↳ '}{p.name}</NavLink>)}</div></details>
  })}</nav>
}
