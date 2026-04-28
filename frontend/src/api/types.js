// Re-exports OpenAPI-generated types as JSDoc-friendly type aliases.
// Use these in your hand-written code via JSDoc:
//
//   /** @typedef {import('./types.js').WardrobeItem} WardrobeItem */
//   /** @param {WardrobeItem} item */
//   function renderCard(item) { ... }
//
// Editors (VS Code, JetBrains) get full autocomplete from these.
// Build-time validation: `npm run check:api` (runs tsc --noEmit).
//
// Regenerate after backend changes: `npm run gen:api`.

/**
 * @typedef {import('./generated/schema').components['schemas']} Schemas
 * @typedef {import('./generated/schema').paths} Paths
 * @typedef {import('./generated/schema').operations} Operations
 */

/**
 * Helper to extract a request body type for a given operation.
 * Usage: `/** @type {OperationRequestBody<'wardrobe_items_create'>} *\/`
 *
 * @template {keyof Operations} OpId
 * @typedef {Operations[OpId] extends { requestBody?: { content: { 'application/json': infer R } } } ? R : never} OperationRequestBody
 */

/**
 * Helper to extract a 2xx response body for a given operation.
 *
 * @template {keyof Operations} OpId
 * @typedef {Operations[OpId] extends { responses: infer R }
 *   ? R extends { 200: { content: { 'application/json': infer B } } } ? B
 *   : R extends { 201: { content: { 'application/json': infer B } } } ? B
 *   : never : never} OperationResponse
 */

// Convenient named exports so consumers can `import { ... } from '../api/types.js'`
// rather than chaining through Schemas.

/** @typedef {Schemas['User']} User */
/** @typedef {Schemas['ClothingItem']} ClothingItem */
/** @typedef {Schemas['ClothingItemRequest']} ClothingItemRequest */
/** @typedef {Schemas['OutfitRecommendation']} OutfitRecommendation */
/** @typedef {Schemas['OutfitRecommendationRequest']} OutfitRecommendationRequest */
/** @typedef {Schemas['CalendarEvent']} CalendarEvent */
/** @typedef {Schemas['CulturalRule']} CulturalRule */
/** @typedef {Schemas['SustainabilityLog']} SustainabilityLog */
/** @typedef {Schemas['DailyLookResponse']} DailyLookResponse */
/** @typedef {Schemas['PackingListResponse']} PackingListResponse */

export {}
