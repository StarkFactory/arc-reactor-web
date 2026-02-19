import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const PAUSE = 3000 // 각 액션 후 3초 대기

test.describe('Admin Dashboard Full Flow', () => {
  let page: import('@playwright/test').Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()

    // Mock auth: ADMIN 유저로 로그인된 상태
    await page.addInitScript(() => {
      localStorage.setItem('arc-reactor-auth-token', 'mock-admin-token')
    })
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' }),
      })
    })
    await page.route('**/api/models', route => {
      route.fulfill({ status: 401 })
    })
  })

  test.afterAll(async () => {
    await page.close()
  })

  // --- Dashboard ---

  test('1. Admin Dashboard 접속', async () => {
    test.setTimeout(30_000)
    await page.goto('/admin')
    await expect(page.locator('text=Arc Reactor Admin')).toBeVisible()
    await expect(page.locator('h1:text("Dashboard")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 카드 확인
    await expect(page.locator('.Dashboard-cardLabel:text("MCP Servers")')).toBeVisible()
    await expect(page.locator('.Dashboard-cardLabel:text("Personas")')).toBeVisible()
    await expect(page.locator('.Dashboard-cardLabel:text("Apps")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Sidebar Navigation ---

  test('2. 사이드바 네비게이션', async () => {
    test.setTimeout(60_000)

    // MCP Servers 페이지로 이동
    await page.click('nav a:text("MCP Servers")')
    await expect(page.locator('h1:text("MCP Servers")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Personas 페이지로 이동
    await page.click('nav a:text("Personas")')
    await expect(page.locator('h1:text("Personas")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Dashboard로 돌아가기
    await page.click('nav a:text("Dashboard")')
    await expect(page.locator('h1:text("Dashboard")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Quick Action: Open Apps ---

  test('3. Quick Action에서 Apps로 이동', async () => {
    test.setTimeout(30_000)

    // Open Apps 링크 클릭
    await page.click('a:text("Open Apps")')
    await page.waitForTimeout(PAUSE)

    // Apps 페이지 확인
    await expect(page.locator('h1:text("Apps")')).toBeVisible()
    await expect(page.locator('.AppsPage-card')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Admin으로 돌아가기
    await page.goto('/admin')
    await expect(page.locator('h1:text("Dashboard")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- 다크/라이트 모드 전환 ---

  test('4. 다크/라이트 모드 토글', async () => {
    test.setTimeout(60_000)

    // 현재 테마 확인
    const initialTheme = await page.getAttribute('html', 'data-theme')
    await page.waitForTimeout(1000)

    // 테마 토글 버튼 클릭 (☀️ 또는 🌙)
    const themeBtn = page.locator('.Admin-headerBtn').nth(1)
    await themeBtn.click()
    await page.waitForTimeout(PAUSE)

    // 테마 변경 확인
    const newTheme = await page.getAttribute('html', 'data-theme')
    expect(newTheme).not.toBe(initialTheme)
    await page.waitForTimeout(PAUSE)

    // 다시 토글해서 원래대로
    await themeBtn.click()
    await page.waitForTimeout(PAUSE)

    const restoredTheme = await page.getAttribute('html', 'data-theme')
    expect(restoredTheme).toBe(initialTheme)
    await page.waitForTimeout(PAUSE)
  })

  // --- 언어 전환 (EN/KO) ---

  test('5. 언어 전환 EN → KO → EN', async () => {
    test.setTimeout(60_000)

    // 현재 영어 상태 확인
    await expect(page.locator('text=Arc Reactor Admin')).toBeVisible()
    await expect(page.locator('a:text("Back to Chat")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 언어 전환 버튼 클릭 (KO 표시 → 한국어로 전환)
    const langBtn = page.locator('.Admin-headerBtn').nth(0)
    await langBtn.click()
    await page.waitForTimeout(PAUSE)

    // 한국어로 변경되었는지 확인
    await expect(page.locator('text=Arc Reactor 관리자')).toBeVisible()
    await expect(page.locator('a:text("채팅으로 돌아가기")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 사이드바도 한국어인지 확인
    await expect(page.locator('nav a:text("대시보드")')).toBeVisible()
    await expect(page.locator('nav a:text("MCP 서버")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 다시 영어로 전환
    await langBtn.click()
    await page.waitForTimeout(PAUSE)

    // 영어 복원 확인
    await expect(page.locator('text=Arc Reactor Admin')).toBeVisible()
    await expect(page.locator('a:text("Back to Chat")')).toBeVisible()
    await expect(page.locator('nav a:text("Dashboard")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Chat으로 돌아가기 ---

  test('6. Back to Chat', async () => {
    test.setTimeout(30_000)

    await page.click('a:text("Back to Chat")')
    await page.waitForTimeout(PAUSE)
    await expect(page.locator('text=Arc Reactor Admin')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)
  })
})
