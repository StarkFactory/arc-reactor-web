import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const PAUSE = 3000 // 각 액션 후 3초 대기

test.describe('Admin Dashboard Full Flow', () => {
  let page: Awaited<ReturnType<typeof test.info>>['_'] extends never ? never : any

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
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
    await expect(page.locator('.Dashboard-cardLabel:text("Error Report")')).toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  // --- Sidebar Navigation ---

  test('2. 사이드바 네비게이션', async () => {
    test.setTimeout(60_000)

    // Error Report 페이지로 이동
    await page.click('nav a:text("Error Report")')
    await expect(page.locator('h1:text("Error Report")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

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

  // --- Error Report 전체 플로우 ---

  test('3. Error Report 폼 작성 및 제출', async () => {
    test.setTimeout(60_000)

    // Quick Action으로 Error Report 이동
    await page.click('a:text("Send Error Report")')
    await expect(page.locator('h1:text("Error Report")')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // Submit 버튼 비활성 확인
    const submitBtn = page.locator('button:text("Submit Error Report")')
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(1000)

    // Stack Trace 입력
    await page.fill('textarea', 'java.lang.NullPointerException\n\tat com.example.PaymentService.processPayment(PaymentService.kt:42)\n\tat com.example.OrderController.checkout(OrderController.kt:88)\n\tat sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)')
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

    // 제출!
    await page.click('button:text("Submit Error Report")')
    await page.waitForTimeout(2000)

    // 결과 확인
    const result = page.locator('.ErrorReport-result--success, .ErrorReport-result--error')
    await expect(result).toBeVisible({ timeout: 10_000 })

    const successResult = page.locator('.ErrorReport-result--success')
    if (await successResult.isVisible()) {
      await expect(successResult).toContainText('Accepted')
      await expect(successResult).toContainText('Request ID')
    }
    await page.waitForTimeout(PAUSE)

    // 히스토리 확인
    await expect(page.locator('.ErrorReport-historyItem').first()).toBeVisible()
    await expect(page.locator('.ErrorReport-historyService').first()).toContainText('payment-service')
    await page.waitForTimeout(PAUSE)
  })

  test('4. 두 번째 Error Report 제출', async () => {
    test.setTimeout(60_000)

    // 새 에러 입력
    await page.fill('textarea', 'kotlin.KotlinNullPointerException\n\tat com.example.OrderService.process(OrderService.kt:55)\n\tat com.example.ApiGateway.handle(ApiGateway.kt:23)')
    await page.waitForTimeout(1500)

    await page.fill('input[placeholder="my-service"]', 'order-service')
    await page.waitForTimeout(1500)

    await page.fill('input[placeholder="my-org/my-service"]', 'arc-org/order-service')
    await page.waitForTimeout(1500)

    // 제출
    await page.click('button:text("Submit Error Report")')
    await page.waitForTimeout(2000)

    const result = page.locator('.ErrorReport-result--success, .ErrorReport-result--error')
    await expect(result).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(PAUSE)

    // 히스토리에 2개 확인
    await expect(page.locator('.ErrorReport-historyItem')).toHaveCount(2, { timeout: 5_000 })
    await page.waitForTimeout(PAUSE)
  })

  // --- Chat으로 돌아가기 ---

  test('5. Back to Chat', async () => {
    test.setTimeout(30_000)

    await page.click('a:text("Back to Chat")')
    await page.waitForTimeout(PAUSE)
    await expect(page.locator('text=Arc Reactor Admin')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)
  })
})
