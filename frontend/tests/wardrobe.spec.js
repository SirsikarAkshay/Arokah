import { test, expect } from './fixtures/auth.js'
import { WARDROBE_ITEMS, mockAllWardrobeApis } from './fixtures/mocks.js'

test.describe('Wardrobe page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
  })

  test('displays page header with item count', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await expect(page.getByText('Digital Closet')).toBeVisible()
    await expect(page.getByText(`${WARDROBE_ITEMS.length} items in your wardrobe`)).toBeVisible()
  })

  test('shows all wardrobe items', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    for (const item of WARDROBE_ITEMS) {
      await expect(page.getByText(item.name)).toBeVisible()
    }
  })

  test('item cards show category badge', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await expect(page.locator('.badge').filter({ hasText: 'outerwear' }).first()).toBeVisible()
    await expect(page.locator('.badge').filter({ hasText: 'top' }).first()).toBeVisible()
  })

  test('item cards show brand', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await expect(page.getByText('Zara')).toBeVisible()
    await expect(page.getByText('Uniqlo')).toBeVisible()
  })

  test('item cards show times worn', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await expect(page.getByText('Worn 12×')).toBeVisible()
  })

  test('item cards show weight', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await expect(page.getByText('600g')).toBeVisible()
  })
})

test.describe('Wardrobe filters', () => {
  test('has search input', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')
    await expect(page.getByPlaceholder('Search name, brand, material…')).toBeVisible()
  })

  test('has category filter dropdown', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')
    await expect(page.locator('select').filter({ hasText: 'All categories' })).toBeVisible()
  })

  test('has formality filter dropdown', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')
    await expect(page.locator('select').filter({ hasText: 'All formality' })).toBeVisible()
  })

  test('has season filter dropdown', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')
    await expect(page.locator('select').filter({ hasText: 'All seasons' })).toBeVisible()
  })

  test('changing category filter triggers API call with param', async ({ authenticatedPage: page }) => {
    let lastUrl = ''
    await page.route('**/api/wardrobe/items/*', (route) => {
      lastUrl = route.request().url()
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: WARDROBE_ITEMS.filter(i => i.category === 'top') }) })
    })

    await page.goto('/wardrobe')
    await page.locator('select').filter({ hasText: 'All categories' }).selectOption('top')
    await page.waitForTimeout(300)
    expect(lastUrl).toContain('category=top')
  })
})

test.describe('Add wardrobe item', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
  })

  test('opens add item modal', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    await expect(page.getByText('Add wardrobe item')).toBeVisible()
  })

  test('modal has all form fields', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()

    const modal = page.locator('.card').filter({ hasText: 'Add wardrobe item' })
    await expect(modal.locator('.input-label').filter({ hasText: 'Name' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Category' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Formality' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Season' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Colors' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Brand' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Material' })).toBeVisible()
    await expect(modal.locator('.input-label').filter({ hasText: 'Weight' })).toBeVisible()
  })

  test('shows photo upload section', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    await expect(page.getByText('Add from a photo')).toBeVisible()
    await expect(page.getByText('Choose photo')).toBeVisible()
  })

  test('submitting add form creates item', async ({ authenticatedPage: page }) => {
    let createPayload = null
    await page.route('**/api/wardrobe/items/', (route) => {
      if (route.request().method() === 'POST') {
        createPayload = JSON.parse(route.request().postData())
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, ...createPayload, times_worn: 0 }),
        })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: WARDROBE_ITEMS }) })
      }
    })

    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    const modal = page.locator('.card').filter({ hasText: 'Add wardrobe item' })
    await modal.getByPlaceholder('e.g. Navy Blazer').fill('Leather Jacket')
    await modal.locator('.input-group').filter({ hasText: 'Category' }).locator('select').selectOption('outerwear')
    await modal.getByPlaceholder('e.g. Zara').fill('AllSaints')
    await modal.getByRole('button', { name: 'Add item' }).click()

    await page.waitForTimeout(300)
    expect(createPayload).toBeTruthy()
    expect(createPayload.name).toBe('Leather Jacket')
  })

  test('cancel closes modal without saving', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    await expect(page.getByText('Add wardrobe item')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Add wardrobe item')).not.toBeVisible()
  })

  test('clicking backdrop closes modal', async ({ authenticatedPage: page }) => {
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add item' }).click()
    await expect(page.getByText('Add wardrobe item')).toBeVisible()

    await page.locator('[style*="position: fixed"]').click({ position: { x: 10, y: 10 } })
    await expect(page.getByText('Add wardrobe item')).not.toBeVisible()
  })
})

