import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const url = new URL('../dist/adms-demo.html', import.meta.url).href
const screenshots = new URL('../node_modules/.tmp/', import.meta.url)
await mkdir(screenshots, { recursive: true })
try {
  for (const blocked of [false, true]) {
    const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1000 } })
    if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('Blocked') } }))
    const page = await context.newPage(); page.setDefaultTimeout(7000)
    const errors = []; const requests = []
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()))
    const go = async id => { await page.goto(`${url}#/p/${id}`); await page.locator('main h1').waitFor() }
    const login = async id => { await page.getByLabel('아이디', { exact: true }).fill(id); await page.getByLabel('비밀번호', { exact: true }).fill('1234'); await page.getByRole('button', { name: '로그인', exact: true }).click(); await page.locator('main h1').waitFor() }
    const logout = async () => { await page.getByRole('button', { name: '로그아웃', exact: true }).click(); await page.getByRole('heading', { name: '로그인', exact: true }).waitFor() }
    const dialog = page.getByRole('dialog')
    const save = async () => { await dialog.getByRole('button', { name: '저장', exact: true }).click(); await dialog.waitFor({ state: 'hidden' }) }
    await page.goto(url); await login('admin')
    await go('organizations'); await page.getByRole('button', { name: '조직 추가', exact: true }).click()
    await dialog.getByLabel('조직명', { exact: true }).fill('시연 조직')
    await dialog.getByLabel('조직코드', { exact: true }).fill('DEMO-ORG')
    await dialog.getByLabel('상위조직', { exact: true }).selectOption('assn-org'); await save()
    await page.getByRole('heading', { name: '시연 조직', exact: true }).waitFor()
    await page.getByRole('button', { name: '조직 수정', exact: true }).click()
    await dialog.getByLabel('대표/담당자').fill('시연 담당'); await dialog.getByLabel('상위조직', { exact: true }).selectOption('gyeonggi'); await save()
    assert.ok((await page.locator('.admin-detail').innerText()).includes('시연 담당'))
    await page.getByRole('button', { name: '하위조직 추가', exact: true }).click()
    await dialog.getByLabel('조직명', { exact: true }).fill('시연 회원사'); await dialog.getByLabel('조직코드', { exact: true }).fill('DEMO-COMPANY'); await dialog.getByLabel('조직유형', { exact: true }).fill('회원사'); await save()
    await page.getByRole('button', { name: '하위조직 추가', exact: true }).click()
    await dialog.getByLabel('조직명', { exact: true }).fill('시연 점포'); await dialog.getByLabel('조직코드', { exact: true }).fill('DEMO-STORE'); await dialog.getByLabel('조직유형', { exact: true }).fill('점포'); await save()
    if (!blocked) await page.screenshot({ path: new URL('admin-organizations.png', screenshots).pathname.replace(/^\//, ''), fullPage: true })
    await go('accounts'); await page.getByRole('button', { name: '한빛 부관리자', exact: false }).click()
    await dialog.getByLabel('상태', { exact: true }).selectOption('active'); await save()
    const deputy = page.locator('tbody tr').filter({ hasText: 'mart.deputy' }); assert.ok((await deputy.innerText()).includes('정상'))
    await page.getByRole('button', { name: '한빛유통 대표 관리자', exact: false }).click()
    await dialog.getByLabel('상태', { exact: true }).selectOption('inactive'); await dialog.getByRole('button', { name: '저장', exact: true }).click()
    await dialog.getByRole('alert').filter({ hasText: '경고 확인' }).waitFor()
    await dialog.getByLabel('대표 관리자 변경 영향을 확인했습니다').check(); await save()
    await logout()
    await page.getByLabel('아이디', { exact: true }).fill('mart'); await page.getByLabel('비밀번호', { exact: true }).fill('1234'); await page.getByRole('button', { name: '로그인', exact: true }).click(); await page.getByRole('alert').waitFor()
    await login('admin'); await go('accounts'); await page.getByRole('button', { name: '한빛유통 대표 관리자', exact: false }).click(); await dialog.getByLabel('상태', { exact: true }).selectOption('active'); await save()
    await go('permissions'); assert.ok(await page.getByRole('button', { name: '권한 저장', exact: true }).isDisabled())
    await page.getByRole('button', { name: 'Role 생성', exact: true }).click(); await dialog.getByLabel('Role 이름').fill('시연 운영자'); await save()
    await go('programs'); await page.getByRole('button', { name: '신규 등록', exact: true }).click()
    await dialog.getByLabel('프로그램명', { exact: true }).fill('시연 업무'); await dialog.getByLabel('프로그램 코드', { exact: true }).fill('DEMO-PROGRAM'); await save()
    await go('permissions'); await page.getByRole('button', { name: '시연 운영자', exact: false }).click()
    await page.getByLabel('프로그램 검색', { exact: true }).fill('시연 업무'); await page.getByLabel('시연 업무 조회', { exact: true }).check(); await page.getByRole('button', { name: '권한 저장', exact: true }).click()
    await page.getByLabel('프로그램 검색', { exact: true }).fill('')
    if (!blocked) await page.screenshot({ path: new URL('admin-permissions.png', screenshots).pathname.replace(/^\//, ''), fullPage: true })
    await go('accounts'); await page.getByRole('button', { name: '신규 등록', exact: true }).click(); await dialog.getByLabel('이름', { exact: true }).fill('시연 운영 계정'); await dialog.getByLabel('ID', { exact: true }).fill('demo.editor'); await dialog.getByLabel('Role', { exact: true }).selectOption({ label: '시연 운영자' }); await dialog.getByLabel('상태', { exact: true }).selectOption('active'); await save()
    await go('businesses'); await page.getByRole('button', { name: '신규 등록', exact: true }).click()
    await dialog.getByLabel('사업명', { exact: true }).fill('시연 사업'); await dialog.getByLabel('사업코드', { exact: true }).fill('DEMO-BIZ'); await dialog.getByLabel('시작일', { exact: true }).fill('2026-01-01'); await dialog.getByLabel('종료일', { exact: true }).fill('2026-12-31'); await save()
    await page.getByRole('button', { name: '참여 조직/역할', exact: true }).click(); await page.getByLabel('연결할 조직').selectOption('assn-org'); await page.getByLabel('사업 내 역할').selectOption('operator'); await page.getByRole('button', { name: '연결 추가', exact: true }).click(); await page.getByRole('button', { name: '조직 연결 저장', exact: true }).click()
    await page.getByRole('button', { name: '사용 프로그램', exact: true }).click(); await page.getByLabel('농할 운영 / 시연 업무', { exact: true }).check(); await page.getByRole('button', { name: '프로그램 연결 저장', exact: true }).click()
    if (!blocked) {
      await page.reload(); await go('organizations'); await page.getByRole('button', { name: '전체 펼치기', exact: true }).click(); await page.getByRole('navigation', { name: '조직 계층' }).getByRole('button', { name: '시연 점포', exact: false }).click(); await page.getByRole('heading', { name: '시연 점포', exact: true }).waitFor()
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('adms.demo.data.v2')).data)
      assert.ok(stored.companies.some(c => c.legalName === '시연 회원사')); assert.ok(stored.stores.some(s => s.name === '시연 점포')); assert.ok(stored.changes.length >= 12)
    }
    await logout(); await login('demo.editor'); await page.getByLabel('선택 사업', { exact: true }).selectOption({ label: '시연 사업' })
    await page.locator('.menu-group summary').filter({ hasText: '농할 운영' }).click(); await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '시연 업무', exact: true }).click(); await page.getByRole('heading', { name: '시연 업무', exact: true }).waitFor()
    const customPath = page.url()
    await logout(); await login('admin'); await go('program-status'); await page.getByRole('button', { name: '시연 업무', exact: false }).click(); await dialog.getByLabel('프로그램 활성', { exact: true }).uncheck(); await dialog.getByRole('button', { name: '저장', exact: true }).click(); await dialog.getByRole('alert').waitFor(); await dialog.getByLabel('프로그램 사용중지 영향을 확인했습니다').check(); await save()
    await logout(); await login('demo.editor'); await page.getByLabel('선택 사업', { exact: true }).selectOption({ label: '시연 사업' }); assert.equal(await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '시연 업무', exact: true }).count(), 0)
    await page.goto(customPath); await page.getByRole('heading', { name: '접근할 수 없는 화면입니다', exact: true }).waitFor()
    await logout(); await login('admin'); await go('program-status'); await page.getByLabel('프로그램 상태', { exact: true }).selectOption('inactive'); await page.getByRole('button', { name: '시연 업무', exact: false }).click(); await dialog.getByLabel('프로그램 활성', { exact: true }).check(); await save()
    await go('business-programs'); await page.getByLabel('선택 사업', { exact: true }).selectOption('fish-2025'); assert.ok(await page.getByRole('button', { name: '프로그램 연결 저장', exact: true }).isDisabled())
    await go('business-organizations'); assert.ok(await page.getByRole('button', { name: '조직 연결 저장', exact: true }).isDisabled())
    await go('programs'); const before = await page.locator('tbody code').allTextContents(); await page.getByLabel('선택 사업', { exact: true }).selectOption('pilot-2027'); assert.deepEqual(await page.locator('tbody code').allTextContents(), before)
    await page.setViewportSize({ width: 390, height: 844 }); await go('organizations'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '관리 화면 모바일 가로 넘침 없음')
    assert.deepEqual(errors, []); assert.ok(requests.every(r => r.split('#')[0] === url), `추가 요청 ${requests.join(',')}`)
    console.log(`관리자 Edge file:// offline 통과 [저장소 ${blocked ? '차단' : '허용'}]: 조직 생성/이동/회원사/점포, 계정 상태/대표 경고, Role/권한, 사업/조직/프로그램 매핑, 신규 Role 로그인 메뉴, 중지/재활성화/직접경로 거부, 종료 사업 제한, 전역 마스터 독립, 모바일, JS오류/외부요청 0${!blocked ? ', 새로고침 후 변경 유지' : ''}`)
    await context.close()
  }
} finally { await browser.close() }
