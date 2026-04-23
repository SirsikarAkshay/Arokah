// Reusable API mock helpers for all test suites

export const WARDROBE_ITEMS = [
  { id: 1, name: 'Navy Blazer', category: 'outerwear', formality: 'smart', season: 'all', brand: 'Zara', colors: ['navy'], material: 'wool', weight_grams: 600, times_worn: 12, image_url: null },
  { id: 2, name: 'White T-Shirt', category: 'top', formality: 'casual', season: 'summer', brand: 'Uniqlo', colors: ['white'], material: 'cotton', weight_grams: 150, times_worn: 30, image_url: null },
  { id: 3, name: 'Black Chinos', category: 'bottom', formality: 'casual_smart', season: 'all', brand: 'COS', colors: ['black'], material: 'cotton', weight_grams: 350, times_worn: 20, image_url: null },
  { id: 4, name: 'Running Shoes', category: 'footwear', formality: 'activewear', season: 'all', brand: 'Nike', colors: ['black', 'white'], material: 'mesh', weight_grams: 280, times_worn: 45, image_url: null },
]

export const WEEKLY_OUTFITS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  const dateStr = d.toISOString().split('T')[0]
  return {
    date: dateStr,
    day_label: d.toLocaleDateString('en-US', { weekday: 'long' }),
    recommendation: i < 3 ? {
      id: 100 + i,
      accepted: i === 0 ? true : i === 1 ? false : null,
      notes: `Outfit suggestion for day ${i + 1}`,
      weather_snapshot: { temp_c: 18 + i, temp_max_c: 22 + i, temp_min_c: 14 + i, condition: 'Partly cloudy', precipitation_probability: 10, is_raining: false, is_cold: false, is_hot: false },
      outfit_items: [
        { clothing_item: 1, item_name: 'Navy Blazer', item_category: 'outerwear', item_brand: 'Zara', liked: null },
        { clothing_item: 2, item_name: 'White T-Shirt', item_category: 'top', item_brand: 'Uniqlo', liked: null },
      ],
    } : null,
  }
})

export const EVENTS = [
  { id: 1, title: 'Team standup', event_type: 'internal_meeting', formality: 'casual', start_time: new Date().toISOString(), end_time: new Date(Date.now() + 3600000).toISOString() },
  { id: 2, title: 'Client lunch', event_type: 'external_meeting', formality: 'smart', start_time: new Date().toISOString().replace('T', 'T12:'), end_time: new Date().toISOString().replace('T', 'T13:') },
]

export const TRIPS = [
  { id: 1, name: 'Tokyo Trip', destination: 'Tokyo, Japan', country: 'Japan', cities: ['Tokyo'], start_date: '2026-06-01', end_date: '2026-06-10', notes: 'Business + sightseeing', shared_wardrobe: null, saved_recommendation: null },
  { id: 2, name: 'Paris Weekend', destination: 'Paris, France', country: 'France', cities: ['Paris'], start_date: '2026-07-15', end_date: '2026-07-18', notes: 'Romantic getaway', shared_wardrobe: 1, saved_recommendation: { recommendation: { days: [] } } },
]

export const CONVERSATIONS = [
  { id: 1, other_user: { id: 2, display_name: 'Alice', handle: 'alice_style', email: 'alice@example.com' }, last_message: { body: 'Hey, ready for the trip?', created_at: '2026-04-20T10:00:00Z' }, unread_count: 1 },
  { id: 2, other_user: { id: 3, display_name: 'Bob', handle: 'bob_fits', email: 'bob@example.com' }, last_message: { body: 'See you tomorrow!', created_at: '2026-04-19T15:00:00Z' }, unread_count: 0 },
]

export const MESSAGES = [
  { id: 1, sender: 2, body: 'Hey, ready for the trip?', created_at: '2026-04-20T10:00:00Z' },
  { id: 2, sender: 1, body: 'Yes! Can\'t wait.', created_at: '2026-04-20T10:05:00Z' },
]

export const SHARED_WARDROBES = [
  { id: 1, name: 'Paris Trip Wardrobe', owner: { id: 1, first_name: 'Jane' }, members: [{ user: { id: 1, first_name: 'Jane', handle: 'jane_doe' } }, { user: { id: 2, first_name: 'Alice', handle: 'alice_style' } }], item_count: 5, my_role: 'owner' },
]

export const SHARED_WARDROBE_ITEMS = [
  { id: 1, name: 'Summer Dress', category: 'dress', brand: 'H&M', image_url: null, notes: 'For evening dinners', added_by: { id: 1, first_name: 'Jane', handle: 'jane_doe' } },
  { id: 2, name: 'Linen Shirt', category: 'top', brand: 'Massimo Dutti', image_url: null, notes: '', added_by: { id: 2, first_name: 'Alice', handle: 'alice_style' } },
]

export const CONNECTIONS = {
  accepted: [
    { id: 1, other_user: { id: 2, first_name: 'Alice', handle: 'alice_style', display_name: 'Alice', bio: '' }, status: 'accepted' },
  ],
  pending: [
    { id: 2, other_user: { id: 3, first_name: 'Bob', handle: 'bob_fits', display_name: 'Bob', bio: '' }, status: 'pending', direction: 'incoming' },
  ],
}

