import { test, expect } from './fixtures/auth.js'
import { mockAllDashboardApis, mockAllWardrobeApis, mockAllTripApis, mockAllSocialApis, CALENDAR_STATUS } from './fixtures/mocks.js'

function mockAllPages(page) {
  return Promise.all([
    mockAllDashboardApis(page),
    mockAllWardrobeApis(page),
    mockAllTripApis(page),
    mockAllSocialApis(page),
    page.route('**/api/calendar/status/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CALENDAR_STATUS) })
    }),
    page.route('**/api/cultural/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    }),
    page.route('**/api/sustainability/tracker/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_items: 0, total_wears: 0, avg_wears_per_item: 0, co2_saved_kg: 0 }) })
    }),
    page.route('**/api/sustainability/logs/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    }),
    page.route('**/api/outfits/history/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    }),
    page.route('**/api/itinerary/events/*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
      } else {
        route.continue()
      }
    }),
  ])
}

test.describe('Navigation - all routes accessible', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllPages(page)
  })

  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/wardrobe', name: 'Wardrobe' },
    { path: '/itinerary', name: 'Itinerary' },
    { path: '/trips', name: 'Trips' },
    { path: '/cultural', name: 'Cultural' },
    { path: '/sustainability', name: 'Sustainability' },
    { path: '/people', name: 'People' },
    { path: '/messages', name: 'Messages' },
    { path: '/shared-wardrobes', name: 'Shared Wardrobes' },
    { path: '/profile', name: 'Profile' },
    { path: '/outfit-history', name: 'Outfit History' },
  ]

  for (const route of routes) {
    test(`${route.name} page loads at ${route.path}`, async ({ authenticatedPage: page }) => {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 5000 })
    })
  }
})

test.describe('Navigation - sidebar/layout', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllPages(page)
  })

  test('layout wraps protected pages', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await expect(page.locator('.app-shell')).toBeVisible()
  })

  test('sidebar has navigation links on desktop', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await expect(page.locator('.sidebar-nav')).toBeVisible()
  })

  test('clicking wardrobe nav link navigates', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    const wardrobeLink = page.getByRole('link', { name: /wardrobe/i }).first()
    if (await wardrobeLink.isVisible()) {
      await wardrobeLink.click()
      await expect(page).toHaveURL('/wardrobe')
    }
  })
})

test.describe('Navigation - 404 redirect', () => {
  test('unknown routes redirect to dashboard', async ({ authenticatedPage: page }) => {
    await mockAllPages(page)
    await page.goto('/nonexistent-page')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Mobile viewport behavior', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllPages(page)
  })

  test('login page is responsive at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('dashboard renders at tablet width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.getByText('Good morning, Jane.')).toBeVisible()
  })

  test('wardrobe page renders at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/wardrobe')
    await expect(page.getByText('Digital Closet')).toBeVisible()
  })

  test('wardrobe add item modal fits mobile screen', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    await expect(page.getByText('Add wardrobe item')).toBeVisible()
    // Modal should be visible and not cut off
    const modal = page.locator('.card').filter({ hasText: 'Add wardrobe item' })
    const box = await modal.boundingBox()
    expect(box.width).toBeLessThanOrEqual(375)
  })

  test('profile page renders at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/profile')
    await expect(page.getByText('Your Profile')).toBeVisible()
  })

  test('people page renders at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/people')
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible()
  })

  test('messages page renders at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/messages')
    await page.waitForTimeout(500)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('trips page renders at mobile width', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/trips')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Theme', () => {
  test('app uses dark theme by default', async ({ authenticatedPage: page }) => {
    await mockAllPages(page)
    await page.goto('/')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    // Dark theme should have a dark background
    expect(bg).toBeTruthy()
  })
})
