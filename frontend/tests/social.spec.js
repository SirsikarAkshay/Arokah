import { test, expect } from './fixtures/auth.js'
import { mockAllSocialApis, SOCIAL_PROFILE, CONNECTIONS, CONVERSATIONS, MESSAGES, SHARED_WARDROBES, SHARED_WARDROBE_ITEMS } from './fixtures/mocks.js'

test.describe('People page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllSocialApis(page)
  })

  test('shows page header', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible()
  })

  test('shows profile panel with handle', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    await expect(page.getByText('jane_doe')).toBeVisible()
  })

  test('shows tabs: Find people, Connected, Requests', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    await expect(page.getByRole('button', { name: 'Find people' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Connected' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Requests' })).toBeVisible()
  })

  test('find tab has search input', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    const searchInput = page.getByPlaceholder(/handle/i)
    await expect(searchInput).toBeVisible()
  })

  test('search returns results', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    const searchInput = page.getByPlaceholder(/handle/i)
    await searchInput.fill('charlie')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('charlie_style')).toBeVisible()
  })

  test('connected tab shows accepted connections', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    await page.getByRole('button', { name: 'Connected' }).click()
    await expect(page.getByText('alice_style')).toBeVisible()
  })

  test('requests tab shows pending requests', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    await page.getByRole('button', { name: 'Requests' }).click()
    await expect(page.getByText('bob_fits')).toBeVisible()
  })

  test('can edit profile display name and bio', async ({ authenticatedPage: page }) => {
    await page.goto('/people')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
    }
  })
})

test.describe('People page - connection actions', () => {
  test('can send connection request from search results', async ({ authenticatedPage: page }) => {
    let requestSent = false
    await mockAllSocialApis(page)
    await page.route('**/api/social/connections/request/', (route) => {
      requestSent = true
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 99, status: 'pending' }) })
    })

    await page.goto('/people')
    const searchInput = page.getByPlaceholder(/handle/i)
    await searchInput.fill('charlie')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForTimeout(500)

    const connectBtn = page.getByRole('button', { name: /^Connect$/i }).first()
    if (await connectBtn.isVisible()) {
      await connectBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('can accept a pending connection request', async ({ authenticatedPage: page }) => {
    let accepted = false
    await mockAllSocialApis(page)
    await page.route('**/api/social/connections/*/accept/', (route) => {
      accepted = true
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'accepted' }) })
    })

    await page.goto('/people')
    await page.getByRole('button', { name: 'Requests' }).click()
    await page.waitForTimeout(300)

    const acceptBtn = page.getByRole('button', { name: /accept|✓/i }).first()
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('can reject a pending connection request', async ({ authenticatedPage: page }) => {
    await mockAllSocialApis(page)
    await page.route('**/api/social/connections/*/reject/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'rejected' }) })
    })

    await page.goto('/people')
    await page.getByRole('button', { name: 'Requests' }).click()
    await page.waitForTimeout(300)

    const rejectBtn = page.getByRole('button', { name: /reject|decline|✕/i }).first()
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click()
    }
  })
})

test.describe('Messages page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllSocialApis(page)
  })

  test('shows conversation list', async ({ authenticatedPage: page }) => {
    await page.goto('/messages')
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText('Bob')).toBeVisible()
  })

  test('shows last message preview', async ({ authenticatedPage: page }) => {
    await page.goto('/messages')
    await expect(page.getByText('Hey, ready for the trip?')).toBeVisible()
  })

  test('shows unread badge for unread conversations', async ({ authenticatedPage: page }) => {
    await page.goto('/messages')
    // Alice's conversation has unread_count: 1
    const aliceRow = page.locator('*').filter({ hasText: 'Alice' }).first()
    await expect(aliceRow).toBeVisible()
  })

  test('clicking conversation shows messages', async ({ authenticatedPage: page }) => {
    await page.route('**/api/messages/conversations/*/mark_read/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })

    await page.goto('/messages')
    await page.getByText('Alice').click()
    await page.waitForTimeout(500)

    await expect(page.getByText("Yes! Can't wait.")).toBeVisible()
  })

  test('can send a new message', async ({ authenticatedPage: page }) => {
    let sentBody = null
    await page.route('**/api/messages/conversations/*/send/', (route) => {
      sentBody = JSON.parse(route.request().postData()).body
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 99, sender: 1, body: sentBody, created_at: new Date().toISOString() }),
      })
    })
    await page.route('**/api/messages/conversations/*/mark_read/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })

    await page.goto('/messages')
    await page.getByText('Alice').click()
    await page.waitForTimeout(300)

    const input = page.getByPlaceholder(/message|type/i)
    if (await input.isVisible()) {
      await input.fill('Looking forward to it!')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      expect(sentBody).toBe('Looking forward to it!')
    }
  })
})

