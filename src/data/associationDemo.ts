import type { PlatformData } from '../types/platform.ts'

// Additive demo fixtures. Existing entities, claims, ledger entries and user edits are preserved.
export function expandAssociationDemo(p: PlatformData, fresh = false) {
  if (!p.organizations.some(o => o.id === 'assn-org') || p.organizations.some(o => o.id === 'demo-member-01-org')) return
  const branches = ['gyeonggi', 'demo-seoul', 'gangwon', 'demo-chungcheong', 'demo-jeolla']
  ;[['demo-seoul', '서울지회'], ['demo-chungcheong', '충청지회'], ['demo-jeolla', '전라지회']].forEach(([id, name]) => p.organizations.push({ id, name, parentId: 'assn-org', type: '지회', active: true, code: id.toUpperCase(), contactName: '김운영', phone: '02-0000-1250' }))
  const names = ['늘푸른유통', '서울상회', '강산마트', '정다운유통', '남도식품', '우리동네유통', '도담마트', '산들유통', '청솔식품', '행복마트', '가온유통', '온누리상회', '동해유통', '한결식품', '해오름마트', '좋은이웃유통', '다온마트', '백두유통', '풍년식품', '새길마트', '든든유통', '열린상회', '솔향마트', '마루유통']
  const addedStores: string[] = []
  names.forEach((name, i) => {
    const id = `demo-member-${String(i + 1).padStart(2, '0')}`, orgId = `${id}-org`, parentId = branches[i % branches.length], region = ['경기', '서울', '강원', '충청', '전라'][i % 5], active = i % 11 !== 10
    p.organizations.push({ id: orgId, parentId, name: `${name}(주)`, type: '회원사', active, code: `MEM-${String(i + 1).padStart(3, '0')}`, contactName: `${['김','이','박','최','정'][i % 5]}담당`, phone: `010-0000-${String(2000 + i)}` })
    p.companies.push({ id, organizationId: orgId, legalName: `${name}(주)`, representativeName: `${['김','이','박','최','정'][i % 5]}${['민수','서연','지훈','수진'][i % 4]}` })
    p.workflow.companyProfiles.push({ companyId: id, registrationNo: `120-${String(20 + i)}-${String(31000 + i)}`, phone: `010-0000-${2000 + i}`, address: `${region} 중앙로 ${12 + i}`, document: '사업자등록증 확인본', bankVerified: i % 9 !== 8 })
    const storeCount = [1, 2, 3, 3][i % 4] + (i === 23 ? 1 : 0)
    for (let j = 0; j < storeCount; j++) {
      const storeId = `${id}-store-${j + 1}`, storeOrg = `${storeId}-org`, posId = [null, 'hipos', 'sample-pos'][(i + j) % 3]
      p.organizations.push({ id: storeOrg, parentId: orgId, name: `${name} ${j ? `${j + 1}호점` : '본점'}`, type: '점포', active, code: `STR-${i + 1}-${j + 1}` })
      p.stores.push({ id: storeId, organizationId: storeOrg, companyId: id, name: `${name} ${j ? `${j + 1}호점` : '본점'}`, region, posId, posConnectionStatus: 'unset' })
      p.workflow.storeProfiles.push({ storeId, address: `${region} 중앙로 ${12 + i} ${j + 1}층`, phone: `02-0000-${2200 + i}`, hours: j % 2 ? '10:00~21:00' : '09:00~22:00', holiday: i % 3 ? '매월 둘째 일요일' : '연중무휴', delivery: i % 3 !== 0, pickup: i % 2 === 0 })
      const base=p.hub.connections.find(c=>c.storeId===(posId==='hipos'?'main':posId==='sample-pos'?'gangseo':'magok'))!; const connection=base.posId===posId?{...structuredClone(base),storeId,revision:1}:{...structuredClone(p.hub.connections.find(c=>c.storeId==='magok')!),storeId,posId,revision:1}; if(posId==='sample-pos' && i%4===0) {connection.status='error';connection.lastError='판매 데이터 수집 지연'} p.hub.connections.push(connection); p.stores[p.stores.length-1].posConnectionStatus=connection.status
      for (const businessId of ['nonghal-2026', 'public-2026']) {
        const participating = active && (businessId === 'nonghal-2026' ? i % 4 !== 3 : i % 3 !== 2)
        p.participations.push({ businessId, storeId, status: participating ? 'active' : i === 23 ? 'stopping' : 'none' })
        if (participating) {
          if (!p.businessOrganizations.some(m => m.businessId === businessId && m.organizationId === orgId)) p.businessOrganizations.push({ businessId, organizationId: orgId, role: 'participant' })
          p.businessOrganizations.push({ businessId, organizationId: storeOrg, role: 'store' })
        }
      }
      addedStores.push(storeId)
    }
    p.accounts.push({ id: `account-${id}`, loginId: `${id}.owner`, name: `${name} 대표관리자`, organizationId: orgId, companyId: id, roleId: 'martOwner', status: active ? i % 7 === 6 ? 'pending' : 'active' : 'inactive', storeAccess: 'company', phone: `010-0000-${2000 + i}` })
    const overdue = i % 6 === 2 ? 1 : i % 6 === 3 ? 3 : 0
    for (let n = overdue; n >= 0; n--) p.workflow.dues.push({ id: n ? `due-${id}-2026-${10-n}` : `due-${id}`, operatorId: 'assn-org', companyId: id, month: `2026-${String(10-n).padStart(2,'0')}`, amount: 100000, source: i % 4 === 0 ? '초기이관' : '월 정기회비' })
    const state = i % 6, dueId = `due-${id}`
    if ([0, 4, 5].includes(state)) {
      const amount = state === 5 ? 50000 : 100000, depositId = `demo-deposit-${id}`
      p.workflow.deposits.push({ id: depositId, operatorId: 'assn-org', at: `2026-10-${String(2 + i % 4).padStart(2,'0')} 10:20`, payer: `${name} 회비`, amount, candidateId: id, confidence: state === 4 ? 100 : 96, status: 'confirmed', category: '회비', source: state === 4 ? '수기' : '자동입금' })
      p.workflow.receipts.push({ id: `receipt-${depositId}`, depositId, dueId, companyId: id, amount, category: '회비', memo: state === 5 ? '부분납' : '납부 확인' })
      if (state === 4) { const nextDue = `${dueId}-2026-11`, prepayId = `${depositId}-prepay`; p.workflow.dues.push({ id: nextDue, operatorId: 'assn-org', companyId: id, month: '2026-11', amount: 100000, source: '선납 대상' }); p.workflow.deposits.push({ id: prepayId, operatorId: 'assn-org', at: '2026-10-03 13:00', payer: `${name} 선납`, amount: 100000, candidateId: id, confidence: 100, status: 'confirmed', category: '회비', source: '자동입금' }); p.workflow.receipts.push({ id: `receipt-${prepayId}`, depositId: prepayId, dueId: nextDue, companyId: id, amount: 100000, category: '회비', memo: '차월 선납' }) }
    } else p.workflow.deposits.push({ id: `demo-deposit-${id}`, operatorId: 'assn-org', at: '2026-10-05 08:40', payer: i % 2 ? `입금자 ${i + 1}` : name, amount: 100000, candidateId: id, confidence: i % 2 ? 48 : 91, status: 'suggested', category: '미분류', source: i % 2 ? 'Excel' : '자동입금' })
  })
  const notices = [['회비 납부 및 입금자명 안내','회비 입금 시 회원사명을 기재해 주세요.','notice'],['정산 증빙자료 제출 안내','거래명세서와 소명자료의 제출 기간을 확인해 주세요.','notice'],['시스템 점검 안내','주말 점검 일정 및 업무 유의사항을 안내합니다.','notice'],['사업 참여 점포 정보 확인','참여 점포의 담당자와 사업자 정보를 확인해 주세요.','notice'],['지역 유통 상생 소식','지회별 협력 활동과 지원 사업을 소개합니다.','cms-posts'],['회원사 교육 안내','실무자 정산 교육 일정과 신청 방법을 안내합니다.','cms-posts'],['가을 행사 안내','행사 기간과 참여 방법을 확인하세요.','cms-banners'],['회비 납부 안내','회원사 정기 회비 안내','cms-banners'],['지회 안내','지역별 지회 연락처와 운영 안내','cms-content'],['회원사 혜택','회원사 지원사업 및 교육 프로그램 안내','cms-content']]
  notices.forEach(([title,body,kind],i)=>p.workflow.notices.push({id:`demo-content-${i}`,operatorId:'assn-org',title,body,audience:kind==='notice'?'전체 회원사':'외부 홈페이지',startsOn:`2026-10-0${i%4+1}`,endsOn:'2026-10-31',important:i===1,kind,active:i!==6}))
  for (let i=0;i<4;i++) p.workflow.applications.push({id:`demo-application-${i}`,operatorId:'assn-org',name:['새한상회(주)','동네식품(주)','좋은마트(주)','늘푸른유통(주)'][i],registrationNo:`210-45-${50100+i}`,representative:['김지은','박서준','이도윤','김민수'][i],phone:'010-0000-1300',email:'office@example.invalid',address:'경기 중앙로 30',posId:'sample-pos',document:'사업자등록증 확인본',appliedAt:`2026-10-0${i+1}`,status:(['pending','reviewing','rejected','approved'] as const)[i],reason:i===2?'필수 서류 보완 필요':i===3?'서류 확인 완료':'',...(i===3?{companyId:'demo-member-01'}:{})})
  if (!fresh) return // Existing operational money and snapshots are never recalculated during migration.
  const participating = addedStores.filter(id => p.participations.some(s => s.storeId === id && s.businessId === 'nonghal-2026' && s.status === 'active'))
  for (const tag of ['current','next','past']) {
    const round = p.workflow.rounds.find(r => r.id === `assn-org-nonghal-2026-${tag}`)!
    const existing = p.workflow.allocations.filter(a => a.roundId === round.id)
    existing.forEach((a, i) => a.amount = [33000000, 15000000, 7000000][i])
    participating.forEach((storeId, i) => {
      const amount = Math.floor(40000000 / participating.length) + (i === 0 ? 40000000 % participating.length : 0), productId = `${round.id}-${storeId}-apple`, status = tag === 'next' && i % 4 === 0 ? 'draft' as const : i % 6 === 0 ? 'exception' as const : 'confirmed' as const
      p.workflow.allocations.push({ roundId: round.id, storeId, branchId: null, amount })
      p.workflow.products.push({ id: productId, roundId: round.id, storeId, representativeId: 'apple', name: status === 'draft' ? '' : '농할 국내산 사과 1kg', price: 10000, photo: status !== 'draft', override: status === 'exception' ? 'name-change' : '', source: 'Excel', status, confirmedAt: status === 'draft' ? '' : '2026-10-04 11:00' })
      if (tag !== 'next' && i % 5 !== 0) { const support = Math.floor(amount * (tag === 'current' ? [0.3,0.55,0.75,0.9][i % 4] : .7) / 2000) * 2000; p.workflow.transactions.push({ id: `sale-${productId}`, roundId: round.id, storeId, productId, at: tag === 'current' ? '2026-10-05T09:20' : '2026-09-29T15:00', quantity: support / 2000, price: 10000, support, source: 'Excel', valid: true, exclusion: '' }) }
    })
  }
  addedStores.filter(id => p.participations.some(s => s.storeId === id && s.businessId === 'public-2026' && s.status === 'active')).forEach((storeId, i) => { const productId = `public-${storeId}`; p.workflow.publicProducts.push({ id: productId, operatorId: 'assn-org', businessId: 'public-2026', storeId, productId: '', name: ['행사 사과 1kg','행사 계란 30구','제철 배 1kg'][i % 3], price: [8000,5000,6500][i % 3], startsOn: '2026-10-01', endsOn: '2026-10-07', visible: i % 4 !== 0, source: 'flyer' }); p.workflow.integrations.push({ operatorId: 'assn-org', businessId: 'public-2026', storeId, lastSuccess: i % 7 === 0 ? '' : '2026-10-05 09:00', nextAt: '2026-10-05 10:00', error: i % 7 === 0 ? '응답 지연' : '', currentProductIds: i % 4 !== 0 && i % 7 !== 0 ? [productId] : [], attempts: [] }) })
}
