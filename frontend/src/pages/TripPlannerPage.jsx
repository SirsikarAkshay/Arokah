// src/pages/TripPlannerPage.jsx
import { useState, useEffect } from 'react'
import { itinerary as itineraryApi, agents } from '../api/index.js'

export default function TripPlannerPage() {
  const [trips,    setTrips]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showNew,  setShowNew]  = useState(false)
  const [editing,  setEditing]  = useState(null) // trip id being edited
  const [recommending, setRecommending] = useState(null)
  const [recs,     setRecs]     = useState(null)  // { trip_id, output }
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const [form, setForm] = useState({
    name: '', destination: '', start_date: '', end_date: '', activities: '',
  })
  const [editForm, setEditForm] = useState({
    name: '', destination: '', start_date: '', end_date: '', activities: '',
  })

  useEffect(() => {
    itineraryApi.trips.list()
      .then(d => setTrips(d?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createTrip = async (e) => {
    e.preventDefault()
    try {
      const trip = await itineraryApi.trips.create({
        name: form.name,
        destination: form.destination,
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.activities,
      })
      setTrips(prev => [trip, ...prev])
      setForm({ name: '', destination: '', start_date: '', end_date: '', activities: '' })
      setShowNew(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditing = (trip) => {
    setEditing(trip.id)
    setEditForm({
      name: trip.name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      activities: trip.notes || '',
    })
  }

  const updateTrip = async (e) => {
    e.preventDefault()
    try {
      const updated = await itineraryApi.trips.update(editing, {
        name: editForm.name,
        destination: editForm.destination,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        notes: editForm.activities,
      })
      setTrips(prev => prev.map(t => t.id === editing ? { ...t, ...updated } : t))
      setEditing(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const getRecommendations = async (trip) => {
    setRecommending(trip.id)
    setError('')
    try {
      const result = await agents.smartRecommend({
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        occasion: 'travel',
      })
      const output = result?.output || result
      setRecs({ trip_id: trip.id, output })
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Recommendation failed.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setRecommending(null)
    }
  }

  const saveRecommendation = async (tripId) => {
    if (!recs || recs.trip_id !== tripId) return
    setSaving(true)
    try {
      await itineraryApi.trips.saveRecommendation(tripId, recs.output)
      setTrips(prev => prev.map(t =>
        t.id === tripId ? { ...t, saved_recommendation: recs.output } : t
      ))
      setRecs(null)
    } catch (err) {
      setError(err.message || 'Failed to save recommendation.')
    } finally {
      setSaving(false)
    }
  }

  const clearSavedRecommendation = async (tripId) => {
    try {
      await itineraryApi.trips.clearRecommendation(tripId)
      setTrips(prev => prev.map(t =>
        t.id === tripId ? { ...t, saved_recommendation: null } : t
      ))
    } catch (err) {
      setError(err.message || 'Failed to clear recommendation.')
    }
  }

  const viewSaved = (trip) => {
    setRecs({ trip_id: trip.id, output: trip.saved_recommendation, saved: true })
  }

  const deleteTrip = async (id) => {
    if (!confirm('Delete this trip?')) return
    await itineraryApi.trips.delete(id)
    setTrips(prev => prev.filter(t => t.id !== id))
    if (recs?.trip_id === id) setRecs(null)
  }

  const daysUntil = (date) => {
    const d = Math.ceil((new Date(date) - new Date()) / 86400000)
    if (d < 0) return 'Past'
    if (d === 0) return 'Today'
    return `In ${d} day${d !== 1 ? 's' : ''}`
  }

  return (
    <div>
      <div className="page-header fade-up">
        <div className="date-line">Trip Planner</div>
        <h1>Your Travels</h1>
        <p>Plan outfits for every day of your trip.</p>
      </div>

      {error && <div className="alert alert-error fade-up" style={{ marginBottom: '20px' }}>⚠ {error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }} className="fade-up fade-up-delay-1">
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? '✕ Cancel' : '+ New Trip'}
        </button>
      </div>

      {showNew && (
        <div className="card fade-up" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--cream)', marginBottom: '20px' }}>
            Plan a new trip
          </h3>
          <form onSubmit={createTrip} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Trip name *</label>
              <input className="input" required placeholder="e.g. Tokyo Adventure" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Destination *</label>
              <input className="input" required placeholder="e.g. Tokyo, Japan" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Departure *</label>
              <input className="input" type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Return *</label>
              <input className="input" type="date" required value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Activities <span style={{ color: 'var(--cream-dim)', fontWeight: 400 }}>(optional)</span></label>
              <input className="input" placeholder="e.g. hiking, beach, business meetings" value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save trip</button>
            </div>
          </form>
        </div>
      )}

      {/* Trips list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state card fade-up">
          <div className="empty-icon">✈</div>
          <div className="empty-title">No trips planned</div>
          <div className="empty-body">Add a trip and let the AI plan your outfits day by day.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map(trip => {
            const numDays = Math.max(1, Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000) + 1)
            const isPast = new Date(trip.end_date) < new Date()
            const hasSaved = !!trip.saved_recommendation
            const isViewingThis = recs?.trip_id === trip.id
            return (
              <div key={trip.id} className="card fade-up">
                {/* Inline edit form */}
                {editing === trip.id ? (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--cream)', marginBottom: '16px' }}>
                      Edit trip
                    </h3>
                    <form onSubmit={updateTrip} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Trip name *</label>
                        <input className="input" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Destination *</label>
                        <input className="input" required value={editForm.destination} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Departure *</label>
                        <input className="input" type="date" required value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Return *</label>
                        <input className="input" type="date" required value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Activities <span style={{ color: 'var(--cream-dim)', fontWeight: 400 }}>(optional)</span></label>
                        <input className="input" placeholder="e.g. hiking, beach, business meetings" value={editForm.activities} onChange={e => setEditForm(f => ({ ...f, activities: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm">Update trip</button>
                      </div>
                    </form>
                  </div>
                ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>✈</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '1rem' }}>{trip.name}</span>
                      {!isPast && (
                        <span className={`badge ${daysUntil(trip.start_date) === 'Today' ? 'badge-terra' : 'badge-sky'}`}>
                          {daysUntil(trip.start_date)}
                        </span>
                      )}
                      {isPast && <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--cream-dim)' }}>Past</span>}
                      {hasSaved && <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>Saved plan</span>}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--cream-dim)' }}>
                      📍 {trip.destination} · {numDays} day{numDays !== 1 ? 's' : ''} · {trip.start_date} → {trip.end_date}
                    </div>
                    {trip.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', marginTop: '4px', fontStyle: 'italic' }}>
                        {trip.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasSaved && !isViewingThis && (
                      <button className="btn btn-secondary btn-sm" onClick={() => viewSaved(trip)}>
                        View plan
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => getRecommendations(trip)}
                      disabled={recommending === trip.id}
                    >
                      {recommending === trip.id
                        ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Recommending...</>
                        : hasSaved ? '✧ Refresh' : '✧ Recommend outfits'
                      }
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEditing(trip)} title="Edit trip">✎</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteTrip(trip.id)} title="Delete trip">✕</button>
                  </div>
                </div>
                )}

                {/* Recommendations panel */}
                {isViewingThis && recs.output && (
                  <TripRecommendations
                    output={recs.output}
                    tripId={trip.id}
                    isSaved={recs.saved || hasSaved}
                    onClose={() => setRecs(null)}
                    onSave={() => saveRecommendation(trip.id)}
                    onClear={() => clearSavedRecommendation(trip.id)}
                    saving={saving}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


/* ── Trip Recommendations — tabbed layout ────────────────────────────── */

function TripRecommendations({ output, tripId, isSaved, onClose, onSave, onClear, saving }) {
  const [activeTab, setActiveTab] = useState('outfits')

  const cultural = output.cultural || {}
  const shopping = output.shopping_suggestions || []
  const days     = output.days || []
  const highlights = cultural.highlights || []

  // Counts for tab badges
  const outfitCount = days.length || (output.wardrobe_matches?.length || 0)
  const shoppingCount = shopping.length
  const placesCount = highlights.length
  const rulesCount = (cultural.rules || []).length + (cultural.events || []).length

  const TABS = [
    { id: 'outfits',  label: 'Outfit Plan',   icon: '👔', count: outfitCount },
    { id: 'shopping', label: 'Items to Buy',  icon: '🛍', count: shoppingCount },
    { id: 'places',   label: 'Places to Visit', icon: '📍', count: placesCount },
    { id: 'culture',  label: 'Cultural Guide', icon: '📜', count: rulesCount },
  ]

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
      {/* Header with save/close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          AI Outfit Recommendations
          {isSaved && (
            <span className="badge badge-sage" style={{ fontSize: '0.6rem' }}>Saved</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isSaved && (
            <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving...</> : 'Save plan'}
            </button>
          )}
          {isSaved && (
            <button className="btn btn-ghost btn-sm" onClick={onClear} style={{ fontSize: '0.75rem', color: 'var(--cream-dim)' }}>
              Remove saved
            </button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {/* Overall dress code banner */}
      {cultural.overall_dress_code && (
        <div style={{
          padding: '12px 14px', marginBottom: '16px', borderLeft: '3px solid var(--terra)',
          background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem', color: 'var(--cream)', lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--cream-dim)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Local dress code · </span>
          {cultural.overall_dress_code}
        </div>
      )}

      {/* Tab bar */}
      <div
        role="tablist"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
          borderBottom: '1px solid var(--border)', paddingBottom: 2,
        }}
      >
        {TABS.map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(t.id)}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 0, border: 'none',
                borderBottom: isActive ? '2px solid var(--terra-light)' : '2px solid transparent',
                color: isActive ? 'var(--cream)' : 'var(--cream-dim)',
                fontWeight: isActive ? 500 : 400,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--cream-dim)', fontSize: '0.65rem', padding: '2px 8px' }}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Tab: Outfit Plan ──────────────────────────────────────────── */}
      {activeTab === 'outfits' && (
        <OutfitPlanTab days={days} output={output} />
      )}

      {/* ─�� Tab: Items to Buy ──────��──────────────────────────────────── */}
      {activeTab === 'shopping' && (
        <ShoppingTab shopping={shopping} days={days} />
      )}

      {/* ── Tab: Places to Visit ────────────────────────────────────���─── */}
      {activeTab === 'places' && (
        <PlacesTab highlights={highlights} />
      )}

      {/* ── Tab: Cultural Guide ────���───────────────────────────────────�� */}
      {activeTab === 'culture' && (
        <CultureTab cultural={cultural} />
      )}
    </div>
  )
}


/* ── Tab: Outfit Plan ────────────────────────────────────────────────── */

function OutfitPlanTab({ days, output }) {
  const formatDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }
    catch { return d }
  }

  const weatherIcon = (w) => w?.is_raining ? '🌧' : w?.is_cold ? '🧥' : w?.is_hot ? '☀' : '⛅'

  // Multi-day
  if (days.length > 0) {
    return (
      <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {days.map(day => {
          const w = day.weather
          const matches = day.wardrobe_matches || []
          const gaps = day.gaps || []
          return (
            <div key={day.day} style={{
              padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              {/* Day header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--terra)', minWidth: '36px' }}>
                  D{day.day}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--cream)', fontWeight: 500 }}>{formatDate(day.date)}</span>
                <span style={{ fontSize: '1.1rem' }}>{weatherIcon(w)}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--cream-dim)' }}>
                  {w?.temp_c != null ? `${Math.round(w.temp_c)}°C` : '?'} · {w?.condition || ''}
                </span>
                {w?.precipitation_probability > 30 && (
                  <span className="badge badge-sky" style={{ fontSize: '0.6rem' }}>
                    {w.precipitation_probability}% rain
                  </span>
                )}
              </div>

              {/* Wardrobe matches */}
              {matches.length > 0 && (
                <div style={{ marginBottom: gaps.length > 0 ? '12px' : 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--cream-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    From your wardrobe
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {matches.map((m, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>{ROLE_ICON[m.role] || '👔'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.item.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--cream-dim)' }}>
                            {m.item.category} · {m.role}
                          </div>
                        </div>
                        <span className="badge badge-sage" style={{ fontSize: '0.6rem', flexShrink: 0 }}>owned</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {gaps.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--terra-light)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {matches.length > 0 ? 'Missing items' : 'Items needed'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {gaps.map((g, i) => (
                      <span key={i} style={{
                        fontSize: '0.75rem', padding: '5px 12px', borderRadius: '999px',
                        background: 'rgba(224,164,88,0.1)', color: '#e0a458',
                        border: '1px solid rgba(224,164,88,0.25)',
                      }}>
                        {g.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matches.length === 0 && gaps.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
                  No specific outfit items for this day
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Single-day fallback
  const matches = output.wardrobe_matches || []
  const outfit = output.outfit || {}
  return (
    <div role="tabpanel">
      {outfit.notes && (
        <div style={{ padding: '12px 14px', marginBottom: '16px', borderLeft: '3px solid var(--terra)', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--cream)', lineHeight: 1.5 }}>
          {outfit.notes}
        </div>
      )}
      {matches.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {matches.map((m, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', color: 'var(--cream)', marginBottom: '4px' }}>{m.item.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginBottom: '6px' }}>{m.item.category} / {m.item.formality}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                <span className="badge badge-terra" style={{ fontSize: '0.65rem' }}>owned</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👔</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--cream-dim)' }}>No wardrobe matches found. Check the Items to Buy tab for suggestions.</div>
        </div>
      )}
    </div>
  )
}


/* ── Tab: Items to Buy ──────────────��────────────────────���───────────── */

function ShoppingTab({ shopping, days }) {
  const hasWardrobeItems = days.some(d => (d.wardrobe_matches || []).length > 0)

  if (shopping.length === 0) {
    return (
      <div role="tabpanel" className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
        <div style={{ fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '4px' }}>You're all set!</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>Your wardrobe has everything you need for this trip.</div>
      </div>
    )
  }

  return (
    <div role="tabpanel">
      <div style={{ color: 'var(--cream-dim)', fontSize: '0.85rem', marginBottom: 16 }}>
        {hasWardrobeItems
          ? 'These items are missing from your wardrobe. Tap a link to shop.'
          : 'Recommended products for your trip. Tap a link to shop.'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shopping.map((s, i) => (
          <div key={i} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{ROLE_ICON[s.role] || '🛍'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '0.95rem' }}>
                  {s.name || s.description}
                </span>
                {s.price_range && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--terra-light)', whiteSpace: 'nowrap', marginLeft: '8px', fontWeight: 500 }}>
                    {s.price_range}
                  </span>
                )}
              </div>
              {s.brand && (
                <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginBottom: '4px' }}>{s.brand}</div>
              )}
              {s.description && s.name && (
                <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {s.description}
                </div>
              )}
              {s.why && (
                <div style={{ fontSize: '0.75rem', color: 'var(--terra-light)', marginBottom: '10px', fontStyle: 'italic' }}>
                  {s.why}
                </div>
              )}
              {(s.links?.google_shopping || s.links?.amazon || s.links?.asos) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  {s.links.google_shopping && (
                    <a href={s.links.google_shopping} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: 100, textDecoration: 'none' }}>
                      🔗 Google Shopping
                    </a>
                  )}
                  {s.links.amazon && (
                    <a href={s.links.amazon} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: 100, textDecoration: 'none' }}>
                      🔗 Amazon
                    </a>
                  )}
                  {s.links.asos && (
                    <a href={s.links.asos} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: 100, textDecoration: 'none' }}>
                      🔗 ASOS
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ─�� Tab: Places to Visit ──────────���─────────────────────────────────── */

function PlacesTab({ highlights }) {
  if (highlights.length === 0) {
    return (
      <div role="tabpanel" className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📍</div>
        <div style={{ fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '4px' }}>No places yet</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>AI couldn't identify specific places for this destination.</div>
      </div>
    )
  }

  return (
    <div role="tabpanel">
      <div style={{ color: 'var(--cream-dim)', fontSize: '0.85rem', marginBottom: 16 }}>
        Must-visit spots with specific clothing guidance for each.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {highlights.map((h, i) => (
          <div key={i} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                {h.type === 'nature' ? '🌿' : h.type === 'restaurant' ? '🍽' : h.type === 'market' ? '🛒' : h.type === 'museum' ? '🏛' : '📍'}
              </span>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 500, color: 'var(--cream)', fontSize: '0.95rem' }}>
                {h.name}
              </div>
              {h.formality && (
                <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--cream-dim)', fontSize: '0.65rem' }}>
                  {h.formality.replace('_', ' ')}
                </span>
              )}
            </div>
            {h.description && (
              <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', lineHeight: 1.4 }}>
                {h.description}
              </div>
            )}
            {h.clothing_tip && (
              <div style={{
                marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)',
                fontSize: '0.8rem', color: 'var(--cream)', lineHeight: 1.4,
              }}>
                <span style={{ color: 'var(--terra-light)', fontWeight: 500 }}>👔 What to wear: </span>
                {h.clothing_tip}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ── Tab: Cultural Guide ─────────────────��───────────────────────────── */

const SEVERITY_STYLE = {
  required: { badge: 'badge-terra', icon: '⚠' },
  warning:  { badge: 'badge-gold',  icon: '⚡' },
  info:     { badge: 'badge-sky',   icon: 'ℹ' },
}

function CultureTab({ cultural }) {
  const rules = cultural.rules || []
  const events = cultural.events || []
  const tips = cultural.general_tips || []

  if (rules.length === 0 && events.length === 0 && tips.length === 0) {
    return (
      <div role="tabpanel" className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📜</div>
        <div style={{ fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '4px' }}>No cultural data</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>Check local dress codes before your trip.</div>
      </div>
    )
  }

  return (
    <div role="tabpanel">
      {/* Dress code rules */}
      {rules.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--cream)', marginBottom: 12 }}>
            Dress Code Rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((rule, i) => {
              const sev = SEVERITY_STYLE[rule.severity] || SEVERITY_STYLE.info
              return (
                <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14 }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{sev.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className={`badge ${sev.badge}`} style={{ fontSize: '0.65rem' }}>{rule.severity}</span>
                      {rule.type && rule.type !== 'general' && (
                        <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--cream-dim)', fontSize: '0.65rem' }}>
                          {rule.type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {rule.applies_to && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--cream-dim)' }}>· {rule.applies_to}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--cream)', lineHeight: 1.4 }}>
                      {rule.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Events */}
      {events.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--cream)', marginBottom: 12 }}>
            Local Events
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {events.map((ev, i) => (
              <div key={i} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>🎊</span>
                  <span style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '0.95rem', flex: 1 }}>{ev.name}</span>
                </div>
                {ev.date_range && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--terra-light)', fontWeight: 500 }}>📅 {ev.date_range}</div>
                )}
                {ev.description && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', lineHeight: 1.4 }}>{ev.description}</div>
                )}
                {ev.clothing_note && (
                  <div style={{
                    marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)',
                    fontSize: '0.8rem', color: 'var(--cream)', lineHeight: 1.4,
                  }}>
                    <span style={{ color: 'var(--terra-light)', fontWeight: 500 }}>👔 </span>
                    {ev.clothing_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General tips */}
      {tips.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--cream)', marginBottom: 12 }}>
            General Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{
                padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--cream)', lineHeight: 1.4,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ color: 'var(--terra-light)', flexShrink: 0 }}>💡</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


/* ── Constants ─────���──────────────────────────────────────────────────── */

const ROLE_ICON = {
  top: '👕', bottom: '👖', dress: '👗', outerwear: '🧥',
  footwear: '👟', accessory: '💍', main: '👔',
}
