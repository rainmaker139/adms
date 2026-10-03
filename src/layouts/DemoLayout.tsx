import { LayoutDashboard, Store, Sprout } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
const menus = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/markets', label: '참여마트', icon: Store },
  { to: '/operations', label: '농할운영', icon: Sprout },
]
export default function DemoLayout() {
  return <div className="flex min-h-screen">
    <aside className="w-40 shrink-0 border-r border-slate-200 bg-white p-4 sm:w-52">
      <p className="mb-6 font-semibold">ADMS Demo</p>
      <nav aria-label="시연 메뉴" className="space-y-2">
        {menus.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}
          className={({ isActive }) => `flex items-center gap-2 rounded p-2 text-sm ${isActive ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}>
          <Icon size={18} aria-hidden="true" />{label}
        </NavLink>)}
      </nav>
    </aside>
    <main className="min-w-0 flex-1 p-4 sm:p-8">
      <p className="mb-4 text-sm text-slate-500">오프라인 단일 HTML 동작 검증 · 모든 수치는 mock 데이터</p>
      <Outlet />
    </main>
  </div>
}