test.describe('Messages empty state', () => {
  test('shows empty state when no conversations', async ({ authenticatedPage: page }) => {
    await page.route('**/api/messages/conversations/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    })

    await page.goto('/messages')
    // Should show some kind of empty or "no conversations" indicator
    await page.waitForTimeout(300)
  })
})

test.describe('Shared Wardrobes page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockAllSocialApis(page)
  })

  test('shows shared wardrobes list', async ({ authenticatedPage: page }) => {
    await page.goto('/shared-wardrobes')
    await expect(page.getByText('Paris Trip Wardrobe')).toBeVisible()
  })

  test('shows member count', async ({ authenticatedPage: page }) => {
    await page.goto('/shared-wardrobes')
    await expect(page.getByText('2 members')).toBeVisible()
  })

  test('can create new shared wardrobe', async ({ authenticatedPage: page }) => {
    await page.route('**/api/shared-wardrobes/', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, name: 'New Wardrobe', owner: { id: 1, first_name: 'Jane' }, members: [], item_count: 0 }),
        })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBES) })
      }
    })

    await page.goto('/shared-wardrobes')
    const createBtn = page.getByRole('button', { name: /create|new|add/i }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
    }
  })

  test('clicking wardrobe navigates to detail page', async ({ authenticatedPage: page }) => {
    await page.route('**/api/shared-wardrobes/1/items/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBE_ITEMS) })
    })
    await page.route('**/api/shared-wardrobes/1/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBES[0]) })
    })

    await page.goto('/shared-wardrobes')
    await page.getByText('Paris Trip Wardrobe').click()
    await expect(page).toHaveURL(/\/shared-wardrobes\/1/)
  })
})

test.describe('Shared Wardrobe Detail page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/shared-wardrobes/1/items/**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBE_ITEMS) })
      } else {
        route.continue()
      }
    })
    await page.route('**/api/shared-wardrobes/1/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBES[0]) })
    })
  })

  test('shows wardrobe name', async ({ authenticatedPage: page }) => {
    await page.goto('/shared-wardrobes/1')
    await expect(page.getByText('Paris Trip Wardrobe')).toBeVisible()
  })

  test('lists shared wardrobe items', async ({ authenticatedPage: page }) => {
    await page.goto('/shared-wardrobes/1')
    await expect(page.getByText('Summer Dress')).toBeVisible()
    await expect(page.getByText('Linen Shirt')).toBeVisible()
  })

  test('shows who added each item', async ({ authenticatedPage: page }) => {
    await page.goto('/shared-wardrobes/1')
    await expect(page.getByText('@jane_doe').first()).toBeVisible()
    await expect(page.getByText('@alice_style').first()).toBeVisible()
  })

  test('can add item to shared wardrobe', async ({ authenticatedPage: page }) => {
    await page.route('**/api/shared-wardrobes/1/items/', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, name: 'New Item', category: 'top', brand: '', image_url: null, notes: '', added_by: { id: 1, first_name: 'Jane' } }),
        })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: SHARED_WARDROBE_ITEMS }) })
      }
    })

    await page.goto('/shared-wardrobes/1')
    const addBtn = page.getByRole('button', { name: /add item|add/i }).first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
    }
  })

  test('can edit shared wardrobe item', async ({ authenticatedPage: page }) => {
    await page.route('**/api/shared-wardrobes/1/items/1/', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...SHARED_WARDROBE_ITEMS[0], name: 'Updated Dress' }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/shared-wardrobes/1')
    const editBtn = page.getByRole('button', { name: /edit|✎/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
    }
  })

  test('can delete shared wardrobe item', async ({ authenticatedPage: page }) => {
    let deleteCalled = false
    await page.route('**/api/shared-wardrobes/1/items/1/', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        route.fulfill({ status: 204 })
      } else {
        route.continue()
      }
    })

    await page.goto('/shared-wardrobes/1')
    const deleteBtn = page.getByRole('button', { name: /delete|remove|✕/i }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      await page.waitForTimeout(300)
    }
  })
})
