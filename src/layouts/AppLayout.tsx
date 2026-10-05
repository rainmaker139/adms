import SidebarNavigation from '../components/SidebarNavigation'
import { useState } from 'react'
import { Building2, Layers3, LogOut, Menu, X } from 'lucide-react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { availableBusinesses, canAccessProgram, navigationFor, usesBusinessContext } from '../access/policy'
import { statuses } from '../types/status'
import { useApp } from '../state/AppContext'
import { StatusBadge } from '../components/common/ui'

export default function AppLayout() {
  const { data, account, business, organization, role, logout, selectBusiness } = useApp()
  const { programs } = data
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  if (!account || !business || !role) return <Navigate to="/login" replace />
  const menu = navigationFor(account, business.id, data)
  const currentProgram = programs.find((p) => location.pathname === `/p/${p.id}`)
  function changeBusiness(id: string) {
    selectBusiness(id)
    // 전역 마스터와 접근 가능한 사업 연결 화면은 현재 경로를 유지한다.
    if (!account || account.roleId !== 'system' || !currentProgram || !canAccessProgram(account, id, currentProgram, data)) navigate('/home')
    setOpen(false)
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus() }}>본문으로 이동</a>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="메뉴 닫기" />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><span className="brand-mark"><Layers3 size={21} /></span><div><strong>ADMS</strong><small>통합 운영 플랫폼</small></div><button className="icon-button mobile-only" aria-label="메뉴 닫기" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="workspace-label"><span>WORKSPACE</span><strong>{role.name}</strong></div>
      <SidebarNavigation key={account.id} accountId={account.id} menu={menu} pathname={location.pathname} onNavigate={() => setOpen(false)} />
      <div className="sidebar-footer"><span className="online-dot" />OFFLINE DEMO <small>관리자 데모 v0.2</small></div>
    </aside>
    <div className="workspace">
      <header className="app-header"><div className="context-control"><button className="icon-button mobile-only" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button><label htmlFor="business-select">{account.roleId === 'system' ? '업무 조회 사업' : '선택 사업'}</label><select id="business-select" aria-label="선택 사업" value={business.id} onChange={(e) => changeBusiness(e.target.value)}>{!business.id && <option value="">연결된 사업 없음</option>}{availableBusinesses(account, data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><StatusBadge tone={business.status === 'active' ? 'success' : 'neutral'}>{statuses.business[business.status]}</StatusBadge></div>
        <div className="user-area"><div><strong>{account.name}</strong><span>{organization?.name}</span></div><button className="logout-button" onClick={() => { logout(); navigate('/login', { replace: true }) }}><LogOut size={16} /><span>로그아웃</span></button></div>
      </header>
      <div className="context-strip"><Building2 size={14} /><span>{organization?.name}</span><span className="context-separator">/</span><span>{role.name}</span><span className="demo-pill">시연용 데이터</span></div>
      <main id="main-content" tabIndex={-1} className="content"><Outlet key={`${account.id}:${currentProgram && !usesBusinessContext(currentProgram) ? 'shared' : business.id}`} /></main>
      <footer className="app-footer">ADMS · 내부 시연용<span>Mock 인증 / 오프라인 환경</span></footer>
    </div>
  </div>
}
