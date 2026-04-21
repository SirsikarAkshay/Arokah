# Flutter Mobile — Parity Gaps vs Web

Comparison of `mobile_flutter/lib` against `frontend/src`. Started 2026-04-14.

## 1. Cultural screen — ✅ Done

`lib/screens/cultural_screen.dart` rewritten.

- [x] `_activeTab` state + tab bar (Etiquette / Places / Events / Wardrobe) with per-tab counts.
- [x] "✦ AI Advice" button calls `agentsApi.culturalAdvisor` and overwrites `_rules` / `_events` / `_advice` on `status == 'completed'`.
- [x] Severity badges (`required` / `warning` / `info`) with color + icon per rule.
- [x] Rule-type icon map (`_ruleIcons`) ported from web.
- [x] Popular-country chip row.
- [x] `month` is passed to `cultural.events` call.
- [x] Places highlights with clothing guidance, event highlights, wardrobe matches, gap cards with shop links (via `url_launcher`).

## 2. Itinerary screen — ✅ Done

`lib/screens/itinerary_screen.dart` rewritten.

- [x] Week-range state + prev/next/today controls + tappable date picker. Passes `start_date` / `end_date` to `itineraryApi.events.list`.
- [x] "Check conflicts" button + `_ConflictsCard` via `agentsApi.conflictDetector`.
- [x] "+ Add event" bottom sheet calling `itineraryApi.events.create` (title / event_type / start / end / location).
- [x] `no_calendars_connected` banner with deep link to `/profile`.
- [x] Event-type icons (`_eventIcons`) and formality badge variant map (`_formalityVariant`).

## 3. Wardrobe screen — ✅ Done

`lib/screens/wardrobe_screen.dart` rewritten.

- [x] `WardrobeApi.analyzeImage(filePath)` added in `lib/api/api.dart` (POST `/wardrobe/analyze-image/`).
- [x] `ApiClient.uploadFile(path, field, filePath)` multipart helper with bearer auth + token-refresh retry, added to `lib/api/api_client.dart`.
- [x] `_AddItemSheet` extended with formality / season / colors / material / weight_grams.
- [x] "Add from a photo" block with Camera + Gallery buttons (via `image_picker`); auto-fills form from `analyzeImage` response.
- [x] Debounced search field + Category / Formality / Season dropdowns.
- [x] Item cards render category emoji, category badge (color-coded), formality/season pills, brand, colors list, `Worn N×` + weight grams.
- [x] Delete confirmation dialog.

## 4. Profile screen — ✅ Done

`lib/screens/profile_screen.dart` rewritten.

- [x] Google connect: `url_launcher` opens `auth_url` externally, `Timer.periodic(2s)` polls `calendarApi.status()` up to 2 min.
- [x] Outlook connect: same pattern, with specific error message when backend reports `not_configured`.
- [x] Apple connect: `_AppleCredentialSheet` collecting Apple ID + App-Specific Password (normalizes password to `xxxx-xxxx-xxxx-xxxx` format), then `calendarApi.apple.connect({username, password})`.
- [x] Connected rows show email/username (per `identifierKey`) and `Last synced Nm ago`.
- [x] Account info rows (AI engine, data region, push notifications).
- [x] Danger zone with "Delete account" → confirm dialog → `authApi.deleteAccount()` → `AuthProvider.logout()`.

## 5. Cross-cutting — ✅ Done

- [x] `AppToast.show(context, message, error: bool)` helper added in `lib/widgets/ui.dart` (floating snackbar with ✓/⚠ prefix; uses `AppColors.surface2` / danger tint). Existing screens keep their local `_flash` / `AlertBanner` patterns; new code should prefer `AppToast`.
- [x] `HealthApi` added to `lib/api/api.dart` and exposed as `healthApi` global (`healthApi.check()` → GET `/health/`).
- [x] `agentsApi.conflictDetector` + `agentsApi.culturalAdvisor` are now wired up by gaps 1 & 2 — no longer dead bindings.

---

All five parity gaps closed. `flutter analyze` shows only pre-existing lints in `router.dart`, `sustainability_screen.dart`, and the original `api_client.dart` code — nothing introduced by these changes.
