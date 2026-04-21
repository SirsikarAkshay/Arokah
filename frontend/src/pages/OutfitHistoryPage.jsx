import { useState, useEffect, useCallback } from 'react'
import { outfits as outfitsApi } from '../api/index.js'

const CAT_ICONS = {
  top: '👕', bottom: '👖', dress: '👗', outerwear: '🧥',
  footwear: '👟', accessory: '💍', activewear: '🏃', formal: '🤵', other: '📦',
}

function StatsCard({ prefs }) {
  if (!prefs || !prefs.total_recommendations) return null
  const { total_recommendations: total, accepted, rejected, acceptance_rate: rate,
          preferred_categories: prefCats = [], preferred_colors: prefColors = [] } = prefs

  return (
    <div className="card fade-up" style={{ marginBottom: 20, background: 'var(--surface-2)' }}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 14 }}>Your Style Stats</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Pill label="Total" value={total} />
        <Pill label="Accepted" value={accepted} color="var(--sage)" />
        <Pill label="Skipped" value={rejected} color="var(--terra)" />
        {rate != null && <Pill label="Rate" value={`${Math.round(rate * 100)}%`} />}
      </div>
      {prefCats.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 6 }}>Preferred Categories</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {prefCats.slice(0, 5).map(c => (
              <span key={c.category} className="badge badge-sage">
                {c.category} {Math.round(c.rate * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
      {prefColors.length > 0 && (
        <div>
          <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 6 }}>Favorite Colors</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {prefColors.slice(0, 6).map(c => (
              <span key={c.color} className="badge badge-sky">{c.color}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Pill({ label, value, color }) {
  return (
    <div style={{ padding: '8px 14px', background: 'var(--surface-1)', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: color || 'var(--cream)' }}>{value}</div>
      <div style={{ fontSize: '0.625rem', color: 'var(--cream-dim)' }}>{label}</div>
    </div>
  )
}

function HistoryTile({ rec }) {
  const date = rec.date ? new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }) : ''
  const items = rec.outfit_items || []
  const weather = rec.weather_snapshot || {}

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9375rem' }}>{date}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
            <span className="badge badge-sky">{rec.source}</span>
            {weather.temp_c != null && (
              <span style={{ fontSize: '0.75rem', color: 'var(--cream-dim)' }}>{weather.temp_c}°C</span>
            )}
          </div>
        </div>
        {rec.accepted === true && <span className="badge badge-sage">Accepted</span>}
        {rec.accepted === false && <span className="badge badge-terra">Skipped</span>}
        {rec.accepted == null && <span className="badge">Pending</span>}
      </div>

      {rec.notes && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--cream-dim)', fontStyle: 'italic',
                      lineHeight: 1.4, marginBottom: 12 }}>
          "{rec.notes}"
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((oi, i) => {
            const cat = oi.item_category || 'other'
            const name = oi.item_name || `Item #${oi.clothing_item}`
            const liked = oi.liked
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 10,
                background: liked === true ? 'rgba(164,190,123,0.12)' :
                           liked === false ? 'rgba(196,164,132,0.12)' :
                           'var(--surface-2)',
                border: '1px solid var(--border)',
              }}>
                <span>{CAT_ICONS[cat] || '📦'}</span>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cream)' }}>{name}</div>
                  <div style={{ fontSize: '0.5625rem', color: 'var(--cream-dim)' }}>{oi.role}</div>
                </div>
                {liked === true && <span style={{ fontSize: '0.6875rem' }}>👍</span>}
                {liked === false && <span style={{ fontSize: '0.6875rem' }}>👎</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function OutfitHistoryPage() {
  const [recs, setRecs]     = useState([])
  const [prefs, setPrefs]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { days: 90 }
      if (filter) params.status = filter
      const [history, preferences] = await Promise.all([
        outfitsApi.history(params),
        outfitsApi.preferences(),
      ])
      setRecs(Array.isArray(history) ? history : history?.results || [])
      setPrefs(preferences)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="page-header fade-up">
        <div className="date-line">Style Intelligence</div>
        <h1>Outfit History</h1>
        <p>Track your outfit recommendations and build your style profile</p>
      </div>

      <StatsCard prefs={prefs} />

      <div className="fade-up fade-up-delay-1" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['', 'All'], ['accepted', 'Accepted'], ['rejected', 'Skipped'], ['pending', 'Pending']].map(([val, label]) => (
          <button
            key={val}
            className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : recs.length === 0 ? (
        <div className="empty-state card fade-up">
          <div className="empty-icon">👗</div>
          <div className="empty-title">No outfit history yet</div>
          <div className="empty-body">Generate daily looks from the dashboard to start building your style profile.</div>
        </div>
      ) : (
        <div className="fade-up fade-up-delay-2">
          {recs.map(rec => <HistoryTile key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  )
}
