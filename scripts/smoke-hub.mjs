import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const file = new URL('../dist/adms-demo.html', import.meta.url).href
await mkdir('node_modules/.tmp', { recursive: true })
const menus = { 'pos-master': 'POS 마스터', 'pos-capabilities': 'Capability', 'pos-interfaces': '데이터소스·인터페이스', 'pos-schema': '표준 스키마', 'pos-mapping': '필드·코드 매핑', 'pos-connections': '점포 POS 연동', 'pos-history': '연동 현황·이력' }
try {
  for (const blocked of [false, true]) {
    const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1000 } })
    if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked') } }))
    const page = await context.newPage(); page.setDefaultTimeout(7000)
    const errors = []; const requests = []
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()))
    const go = async (id, query = '') => { await page.goto(`${file}#/p/${id}${query ? '?' + query : ''}`); await page.getByRole('heading', { name: menus[id], exact: true }).waitFor() }
    const dialog = page.getByRole('dialog')
    const save = async () => { await dialog.getByRole('button', { name: '저장', exact: true }).click(); await dialog.waitFor({ state: 'hidden' }) }
    await page.goto(file); await page.getByLabel('아이디', { exact: true }).fill('admin'); await page.getByLabel('비밀번호', { exact: true }).fill('1234'); await page.getByRole('button', { name: '로그인', exact: true }).click(); await page.getByRole('heading', { name: '시스템 관리자 홈', exact: true }).waitFor()
    for (const id of Object.keys(menus)) {
      await go(id); assert.equal(await page.locator('.placeholder-panel').count(), 0, `${id}는 실제 화면이어야 함`)
      const original = await page.locator('main').innerText(); await page.getByLabel('선택 사업', { exact: true }).selectOption('pilot-2027'); assert.deepEqual(await page.locator('main').innerText(), original, '플랫폼 전역 HUB는 사업 선택과 독립')
    }
    await go('pos-master'); await page.getByRole('button', { name: '신규 등록', exact: true }).click(); await dialog.getByLabel('회사명', { exact: true }).fill('시연 공급사'); await dialog.getByLabel('POS명', { exact: true }).fill('신규 시연 POS'); await dialog.getByLabel('POS 코드', { exact: true }).fill('NEW-DEMO-POS'); await save()
    await page.getByRole('heading', { name: '신규 시연 POS', exact: true }).waitFor(); await page.getByRole('button', { name: 'POS 수정', exact: true }).click(); await dialog.getByLabel('서비스 설명', { exact: true }).fill('시연 등록/수정 확인'); await save(); assert.ok((await page.locator('main').innerText()).includes('시연 등록/수정 확인'))
    await go('pos-capabilities', 'pos=sample-pos')
    assert.equal(await page.locator('tbody tr').filter({ hasText: 'SaleTransaction' }).count(), 0)
    await page.getByLabel('농할 판매실적 수집', { exact: true }).check(); assert.ok(await page.locator('tbody tr').filter({ hasText: 'SaleTransaction' }).count())
    await page.getByLabel('Capability 변경 영향을 확인했습니다').check(); await page.getByRole('button', { name: 'Capability 저장', exact: true }).click()
    await go('pos-interfaces', 'pos=sample-pos'); await page.getByRole('button', { name: 'Excel (시연)', exact: true }).click(); await dialog.getByLabel('농할 판매실적 수집', { exact: true }).check(); await save()
    await go('pos-schema'); await page.getByRole('button', { name: 'SaleTransaction', exact: false }).click(); await page.getByRole('button', { name: 'support_amount', exact: false }).click(); await dialog.waitFor(); assert.ok((await dialog.innerText()).includes('농할지원금')); await page.keyboard.press('Escape')
    await go('pos-mapping', 'pos=sample-pos&interface=sample-excel&schema=SaleTransaction'); assert.ok((await page.locator('main').innerText()).includes('미매핑'))
    await page.getByRole('button', { name: '원천명 기반 가매핑', exact: true }).click(); await page.getByRole('button', { name: '매핑 검증', exact: true }).click(); assert.ok((await page.locator('.notice-box').filter({ hasText: '필수 미매핑/검증 대기/오류' }).innerText()).includes('0건'))
    await page.getByRole('button', { name: 'sale_type', exact: false }).click(); await dialog.getByLabel('코드값 변환 (한 줄에 원천=표준)', { exact: true }).fill('0=NORMAL\n1=CANCEL\n2=RETURN'); await save(); await page.getByRole('button', { name: '매핑 검증', exact: true }).click()
    if (!blocked) { await page.locator('main h1').click(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: 'node_modules/.tmp/hub-mapping.png' }) }
    await go('pos-connections', 'store=magok'); await page.getByRole('button', { name: '연결 설정', exact: true }).click()
    await dialog.getByLabel('사용 POS', { exact: true }).selectOption('hipos'); await dialog.getByLabel('연결 Interface', { exact: true }).selectOption('hipos-cloud'); assert.equal(await dialog.getByLabel('Tenant ID', { exact: true }).count(), 1); assert.equal(await dialog.getByLabel('Server IP / Host', { exact: true }).count(), 0)
    await dialog.getByLabel('사용 POS', { exact: true }).selectOption('sample-pos'); await dialog.getByLabel('연결 Interface', { exact: true }).selectOption('sample-db'); assert.equal(await dialog.getByLabel('Server IP / Host', { exact: true }).count(), 1)
    await dialog.getByLabel('연결 Interface', { exact: true }).selectOption('sample-excel'); assert.equal(await dialog.getByLabel('시트명', { exact: true }).count(), 1); await dialog.getByRole('button', { name: '시연값 채우기', exact: true }).click(); await save()
    assert.ok((await page.locator('.admin-detail').innerText()).includes('연결테스트 대기')); assert.ok(await page.getByRole('button', { name: '연동 활성화', exact: true }).isDisabled())
    await page.getByLabel('Mock 검증 시나리오', { exact: true }).selectOption('connection'); await page.getByRole('button', { name: '연결 테스트 실행', exact: true }).click(); assert.ok((await page.locator('.admin-detail').innerText()).includes('연동오류'))
    await page.getByLabel('Mock 검증 시나리오', { exact: true }).selectOption('success')
    for (const name of ['연결 테스트', '점포 식별 확인', 'Sample 데이터 수신', 'Schema Mapping 검증']) await page.getByRole('button', { name: `${name} 실행`, exact: true }).click()
    await page.getByLabel('Mock 검증 시나리오', { exact: true }).selectOption('sales'); await page.getByRole('button', { name: 'Capability별 데이터 검증 실행', exact: true }).click(); assert.ok(await page.getByRole('button', { name: '연동 활성화', exact: true }).isDisabled())
    await page.getByLabel('Mock 검증 시나리오', { exact: true }).selectOption('success'); await page.getByRole('button', { name: 'Capability별 데이터 검증 실행', exact: true }).click(); await page.getByRole('button', { name: '연동 활성화', exact: true }).click(); await page.getByRole('button', { name: 'Mock 데이터 수집', exact: true }).click()
    assert.ok((await page.locator('.admin-detail').innerText()).includes('정상연동')); assert.ok((await page.locator('.admin-detail').innerText()).includes('내장 Sample 12건 처리'))
    await go('pos-mapping', 'pos=hipos&interface=hipos-agent&schema=SaleTransaction'); await page.getByRole('button', { name: 'support_amount', exact: false }).click(); await dialog.getByLabel('POS 원천 Field', { exact: true }).selectOption('SUPPORT_AMT'); await save(); await page.getByRole('button', { name: '매핑 검증', exact: true }).click()
    await go('pos-connections', 'store=gangseo'); for (const name of ['Schema Mapping 검증', 'Capability별 데이터 검증']) await page.getByRole('button', { name: `${name} 실행`, exact: true }).click(); await page.getByRole('button', { name: '연동 활성화', exact: true }).click()
    await go('pos-connections', 'store=main'); await page.getByRole('button', { name: '연결 설정', exact: true }).click(); assert.equal(await dialog.getByLabel('Secret', { exact: true }).inputValue(), ''); await dialog.getByLabel('Secret', { exact: true }).fill('ONLY-TRANSIENT-DEMO-SECRET');
    await dialog.getByLabel('접속정보 변경과 재검증을 확인했습니다').check(); await save()
    if (!blocked) { const stored = await page.evaluate(() => localStorage.getItem('adms.demo.data.v2')); assert.ok(!stored.includes('ONLY-TRANSIENT-DEMO-SECRET')); await page.reload(); await page.getByRole('heading', { name: '점포 POS 연동', exact: true }).waitFor() }
    await page.getByRole('button', { name: '연결 설정', exact: true }).click(); assert.equal(await dialog.getByLabel('Secret', { exact: true }).inputValue(), ''); await page.keyboard.press('Escape')
    await go('pos-history', 'store=magok'); assert.ok((await page.locator('.admin-detail').innerText()).includes('Mock 데이터 수집')); await page.getByRole('button', { name: '연동 중지', exact: true }).click(); assert.ok((await page.locator('.admin-detail').innerText()).includes('연동중지')); await page.getByRole('button', { name: '재연결 / 재검증', exact: true }).click(); assert.ok((await page.locator('.admin-detail').innerText()).includes('연결테스트 대기'))
    if (!blocked) { await page.locator('main h1').click(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: 'node_modules/.tmp/hub-connections.png' }) }
    await go('pos-capabilities', 'pos=sample-pos'); await page.getByLabel('농할 판매실적 수집', { exact: true }).uncheck(); await page.getByLabel('Capability 변경 영향을 확인했습니다').check(); await page.getByRole('button', { name: 'Capability 저장', exact: true }).click()
    await go('pos-mapping', 'pos=sample-pos&interface=sample-excel&schema=SaleTransaction'); assert.equal(await page.getByRole('button', { name: 'sale_type', exact: false }).count(), 0)
    await page.getByRole('checkbox').check(); assert.equal(await page.getByRole('button', { name: 'sale_type', exact: false }).count(), 1, 'Capability OFF 이후 기존 매핑 보존')
    await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'HUB 모바일 가로 넘침 없음')
    assert.deepEqual(errors, []); assert.ok(requests.every(r => r.split('#')[0] === file), `외부 요청: ${requests.join(',')}`)
    console.log(`POS HUB Edge file:// offline 통과 [저장소 ${blocked ? '차단' : '허용'}]: 7개 실제 화면, 전역 범위, POS 등록/수정, Capability 요구 생성, Interface 연결, Schema 상세, 가매핑/코드/검증, 동적 접속 폼, 실패/복구/활성화, 수집/이력/중지/재연결, Secret 원문 미저장, 모바일, 외부요청/JS오류 0`)
    await context.close()
  }
} finally { await browser.close() }
