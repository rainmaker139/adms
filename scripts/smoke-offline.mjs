// 개발 환경의 Playwright 설치 경로를 인자로 전달한다. 배포 HTML에는 필요 없다.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const context = await browser.newContext({ offline: true })
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage disabled for offline smoke test') } })
  })
  const page = await context.newPage()
  const requests = []
  const errors = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  const url = new URL('../dist/adms-demo.html', import.meta.url).href
  await page.goto(url)
  await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor()
  assert.equal(await page.locator('article').count(), 3)
  await page.locator('.recharts-bar-rectangle').first().waitFor()
  assert.equal(await page.locator('.recharts-bar-rectangle').count(), 4)
  assert.equal(await page.locator('aside nav svg').count(), 3)
  await page.getByRole('link', { name: '참여마트', exact: true }).click()
  await page.getByRole('heading', { name: '참여마트', exact: true }).waitFor()
  assert.ok(page.url().endsWith('#/markets'))
  await page.getByRole('button', { name: '동작 확인: 0', exact: true }).click()
  await page.getByRole('button', { name: '동작 확인: 1', exact: true }).waitFor()
  await page.getByRole('link', { name: '농할운영', exact: true }).click()
  await page.getByRole('heading', { name: '농할운영', exact: true }).waitFor()
  await page.getByRole('button', { name: '동작 확인: 0', exact: true }).click()
  await page.getByRole('button', { name: '동작 확인: 1', exact: true }).waitFor()
  await page.reload()
  await page.getByRole('heading', { name: '농할운영', exact: true }).waitFor()
  await page.getByRole('button', { name: '동작 확인: 0', exact: true }).waitFor()
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  await page.locator('.recharts-bar-rectangle').first().waitFor()
  assert.deepEqual(errors, [])
  assert.ok(requests.every((request) => request === url), `추가 리소스 요청: ${requests.join(', ')}`)
  console.log('Edge file:// 검증 통과: 네트워크 offline + localStorage 차단, 메뉴 3개, KPI 3개, 차트 4개 막대, 클릭/새로고침, 외부 요청 0, JS 오류 0')
} finally { await browser.close() }