export const SOCIAL_PROFILE = {
  handle: 'jane_doe',
  display_name: 'Jane Doe',
  bio: 'Fashion enthusiast',
  visibility: 'public',
}

export const CULTURAL_RULES = [
  { id: 1, country: 'Japan', rule: 'Remove shoes when entering homes and some restaurants', category: 'etiquette' },
  { id: 2, country: 'Japan', rule: 'Conservative dress in temples — cover shoulders and knees', category: 'dress_code' },
]

export const CULTURAL_EVENTS = [
  { id: 1, country: 'Japan', name: 'Cherry Blossom Festival', month: 4, dress_tip: 'Light layers in pastel colors' },
]

export const SUSTAINABILITY_TRACKER = {
  total_items: 42,
  total_wears: 350,
  avg_wears_per_item: 8.3,
  co2_saved_kg: 12.5,
  cost_per_wear_avg: 4.20,
}

export const SUSTAINABILITY_LOGS = [
  { id: 1, action: 'outfit_repeated', created_at: '2026-04-20T08:00:00Z', detail: 'Wore Navy Blazer + Chinos again' },
  { id: 2, action: 'light_packing', created_at: '2026-04-18T12:00:00Z', detail: 'Packed 5 items for 3-day trip' },
]

export const OUTFIT_HISTORY = [
  { id: 1, date: '2026-04-20', accepted: true, notes: 'Smart casual for office', outfit_items: [{ item_name: 'Navy Blazer', item_category: 'outerwear' }] },
  { id: 2, date: '2026-04-19', accepted: false, notes: 'Too warm for layers', outfit_items: [{ item_name: 'White T-Shirt', item_category: 'top' }] },
]

export const CALENDAR_STATUS = {
  google: { connected: false, email: null, synced_at: null },
  apple: { connected: false, username: null, synced_at: null },
  outlook: { connected: false, email: null, synced_at: null },
}

export function mockApi(page, method, pattern, response, status = 200) {
  return page.route(pattern, (route) => {
    if (route.request().method() === method.toUpperCase()) {
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) })
    } else {
      route.continue()
    }
  })
}

export function mockAllDashboardApis(page) {
  return Promise.all([
    page.route('**/api/outfits/recommendations/weekly/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WEEKLY_OUTFITS) })
    }),
    page.route('**/api/itinerary/events/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: EVENTS }) })
    }),
  ])
}

export function mockAllWardrobeApis(page) {
  return Promise.all([
    page.route('**/api/wardrobe/items/*', (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: WARDROBE_ITEMS }) })
      } else if (method === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 99, ...JSON.parse(route.request().postData() || '{}'), times_worn: 0 }) })
      } else if (method === 'DELETE') {
        route.fulfill({ status: 204 })
      } else {
        route.continue()
      }
    }),
  ])
}

export function mockAllTripApis(page) {
  return Promise.all([
    page.route('**/api/itinerary/trips/', (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: TRIPS }) })
      } else if (method === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 99, ...JSON.parse(route.request().postData() || '{}') }) })
      } else {
        route.continue()
      }
    }),
    page.route('**/api/shared-wardrobes/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBES) })
    }),
    page.route('**/api/itinerary/trips/*/save-recommendation/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'saved', shared_wardrobe_items_added: 3 }) })
    }),
    page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ name: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.68, longitude: 139.69 }] }) })
    }),
    page.route('**/api/agents/packing-list/', (route) => {
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          output: { recommendation: { days: [{ day: 1, wardrobe_matches: [{ item: { id: 1, name: 'Navy Blazer' } }] }] } },
        }),
      })
    }),
  ])
}

export function mockAllSocialApis(page) {
  return Promise.all([
    page.route('**/api/social/me/profile/', (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SOCIAL_PROFILE) })
      } else if (method === 'PATCH') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...SOCIAL_PROFILE, ...JSON.parse(route.request().postData() || '{}') }) })
      } else {
        route.continue()
      }
    }),
    page.route('**/api/social/connections/*', (route) => {
      const url = route.request().url()
      if (url.includes('status=accepted')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: CONNECTIONS.accepted }) })
      } else if (url.includes('status=pending')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: CONNECTIONS.pending }) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
      }
    }),
    page.route('**/api/social/users/search/*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ found: true, user: { id: 5, first_name: 'Charlie', handle: 'charlie_style', display_name: 'Charlie', bio: 'Loves fashion', connection: null }, is_self: false }) })
    }),
    page.route('**/api/messages/conversations/', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CONVERSATIONS) })
      } else {
        route.continue()
      }
    }),
    page.route('**/api/messages/conversations/*/messages/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MESSAGES) })
    }),
    page.route('**/api/messages/conversations/*/send/', (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 99, sender: 1, body: JSON.parse(route.request().postData()).body, created_at: new Date().toISOString() }) })
    }),
    page.route('**/api/shared-wardrobes/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SHARED_WARDROBES) })
    }),
    page.route('**/api/shared-wardrobes/invitations/', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    }),
  ])
}
