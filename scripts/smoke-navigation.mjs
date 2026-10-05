import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { seed } from '../src/data/seed.ts'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const url = new URL('../dist/adms-demo.html', import.meta.url).href
try {
  for (const blocked of [false, true]) {
    const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1000 } })
    if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked') } }))
    const page = await context.newPage(); page.setDefaultTimeout(5000)
    const errors = []; const requests = []
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()))
    await page.goto(url)
    const login = async () => { await page.getByLabel('아이디', { exact: true }).fill('admin'); await page.getByLabel('비밀번호', { exact: true }).fill('1234'); await page.getByRole('button', { name: '로그인', exact: true }).click(); await page.getByRole('heading', { name: '시스템 관리자 홈', exact: true }).waitFor() }
    await login()
    assert.equal(await page.locator('.menu-group[open]').count(), 0)
    const group = name => page.locator('.menu-group').filter({ has: page.locator('summary').filter({ hasText: name }) })
    await group('조직·계정 관리').locator('summary').click(); await page.getByRole('link', { name: '조직 관리', exact: true }).click()
    const orgNav = page.getByRole('navigation', { name: '조직 계층' })
    const node = name => orgNav.getByRole('treeitem', { name, exact: true })
    await orgNav.getByRole('button', { name: '경기지회 펼치기', exact: true }).click()
    await orgNav.getByRole('button', { name: '한빛유통(주) 펼치기', exact: true }).click()
    assert.equal(await node('한빛마트 본점').getAttribute('aria-expanded'), null)
    await orgNav.getByRole('button', { name: '한빛마트 강서점', exact: false }).click()
    await page.getByRole('heading', { name: '한빛마트 강서점', exact: true }).waitFor()
    await orgNav.getByRole('button', { name: '경기지회 접기', exact: true }).click()
    assert.equal(await node('한빛마트 강서점').count(), 0)
    await orgNav.getByRole('button', { name: '경기지회 펼치기', exact: true }).click()
    assert.equal(await node('한빛마트 강서점').getAttribute('aria-selected'), 'true')
    await orgNav.getByRole('button', { name: '한국마트협회 접기', exact: true }).click()
    await page.getByLabel('조직 검색', { exact: true }).fill('마곡')
    for (const name of ['한국마트협회', '경기지회', '한빛유통(주)', '한빛마트 마곡점']) assert.equal(await node(name).count(), 1)
    assert.equal(await node('한빛마트 본점').count(), 0)
    await page.getByRole('button', { name: '조직 검색 초기화', exact: true }).click()
    assert.equal(await node('한국마트협회').getAttribute('aria-expanded'), 'false')
    await orgNav.getByRole('button', { name: '한국마트협회 펼치기', exact: true }).click()
    assert.equal(await node('한빛마트 강서점').count(), 1, '검색 전 하위 펼침 상태 유지')
    await page.getByRole('button', { name: '전체 접기', exact: true }).click(); assert.equal(await orgNav.getByRole('treeitem').count(), 5)
    await page.getByRole('button', { name: '전체 펼치기', exact: true }).click(); assert.equal(await orgNav.getByRole('treeitem').count(), seed.organizations.length)
    await page.getByLabel('조직 검색', { exact: true }).fill('없는조직'); await page.getByText('검색 결과가 없습니다.', { exact: true }).waitFor(); await page.getByRole('button', { name: '조직 검색 초기화', exact: true }).click()
    await group('조직·계정 관리').locator('summary').click(); assert.equal(await group('조직·계정 관리').getAttribute('open'), null)
    await group('POS 연동 HUB').locator('summary').click(); assert.equal(await group('조직·계정 관리').getAttribute('open'), null, '다른 그룹 조작 시 수동 접기 유지')
    await page.goto(`${url}#/p/accounts`); assert.notEqual(await group('조직·계정 관리').getAttribute('open'), null, '직접 경로 자동 펼침')
    if (blocked) { await page.getByRole('button', { name: '로그아웃', exact: true }).click(); await login() } else await page.reload()
    assert.notEqual(await group('POS 연동 HUB').getAttribute('open'), null, '사용자 그룹 상태 복구')
    await page.goto(`${url}#/p/organizations`)
    if (!blocked) await page.screenshot({ path: 'node_modules/.tmp/navigation-ux.png', fullPage: true })
    assert.deepEqual(errors, []); assert.ok(requests.every(r => r.split('#')[0] === url))
    console.log(`Navigation offline 통과 [저장소 ${blocked ? '차단' : '허용'}]: 계층 접기/펼침 유지, Leaf, 선택 상세, 검색 경로/복원, 전체 제어, 빈 결과, Sidebar 자동/수동 펼침 및 저장, 외부요청/JS오류 0`)
    await context.close()
  }
  // 실제 업무 데이터는 수정하지 않고 별도 브라우저에 600개 조직 노드를 주입해 탐색을 검증한다.
  const data = structuredClone(seed)
  for (let branch = 0; branch < 20; branch++) {
    const branchId = `load-branch-${branch}`
    data.organizations.push({ id: branchId, parentId: 'assn-org', code: branchId, name: `탐색지회 ${branch}`, type: '지회', active: true })
    for (let child = 0; child < 29; child++) data.organizations.push({ id: `${branchId}-${child}`, parentId: branchId, code: `${branchId}-${child}`, name: `탐색조직 ${branch}-${child}`, type: '기업', active: true })
  }
  const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(data => { localStorage.setItem('adms.demo.data.v2', JSON.stringify({ version: 2, data })); localStorage.setItem('adms.demo.session.v1', JSON.stringify({ accountId: 'account-admin', businessId: 'nonghal-2026' })) }, data)
  const page = await context.newPage(); await page.goto(`${url}#/p/organizations`)
  const search = page.getByLabel('조직 검색', { exact: true }); await search.fill('탐색조직 19-28')
  await page.getByRole('treeitem', { name: '탐색조직 19-28', exact: true }).waitFor()
  assert.equal(await page.getByRole('treeitem').count(), 3)
  await page.getByRole('button', { name: '조직 검색 초기화', exact: true }).click(); await page.getByRole('button', { name: '전체 펼치기', exact: true }).click()
  assert.equal(await page.getByRole('treeitem').count(), data.organizations.length)
  assert.ok(await page.locator('.org-tree-scroll').evaluate(e => e.scrollHeight > e.clientHeight && getComputedStyle(e).overflowY === 'auto'))
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  console.log(data.organizations.length+'개 조직 검색 경로/전체 펼침/독립 스크롤/모바일 검증 통과')
  await context.close()
} finally { await browser.close() }
