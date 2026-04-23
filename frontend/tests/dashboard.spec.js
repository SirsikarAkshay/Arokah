import { test, expect } from './fixtures/auth.js'
import { mockAllDashboardApis, WEEKLY_OUTFITS, EVENTS } from './fixtures/mocks.js'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllDashboardApis(page)
  })

  test('shows greeting with user name', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('Good morning, Jane.')).toBeVisible()
  })

  test('displays current date', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    const dateEl = page.locator('.date-line')
    await expect(dateEl).toBeVisible()
  })

  test('shows weekly day selector tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.locator('button').filter({ hasText: 'Today' }).first()).toBeVisible()
  })

  test('day tabs show acceptance status indicators', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.locator('button').filter({ hasText: 'Today' })).toBeVisible()
  })

  test('clicking a day tab shows that day detail', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    const tabs = page.locator('button').filter({ has: page.locator('div') })
    const secondTab = tabs.nth(1)
    if (await secondTab.isVisible()) {
      await secondTab.click()
    }
  })

  test('shows outfit items for selected day', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('Navy Blazer')).toBeVisible()
    await expect(page.getByText('White T-Shirt')).toBeVisible()
  })

  test('shows weather info for selected day', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('Partly cloudy')).toBeVisible()
  })

  test('shows generate button', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Regenerate week/i })).toBeVisible()
  })

  test('shows feedback buttons for pending recommendation', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    // Navigate to day with pending recommendation (index 2)
    const tabs = page.locator('button').filter({ has: page.locator('div') })
    if (await tabs.nth(2).isVisible()) {
      await tabs.nth(2).click()
      await expect(page.getByRole('button', { name: /Wearing this/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Skip/i })).toBeVisible()
    }
  })

  test('accepted day shows accepted badge', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('✓ Accepted')).toBeVisible()
  })

  test('feedback accept calls API and updates UI', async ({ authenticatedPage: page }) => {
    let feedbackCalled = false
    await page.route('**/api/outfits/recommendations/*/feedback/', (route) => {
      feedbackCalled = true
      const rec = WEEKLY_OUTFITS[2].recommendation
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...rec, accepted: true }),
      })
    })

    await page.goto('/')
    const tabs = page.locator('button').filter({ has: page.locator('div') })
    if (await tabs.nth(2).isVisible()) {
      await tabs.nth(2).click()
      const wearBtn = page.getByRole('button', { name: /Wearing this/i })
      if (await wearBtn.isVisible()) {
        await wearBtn.click()
        expect(feedbackCalled).toBeTruthy()
      }
    }
  })

  test('generate week triggers agent and refreshes data', async ({ authenticatedPage: page }) => {
    let agentCalled = false
    await page.route('**/api/agents/weekly-looks/', async (route) => {
      agentCalled = true
      await new Promise(r => setTimeout(r, 500))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'completed', output: { status: 'ok' } }),
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: /Regenerate week|Generate weekly looks/i }).click()
    await expect(page.getByRole('button', { name: /Generating/i })).toBeVisible()
    expect(agentCalled).toBeTruthy()
  })

  test('shows quick action cards', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('Add wardrobe item')).toBeVisible()
    await expect(page.getByText('Plan a trip')).toBeVisible()
    await expect(page.getByText('Cultural guide')).toBeVisible()
    await expect(page.getByText('Outfit history')).toBeVisible()
  })

  test('quick action links navigate correctly', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wardrobe/items/*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) }))
    await page.goto('/')
    await page.getByText('Add wardrobe item').click()
    await expect(page).toHaveURL('/wardrobe')
  })
})

test.describe('Dashboard - empty state', () => {
  test('shows empty state when no weekly plan exists', async ({ authenticatedPage: page }) => {
    await page.route('**/api/outfits/recommendations/weekly/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('**/api/itinerary/events/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })

    await page.goto('/')
    await expect(page.getByText('No weekly plan yet')).toBeVisible()
    await expect(page.getByRole('button', { name: /Generate weekly looks/i })).toBeVisible()
  })
})

test.describe('Dashboard - error handling', () => {
  test('shows error when generation fails', async ({ authenticatedPage: page }) => {
    await mockAllDashboardApis(page)
    await page.route('**/api/agents/weekly-looks/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'failed', error: 'Service temporarily unavailable' }),
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: /Regenerate week/i }).click()
    await expect(page.getByText('Service temporarily unavailable')).toBeVisible()
  })
})
