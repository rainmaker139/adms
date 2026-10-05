import { useState } from 'react'
import { ArrowRight, Building2, Search, Store as StoreIcon } from 'lucide-react'
import { Link } from 'react-router'
import { availableBusinesses, navigationFor, scopedCompanies, scopedOrganizations, scopedStores } from '../access/policy'
import { useApp } from '../state/AppContext'
import { statuses } from '../types/status'
import type { RoleFamily, Store } from '../types/platform'
import KpiCard from '../components/KpiCard'
import { DataTable, DetailDialog, DetailList, FilterBar, PageHeader, StatusBadge } from '../components/common/ui'
import OrganizationTree from '../components/OrganizationTree'
import AssociationHome from './association/AssociationHome'

const homeCopy: Record<RoleFamily, { title: string; description: string; focus: string; shortcuts: string[] }> = {
  system: { title: '시스템 관리자 홈', description: '조직·사업·프로그램을 연결하고 플랫폼 운영 기반을 확인합니다.', focus: '플랫폼 운영 공간', shortcuts: ['organizations', 'business-programs', 'programs'] },
  at: { title: '관리감독기관 홈', description: '담당 사업의 운영 범위와 참여점포를 확인합니다.', focus: '사업 감독 공간', shortcuts: ['week-plan', 'claims', 'public-data'] },
  association: { title: '운영기관 홈', description: '소속 회원사와 점포, 선택한 사업의 운영 공간을 확인합니다.', focus: '협회 운영 공간', shortcuts: ['membership-review', 'week-plan', 'public-participation'] },
  branch: { title: '지회 관리자 홈', description: '자기 지회의 회원사와 위임된 업무 범위를 확인합니다.', focus: '지회 업무 공간', shortcuts: ['companies', 'week-plan', 'execution'] },
  mart: { title: '마트 홈', description: '회원사와 점포의 참여사업을 확인하고 필요한 업무로 이동합니다.', focus: '우리 회원사 업무 공간', shortcuts: ['stores', 'event-products', 'public-data', 'join-future'] },
}
export default function HomePage() {
  const { data, account, business, organization, role } = useApp()
  const { companies, participations } = data
  const [query, setQuery] = useState('')
  const [posStatus, setPosStatus] = useState('all')
  const [selected, setSelected] = useState<Store | null>(null)
  if (!account || !business || !role) return null
  if (role.family === 'association') return <AssociationHome key={business.id} />
  const copy = homeCopy[role.family]
  const storeList = scopedStores(account, business.id, data)
  const organizationList = scopedOrganizations(account, business.id, data)
  const companyList = scopedCompanies(account, business.id, data)
  const menu = navigationFor(account, business.id, data)
  const filtered = storeList.filter((store) => `${store.name} ${companies.find((c) => c.id === store.companyId)?.legalName ?? ''}`.includes(query.trim()) && (posStatus === 'all' || store.posConnectionStatus === posStatus))
  const shortcuts = menu.filter((p) => copy.shortcuts.includes(p.id)).slice(0, 3)
  const participationOf = (store: Store) => participations.find((p) => p.storeId === store.id && p.businessId === business.id)
  return <>
    <PageHeader eyebrow="OVERVIEW" title={copy.title} description={copy.description} actions={<StatusBadge tone="info">공통 기반 구성 완료</StatusBadge>} />
    <section className="welcome-panel"><div><p>{copy.focus}</p><h2>{organization?.name}</h2><span>{business.name} <span className="welcome-divider">|</span> {business.startsOn} — {business.endsOn}</span></div><div className="welcome-symbol"><Building2 size={36} /></div></section>
    <div className="kpi-grid"><KpiCard label={role.family === 'system' ? '전체 조직' : '접근 가능한 조직'} value={`${organizationList.length}개`} hint={role.family === 'system' ? '플랫폼 전체 조직 마스터' : '현재 계정의 조직 범위'} /><KpiCard label="선택 사업의 회원사" value={`${companyList.length}개`} hint="접근 가능한 참여점포 기준" /><KpiCard label="선택 사업의 점포" value={`${storeList.length}개`} hint="점포별 참여 상태 포함" /></div>
    <div className="home-columns"><section className="panel business-card"><div className="section-heading"><h2>현재 사업</h2><StatusBadge tone={business.status === 'active' ? 'success' : 'neutral'}>{statuses.business[business.status]}</StatusBadge></div><p>{business.description}</p><DetailList items={[{ label: '사업 코드', value: business.code }, { label: '조회 범위', value: role.scope === 'all' ? '플랫폼 전체' : role.scope === 'business' ? '담당 사업' : organization?.name }, { label: '이용 가능한 사업', value: `${availableBusinesses(account, data).length}개` }]} /></section>
      <section className="panel shortcuts"><div className="section-heading"><h2>업무 바로가기</h2><span>다음 단계 준비</span></div>{shortcuts.map((p) => <Link key={p.id} to={`/p/${p.id}`}><div><strong>{p.name}</strong><span>{p.group}</span></div><ArrowRight size={18} /></Link>)}<p className="muted">{role.family === 'system' ? '조직·계정·권한·사업·프로그램 관리 기능을 시연할 수 있습니다.' : '상세 업무 화면은 준비 중입니다. 로그인과 사업별 탐색을 확인할 수 있습니다.'}</p></section></div>
    <section className="panel store-panel"><div className="section-heading"><div><h2><StoreIcon size={18} />참여점포 둘러보기</h2><p>점포를 선택하면 회원사·조직 연결과 참여 상태를 확인합니다.</p></div><span className="count-label">{filtered.length}개 점포</span></div>
      <FilterBar><label className="search-field"><Search size={17} /><span className="sr-only">점포 또는 회원사 검색</span><input placeholder="점포 또는 회원사 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="inline-field">POS 연동 상태<select aria-label="POS 연동 상태" value={posStatus} onChange={(e) => setPosStatus(e.target.value)}><option value="all">전체 상태</option>{Object.entries(statuses.posConnection).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><button className="button secondary" onClick={() => { setQuery(''); setPosStatus('all') }}>초기화</button></FilterBar>
      <DataTable rows={filtered} rowKey={(store) => store.id} caption="접근 가능한 사업 참여점포" columns={[
        { key: 'name', label: '점포', render: (store) => <button className="text-button" onClick={() => setSelected(store)}>{store.name}</button> },
        { key: 'company', label: '회원사', render: (store) => companies.find((c) => c.id === store.companyId)?.legalName },
        { key: 'region', label: '지역', render: (store) => store.region },
        { key: 'participation', label: '사업 참여', render: (store) => <StatusBadge tone="info">{statuses.participation[participationOf(store)?.status ?? 'none']}</StatusBadge> },
        { key: 'pos', label: 'POS 연동', render: (store) => <StatusBadge tone={store.posConnectionStatus === 'active' ? 'success' : 'neutral'}>{statuses.posConnection[store.posConnectionStatus]}</StatusBadge> },
      ]} />
    </section>
    <OrganizationTree items={organizationList} />
    {selected && <DetailDialog title={selected.name} onClose={() => setSelected(null)}><p className="detail-intro">점포는 회원사와 분리된 운영 단위입니다.</p><DetailList items={[
      { label: '점포 ID', value: selected.id }, { label: '회원사', value: companies.find((c) => c.id === selected.companyId)?.legalName }, { label: '조직 노드', value: selected.organizationId }, { label: '지역', value: selected.region }, { label: '현재 사업', value: business.name }, { label: '참여 상태', value: statuses.participation[participationOf(selected)?.status ?? 'none'] }, { label: 'POS 지정', value: selected.posId ?? '미지정' }, { label: '연동 상태', value: statuses.posConnection[selected.posConnectionStatus] },
    ]} /><div className="notice-box">POS 지정과 연동 완료는 별개입니다. 연결 설정·검증은 다음 단계에서 구현합니다.</div></DetailDialog>}
  </>
}
