import { test, expect } from '@playwright/test'

const PAUSE = 3000

test.describe('Login Page', () => {
  test('1. 로그인 페이지 렌더링', async ({ page }) => {
    test.setTimeout(30_000)

    // 인증 없이 접근 → 로그인 페이지가 보여야 함
    await page.goto('/')
    await expect(page.locator('.LoginPage-card')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 로고 & 서브타이틀
    await expect(page.locator('.LoginPage-logo')).toContainText('Arc Reactor')
    await expect(page.locator('.LoginPage-subtitle')).toContainText('AI Agent Chat')
    await page.waitForTimeout(PAUSE)
  })

  test('2. 로그인/회원가입 탭 전환', async ({ page }) => {
    test.setTimeout(30_000)
    await page.goto('/')
    await expect(page.locator('.LoginPage-card')).toBeVisible()

    // 기본: 로그인 탭 활성
    const loginTab = page.locator('.LoginPage-tab:text("Login")')
    const registerTab = page.locator('.LoginPage-tab:text("Register")')
    await expect(loginTab).toHaveClass(/LoginPage-tab--active/)
    await page.waitForTimeout(PAUSE)

    // 로그인 탭: 이메일 + 비밀번호 (이름 필드 없음)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Name"]')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 회원가입 탭 클릭
    await registerTab.click()
    await expect(registerTab).toHaveClass(/LoginPage-tab--active/)
    await page.waitForTimeout(PAUSE)

    // 회원가입 탭: 이름 필드 추가
    await expect(page.locator('input[autocomplete="name"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await page.waitForTimeout(PAUSE)

    // 다시 로그인 탭으로
    await loginTab.click()
    await expect(loginTab).toHaveClass(/LoginPage-tab--active/)
    await expect(page.locator('input[autocomplete="name"]')).not.toBeVisible()
    await page.waitForTimeout(PAUSE)
  })

  test('3. 로그인 폼 유효성 검사', async ({ page }) => {
    test.setTimeout(30_000)
    await page.goto('/')
    await expect(page.locator('.LoginPage-card')).toBeVisible()

    const submitBtn = page.locator('.LoginPage-submit')

    // 초기: Submit 비활성
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(PAUSE)

    // 이메일만 입력 → 아직 비활성
    await page.fill('input[type="email"]', 'test@example.com')
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(PAUSE)

    // 비밀번호도 입력 → 활성화
    await page.fill('input[type="password"]', 'password123')
    await expect(submitBtn).toBeEnabled()
    await page.waitForTimeout(PAUSE)
  })

  test('4. 회원가입 폼 유효성 검사', async ({ page }) => {
    test.setTimeout(30_000)
    await page.goto('/')
    await expect(page.locator('.LoginPage-card')).toBeVisible()

    // 회원가입 탭으로 전환
    await page.click('.LoginPage-tab:text("Register")')
    await page.waitForTimeout(PAUSE)

    const submitBtn = page.locator('.LoginPage-submit')

    // 초기: Submit 비활성
    await expect(submitBtn).toBeDisabled()

    // 이름 입력
    await page.fill('input[autocomplete="name"]', 'Test User')
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(PAUSE)

    // 이메일 입력
    await page.fill('input[type="email"]', 'test@example.com')
    await expect(submitBtn).toBeDisabled()
    await page.waitForTimeout(PAUSE)

    // 비밀번호 입력 (8자 이상)
    await page.fill('input[type="password"]', 'password123')
    await expect(submitBtn).toBeEnabled()
    await page.waitForTimeout(PAUSE)
  })
})
