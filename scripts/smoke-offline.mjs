import { seed } from '../src/data/seed.ts'
import { scopedStores } from '../src/access/policy.ts'
// 개발 PC의 Playwright index.mjs 경로를 인자로 받는다. 배포 HTML에는 포함되지 않는다.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const fileUrl = new URL('../dist/adms-demo.html', import.meta.url).href
const screenshotDir = new URL('../node_modules/.tmp/', import.meta.url)
await mkdir(screenshotDir, { recursive: true })
const titles = { admin: '시스템 관리자 홈', at: '관리감독기관 홈', assn: '운영기관 홈', mart: '마트 홈' }

async function login(page, id) {
  await page.getByLabel('아이디', { exact: true }).fill(id)
  await page.getByLabel('비밀번호', { exact: true }).fill('1234')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByRole('heading', { name: titles[id], exact: true }).waitFor()
}
try {
  for (const blockStorage of [false, true]) {
    const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1024 } })
    if (blockStorage) await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage intentionally blocked') } })
    })
    const page = await context.newPage()
    page.setDefaultTimeout(8000)
    const requests = []
    const errors = []
    page.on('request', (request) => requests.push(request.url()))
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${fileUrl}#/p/audit`)
    await page.getByRole('heading', { name: '로그인', exact: true }).waitFor()
    await page.getByLabel('아이디', { exact: true }).fill('admin')
    await page.getByLabel('비밀번호', { exact: true }).fill('bad')
    await page.getByRole('button', { name: '로그인', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: '올바르지 않습니다' }).waitFor()
    await page.getByLabel('아이디', { exact: true }).fill('unknown')
    await page.getByLabel('비밀번호', { exact: true }).fill('1234')
    await page.getByRole('button', { name: '로그인', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: '올바르지 않습니다' }).waitFor()
    if (!blockStorage) await page.screenshot({ path: new URL('adms-login.png', screenshotDir).pathname.replace(/^\//, ''), fullPage: true })
    for (const id of ['admin', 'at', 'assn', 'mart']) {
      await login(page, id)
      const nav = page.getByRole('navigation', { name: '주 메뉴' })
      const labels = await nav.locator('a').allTextContents()
      assert.ok(labels.includes('홈'))
      if (id === 'admin') { assert.ok(labels.includes('권한 관리')); assert.ok(labels.includes('점포 POS 연동')) }
      if (id === 'at') { assert.ok(labels.includes('주차별 계획 관리')); assert.ok(!labels.includes('이상 감지')); assert.ok(!labels.includes('최종 정산·지급')) }
      if (id === 'assn') { assert.ok(labels.includes('회비·수납')); assert.ok(labels.includes('예산 관리')); assert.ok(labels.includes('이상 감지')) }
      if (id === 'mart') { assert.ok(labels.includes('농할 참여')); assert.ok(labels.includes('행사상품 등록')); assert.ok(!labels.includes('권한 관리')) }
      if (id !== 'admin') {
        const groups = await nav.locator('.menu-group').evaluateAll((elements) => Object.fromEntries(elements.map((element) => [element.querySelector('summary').textContent, [...element.querySelectorAll('a')].map((a) => a.getAttribute('href'))])))
        assert.deepEqual(groups[id === 'at' ? '정산 관리' : '농할 정산'], ['#/p/claims', '#/p/appeals', '#/p/settlement'])
        assert.ok(groups['농할 운영'].every((href) => !['#/p/claims', '#/p/appeals', '#/p/settlement'].includes(href)))
      }
      if (id === 'admin') {
        for (const programId of ['organizations', 'accounts', 'permissions', 'programs', 'businesses', 'pos-master', 'pos-schema', 'codes']) {
          await page.goto(`${fileUrl}#/p/${programId}`)
          await page.locator('main h1').waitFor()
          const original = await page.locator('main').innerText()
          for (const businessId of ['public-2026', 'pilot-2027', 'nonghal-2026']) {
            await page.getByLabel('선택 사업', { exact: true }).selectOption(businessId)
            assert.ok(page.url().endsWith(`#/p/${programId}`), '전역 마스터의 현재 경로 유지')
            const current = await page.locator('main').innerText()
            assert.deepEqual(current, original, '사업 변경이 전역 마스터 목록/범위를 변경하면 안 됨')
          }
          if (programId === 'programs') { assert.ok(original.includes('CLAIMS')); assert.ok(original.includes('PUBLIC-DATA')) }
        }
        for (const programId of ['business-organizations', 'business-programs']) {
          await page.goto(`${fileUrl}#/p/${programId}`)
          await page.getByLabel('선택 사업', { exact: true }).selectOption('pilot-2027')
          assert.ok(page.url().endsWith(`#/p/${programId}`))
          assert.ok((await page.locator('main').innerText()).includes('지역 상생사업 (확장 예시)'))
        }
        await page.getByLabel('선택 사업', { exact: true }).selectOption('nonghal-2026')
      }
      // 모든 실제 Sidebar 경로가 제목 또는 명시적 준비 화면으로 연결되는지 확인한다.
      const hrefs = await nav.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))
      for (const href of hrefs.filter((href) => href !== '#/home')) {
        await page.goto(`${fileUrl}${href}`)
        await page.locator('main h1').waitFor()
        assert.ok(!(await page.locator('main').innerText()).includes('접근할 수 없는 화면입니다'))
        assert.ok(!(await page.locator('main').innerText()).includes('화면을 찾을 수 없습니다'))
      }
      await nav.getByRole('link', { name: '홈', exact: true }).click()
      await page.getByRole('heading', { name: titles[id], exact: true }).waitFor()
      if (id !== 'assn') {
      await page.getByPlaceholder('점포 또는 회원사 검색').fill('강서')
      assert.equal(await page.locator('tbody tr').count(), 1)
      await page.getByRole('button', { name: '한빛마트 강서점', exact: true }).click()
      await page.getByRole('dialog').waitFor()
      assert.ok((await page.getByRole('dialog').innerText()).includes('한빛유통(주)'))
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0)
      await page.getByRole('button', { name: '초기화', exact: true }).click()
      await page.getByLabel('POS 연동 상태', { exact: true }).selectOption('active')
      assert.equal(await page.locator('tbody tr').count(), scopedStores(seed.accounts.find(a=>a.loginId===id), 'nonghal-2026', seed).filter(s=>s.posConnectionStatus==='active').length)
      await page.getByRole('button', { name: '초기화', exact: true }).click()
      } else { await page.getByRole('heading', { name: '처리 필요 / 주의', exact: true }).waitFor() }
      if (!blockStorage && id === 'admin') {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: new URL('adms-home.png', screenshotDir).pathname.replace(/^\//, ''), fullPage: true })
      }
      await page.getByLabel('선택 사업', { exact: true }).selectOption('public-2026')
      await page.getByRole('heading', { name: titles[id], exact: true }).waitFor()
      if (id !== 'admin') { assert.ok(await nav.getByRole('link', { name: '공개 데이터', exact: true, includeHidden: true }).count()); assert.equal(await nav.getByRole('link', { name: '이상 감지', exact: true, includeHidden: true }).count(), 0) }
      const publicHrefs = await nav.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))
      for (const href of publicHrefs.filter((href) => href !== '#/home' && !hrefs.includes(href))) {
        await page.goto(`${fileUrl}${href}`)
        await page.locator('main h1').waitFor()
        assert.ok(!(await page.locator('main').innerText()).includes('접근할 수 없는 화면입니다'))
        if (id !== 'assn') await page.getByRole('heading', { name: '업무 화면을 준비하고 있습니다', exact: true }).waitFor()
        else assert.equal(await page.locator('.placeholder-panel').count(), 0)
      }
      await nav.getByRole('link', { name: '홈', exact: true }).click()
      await page.reload()
      if (blockStorage) { await page.getByRole('heading', { name: '로그인', exact: true }).waitFor(); await login(page, id) }
      else { await page.getByRole('heading', { name: titles[id], exact: true }).waitFor(); assert.equal(await page.getByLabel('선택 사업', { exact: true }).inputValue(), 'public-2026') }
      if (id === 'mart') {
        await page.getByLabel('선택 사업', { exact: true }).selectOption('pilot-2027')
        await page.getByText('표시할 데이터가 없습니다', { exact: true }).waitFor()
        assert.equal(await nav.getByRole('link', { name: '공개 데이터', exact: true, includeHidden: true }).count(), 0)
        await nav.locator('.menu-group summary').filter({ hasText: '사업 참여 관리' }).click(); await nav.getByRole('link', { name: '향후 사업', exact: true }).click()
        await page.getByRole('heading', { name: '향후 사업', exact: true }).waitFor()
      }
      if (id !== 'admin') {
        await page.goto(`${fileUrl}#/p/audit`)
        await page.getByRole('heading', { name: '접근할 수 없는 화면입니다', exact: true }).waitFor()
      }
      await page.getByRole('button', { name: '로그아웃', exact: true }).click()
      await page.getByRole('heading', { name: '로그인', exact: true }).waitFor()
      await page.goBack()
      await page.getByRole('heading', { name: '로그인', exact: true }).waitFor()
      await page.reload()
      await page.getByRole('heading', { name: '로그인', exact: true }).waitFor()
    }
    assert.deepEqual(errors, [])
    assert.ok(requests.every((url) => url.split('#')[0] === fileUrl), `추가 리소스 요청: ${requests.join(', ')}`)
    console.log(`Edge file:// 통과 [localStorage ${blockStorage ? '차단' : '허용'}]: 4계정, 운영/정산 그룹, 전역 마스터 불변/사업 Scope, 전체 메뉴, 범위가드, 사업전환, 검색/필터/상세, 새로고침, 로그아웃/뒤로가기, 외부요청 0, JS오류 0`)
    await context.close()
  }
  // 저장된 세션의 JSON 손상/알 수 없는 계정은 로그인 화면으로 복구한다.
  const context = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } })
  await context.addInitScript(() => { localStorage.setItem('adms.demo.session.v1', '{broken') })
  const page = await context.newPage()
  await page.goto(fileUrl)
  await login(page, 'mart')
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).click()
  await page.locator('.menu-group summary').filter({ hasText: '회원사 관리' }).click(); await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '점포 운영 관리', exact: true }).click()
  await page.getByRole('heading', { name: '점포 운영 관리', exact: true }).waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '모바일 가로 넘침 없음')
  console.log('손상된 세션 복구 및 390px 모바일 메뉴 검증 통과')
  await context.close()
} finally { await browser.close() }
