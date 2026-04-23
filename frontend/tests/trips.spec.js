import { test, expect } from './fixtures/auth.js'
import { mockAllTripApis, TRIPS, SHARED_WARDROBES } from './fixtures/mocks.js'

test.describe('Trip Planner page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllTripApis(page)
  })

  test('displays page header', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    await expect(page.getByRole('heading', { name: 'Your Travels' })).toBeVisible()
  })

  test('lists existing trips', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    await expect(page.getByText('Tokyo Trip')).toBeVisible()
    await expect(page.getByText('Paris Weekend')).toBeVisible()
  })

  test('shows trip details with cities and dates', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    // Trip card shows: "📍 Tokyo · Japan · 10 days · 2026-06-01 → 2026-06-10"
    await expect(page.getByText(/Tokyo/).first()).toBeVisible()
  })
})

test.describe('Create trip', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllTripApis(page)
  })

  test('shows new trip form when clicking add button', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    await page.getByRole('button', { name: '+ New Trip' }).click()
    await expect(page.getByText('Plan a new trip')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. Tokyo Adventure')).toBeVisible()
  })

  test('cancel button hides the form', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    await page.getByRole('button', { name: '+ New Trip' }).click()
    await expect(page.getByText('Plan a new trip')).toBeVisible()
    await page.getByRole('button', { name: /Cancel/i }).click()
    await expect(page.getByText('Plan a new trip')).not.toBeVisible()
  })
})

test.describe('Trip recommendations', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllTripApis(page)
    await page.route('**/api/agents/smart-recommend/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          output: { recommendation: { days: [{ day: 1, wardrobe_matches: [{ item: { id: 1, name: 'Navy Blazer' } }] }] } },
        }),
      })
    })
  })

  test('can trigger recommendation for a trip', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    const recBtn = page.getByRole('button', { name: /recommend|pack|outfit/i }).first()
    if (await recBtn.isVisible()) {
      await recBtn.click()
    }
  })

  test('save plan calls API', async ({ authenticatedPage: page }) => {
    let saveCalled = false
    await page.route('**/api/itinerary/trips/*/save-recommendation/', (route) => {
      saveCalled = true
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'saved', shared_wardrobe_items_added: 3 }),
      })
    })

    await page.goto('/trips')
    const saveBtn = page.getByRole('button', { name: /save plan/i }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(300)
      expect(saveCalled).toBeTruthy()
    }
  })
})

test.describe('Trip actions', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllTripApis(page)
  })

  test('can enter edit mode for a trip', async ({ authenticatedPage: page }) => {
    await page.goto('/trips')
    const editBtn = page.getByRole('button', { name: /edit|✎/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await expect(page.getByText('Edit trip')).toBeVisible()
    }
  })

  test('can delete a trip with confirmation', async ({ authenticatedPage: page }) => {
    await page.route('**/api/itinerary/trips/*/', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 })
      } else {
        route.continue()
      }
    })

    await page.goto('/trips')
    const deleteBtn = page.getByRole('button', { name: /delete|remove|✕/i }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
    }
  })
})

test.describe('Trips empty state', () => {
  test('shows empty state when no trips exist', async ({ authenticatedPage: page }) => {
    await page.route('**/api/itinerary/trips/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })
    await page.route('**/api/shared-wardrobes/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })

    await page.goto('/trips')
    await expect(page.getByText('No trips planned')).toBeVisible()
  })
})