test.describe('Delete wardrobe item', () => {
  test('shows delete confirmation overlay', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')

    const card = page.locator('.card').filter({ hasText: 'Navy Blazer' })
    await card.getByRole('button', { name: '✕' }).click()
    await expect(page.getByText('Remove "Navy Blazer"?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('cancel dismisses confirmation', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')

    const card = page.locator('.card').filter({ hasText: 'Navy Blazer' })
    await card.getByRole('button', { name: '✕' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Remove "Navy Blazer"?')).not.toBeVisible()
  })

  test('confirming delete removes item from list', async ({ authenticatedPage: page }) => {
    let deleteCalled = false
    await page.route('**/api/wardrobe/items/**', (route) => {
      const method = route.request().method()
      const url = route.request().url()
      if (method === 'DELETE') {
        deleteCalled = true
        route.fulfill({ status: 204 })
      } else if (method === 'GET' && !url.match(/\/items\/\d+\//)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: WARDROBE_ITEMS }) })
      } else {
        route.continue()
      }
    })

    await page.goto('/wardrobe')
    const card = page.locator('.card').filter({ hasText: 'Navy Blazer' })
    await card.getByRole('button', { name: '✕' }).click()
    await page.getByRole('button', { name: 'Remove' }).click()
    await page.waitForTimeout(500)
    expect(deleteCalled).toBeTruthy()
  })
})

test.describe('Receipt import', () => {
  test('opens receipt import modal', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.goto('/wardrobe')
    await page.getByRole('button', { name: /Import receipt/i }).click()
    await expect(page.getByText('Import from receipt')).toBeVisible()
    await expect(page.getByPlaceholder('Paste receipt email text here…')).toBeVisible()
  })

  test('parses receipt and shows extracted items', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.route('**/api/wardrobe/receipt-import/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { name: 'Blue Polo', category: 'top', brand: 'Ralph Lauren', colors: ['blue'] },
            { name: 'Khaki Shorts', category: 'bottom', brand: 'Gap', colors: ['khaki'] },
          ],
        }),
      })
    })

    await page.goto('/wardrobe')
    await page.getByRole('button', { name: /Import receipt/i }).click()
    await page.getByPlaceholder('Paste receipt email text here…').fill('Order #123: Blue Polo by Ralph Lauren, Khaki Shorts by Gap')
    await page.getByRole('button', { name: 'Extract items' }).click()

    await expect(page.getByText('2 items found')).toBeVisible()
    await expect(page.getByText('Blue Polo')).toBeVisible()
    await expect(page.getByText('Khaki Shorts')).toBeVisible()
  })

  test('shows error when no items found in receipt', async ({ authenticatedPage: page }) => {
    await mockAllWardrobeApis(page)
    await page.route('**/api/wardrobe/receipt-import/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
    })

    await page.goto('/wardrobe')
    await page.getByRole('button', { name: /Import receipt/i }).click()
    await page.getByPlaceholder('Paste receipt email text here…').fill('No clothing here')
    await page.getByRole('button', { name: 'Extract items' }).click()

    await expect(page.getByText('No clothing items found')).toBeVisible()
  })
})

test.describe('Wardrobe empty state', () => {
  test('shows empty state when wardrobe is empty', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wardrobe/items/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })

    await page.goto('/wardrobe')
    await expect(page.getByText('Your wardrobe is empty')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add first item' })).toBeVisible()
  })

  test('add first item button opens modal', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wardrobe/items/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })

    await page.goto('/wardrobe')
    await page.getByRole('button', { name: '+ Add first item' }).click()
    await expect(page.getByText('Add wardrobe item')).toBeVisible()
  })
})
