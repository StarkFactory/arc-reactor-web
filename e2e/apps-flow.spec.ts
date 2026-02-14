import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const PAUSE = 3000

test.describe('Apps Flow', () => {
  let page: Awaited<ReturnType<typeof test.info>>['_'] extends never ? never : any

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()

    // Mock auth: 일반 유저로 로그인된 상태
    await page.addInitScript(() => {
      localStorage.setItem('arc-reactor-auth-token', 'mock-user-token')
    })
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '2', email: 'user@test.com', name: 'User', role: 'USER' }),
      })
    })
    await page.route('**/api/models', route => {
      route.fulfill({ status: 401 })
    })
  })

  test.afterAll(async () => {
    await page.close()
  })

  // --- Apps 목록 ---

  test('1. Apps 목록 페이지 접속', async () => {
    test.setTimeout(30_000)
    await page.goto('/apps')
    await expect(page.locator('h1:text("Apps")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Error Report 카드 확인
    await expect(page.locator('.AppsPage-card')).toBeVisible()
    await expect(page.locator('.AppsPage-cardName:text("Error Report")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Error Report 앱 ---

  test('2. Error Report 앱 열기', async () => {
    test.setTimeout(30_000)

    // Error Report 카드 클릭
    await page.click('.AppsPage-card')
    await page.waitForTimeout(PAUSE)

    // Error Report 페이지 확인
    await expect(page.locator('h1:text("Error Report")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  test('3. Error Report 폼 작성 및 제출', async () => {
    test.setTimeout(120_000)

    // Submit 버튼 비활성 확인
    const submitBtn = page.locator('button:text("Submit Error Report")')
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(1000)

    // Stack Trace 입력
    await page.fill('textarea', 'java.lang.NullPointerException\n\tat com.example.PaymentService.processPayment(PaymentService.kt:42)\n\tat com.example.OrderController.checkout(OrderController.kt:88)')
    await page.waitForTimeout(2000)

    // Service Name 입력
    await page.fill('input[placeholder="my-service"]', 'payment-service')
    await page.waitForTimeout(1500)

    // Repository Slug 입력
    await page.fill('input[placeholder="my-org/my-service"]', 'arc-org/payment-service')
    await page.waitForTimeout(1500)

    // Slack Channel 입력
    await page.fill('input[placeholder="#error-alerts"]', '#backend-errors')
    await page.waitForTimeout(1500)

    // Environment 입력
    await page.fill('input[placeholder="production"]', 'production')
    await page.waitForTimeout(1500)

    // Submit 버튼 활성화 확인
    await expect(submitBtn).toBeEnabled()
    await page.waitForTimeout(PAUSE)

    // 제출
    await page.click('button:text("Submit Error Report")')
    await page.waitForTimeout(2000)

    // 결과 확인 (성공 또는 에러 - 서버 없으므로 에러 가능)
    const result = page.locator('.ErrorReport-result--success, .ErrorReport-result--error')
    await expect(result).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(PAUSE)
  })

  // --- Header에서 Apps 링크 확인 ---

  test('4. Chat 헤더에서 Apps 링크 확인', async () => {
    test.setTimeout(30_000)

    // Chat으로 이동
    await page.goto('/')
    await page.waitForTimeout(PAUSE)

    // Apps 링크 있음, Admin 링크 없음 (일반 유저)
    await expect(page.locator('.Header-appsLink:text("Apps")')).toBeVisible()
    await expect(page.locator('.Header-adminLink')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Apps 링크 클릭 → Apps 페이지
    await page.click('.Header-appsLink')
    await page.waitForTimeout(PAUSE)
    await expect(page.locator('h1:text("Apps")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Back to Chat ---

  test('5. Back to Chat', async () => {
    test.setTimeout(30_000)

    await page.click('a:text("Back to Chat")')
    await page.waitForTimeout(PAUSE)
    await expect(page.locator('h1:text("Apps")')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)
  })
})
