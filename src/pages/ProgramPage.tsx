import IntegrationsPage from './system/IntegrationsPage'
import CodesPage from './system/CodesPage'
import HubPage from './hub/HubPage'
import SystemPage from './system/SystemPage'
import AssociationPage from './association/AssociationPage'
import OrganizationsPage from './admin/OrganizationsPage'
import AccountsPage from './admin/AccountsPage'
import PermissionsPage from './admin/PermissionsPage'
import BusinessesPage from './admin/BusinessesPage'
import ProgramsPage from './admin/ProgramsPage'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Blocks } from 'lucide-react'
import { canAccessProgram, navigationFor, usesBusinessContext } from '../access/policy'
import { useApp } from '../state/AppContext'
import { DetailList, PageHeader, StatusBadge } from '../components/common/ui'

export function NotFoundPage({ denied = false }: { denied?: boolean }) {
  return <><PageHeader title={denied ? '접근할 수 없는 화면입니다' : '화면을 찾을 수 없습니다'} description={denied ? '현재 Role·사업·점포 범위에서 제공되지 않는 메뉴입니다.' : '변경되었거나 존재하지 않는 경로입니다.'} /><Link className="button secondary" to="/home"><ArrowLeft size={16} />홈으로 이동</Link></>
}
export default function ProgramPage() {
  const { programId } = useParams()
  const { data, account, business, role, organization } = useApp()
  const { programs } = data
  const program = programs.find((p) => p.id === programId)
  if (!account || !business || !role) return null
  if (!program) return <NotFoundPage />
  if (!canAccessProgram(account, business.id, program, data)) return <NotFoundPage denied />
  const item = navigationFor(account, business.id, data).find((p) => p.id === program.id) ?? program
  if (role.family === 'association' && program.scope !== 'platform' && ['membership-review', 'participation-review', 'companies', 'operators', 'branches', 'fees', 'budget', 'week-plan', 'event-products', 'execution', 'anomalies', 'claims', 'appeals', 'settlement', 'public-participation', 'public-data', 'flyers', 'public-history', 'notices', 'statistics', 'cms-posts', 'cms-banners', 'cms-content', 'cms-signup', 'association-settings'].includes(program.id)) return <AssociationPage key={`${program.id}-${business.id}`} programId={program.id} />
  if (account.roleId === 'system') {
    if (program.id.startsWith('integration-') && ['integration-at','integration-public','integration-finance','integration-other'].includes(program.id)) return <IntegrationsPage key={program.id} programId={program.id} />
    if (program.id === 'codes') return <CodesPage />
    if (['excel-templates', 'jobs', 'notifications', 'audit'].includes(program.id)) return <SystemPage key={program.id} programId={program.id} />
    if (['pos-master', 'pos-capabilities', 'pos-interfaces', 'pos-schema', 'pos-mapping', 'pos-connections', 'pos-history'].includes(program.id)) return <HubPage key={program.id} programId={program.id} />
    if (program.id === 'organizations') return <OrganizationsPage />
    if (program.id === 'accounts') return <AccountsPage />
    if (program.id === 'permissions') return <PermissionsPage />
    if (program.id === 'businesses') return <BusinessesPage />
    if (program.id === 'business-organizations') return <BusinessesPage mode="organizations" />
    if (program.id === 'business-programs') return <BusinessesPage mode="programs" />
    if (program.id === 'programs' || program.id === 'program-status') return <ProgramsPage key={program.id} statusMode={program.id === 'program-status'} />
  }
  return <>
    <PageHeader eyebrow={item.group} title={item.name} description={program.description} actions={<StatusBadge tone="warning">준비 중</StatusBadge>} />
    <section className="panel placeholder-panel"><div className="placeholder-icon"><Blocks size={30} /></div><h2>업무 화면을 준비하고 있습니다</h2><p>현재는 공통 기반을 구성하는 단계입니다.<br />이 메뉴의 상세 조회와 업무 처리는 다음 단계에서 추가됩니다.</p><div className="placeholder-context"><DetailList items={[{ label: '로그인 역할', value: role.name }, { label: '소속 조직', value: organization?.name }, usesBusinessContext(program) ? { label: '조회 사업', value: business.name } : { label: '데이터 범위', value: program.scope === 'platform' ? '플랫폼 전체 · 선택 사업과 무관' : '소속 조직 및 계정 접근 범위' }, { label: '현재 제공 기능', value: '메뉴 접근 및 Context 확인' }]} /></div><Link to="/home" className="button secondary"><ArrowLeft size={16} />홈으로 이동</Link></section>
  </>
}
