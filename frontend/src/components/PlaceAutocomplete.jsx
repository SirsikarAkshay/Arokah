import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Open-Meteo geocoding — free, no API key, CORS-enabled.
// https://open-meteo.com/en/docs/geocoding-api
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// GeoNames feature-code prefixes we care about:
//   PCL*  — political entity (country, dependency)
//   PPL*  — populated place (city/town/village)
function filterByMode(results, mode, { countryCode, countryName } = {}) {
  if (!Array.isArray(results)) return []
  if (mode === 'country') {
    const seen = new Set()
    return results
      .filter((p) => typeof p.feature_code === 'string' && p.feature_code.startsWith('PCL'))
      .filter((p) => {
        const key = p.country_code || p.country || p.name
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }
  if (mode === 'city') {
    const ccUpper = (countryCode || '').toUpperCase()
    const cnLower = (countryName || '').trim().toLowerCase()
    return results.filter((p) => {
      if (typeof p.feature_code !== 'string' || !p.feature_code.startsWith('PPL')) return false
      if (ccUpper && (p.country_code || '').toUpperCase() !== ccUpper) return false
      if (!ccUpper && cnLower && (p.country || '').toLowerCase() !== cnLower) return false
      return true
    })
  }
  return results
}

function formatPlace(p, mode) {
  if (mode === 'country') return p.country || p.name
  return [p.name, p.admin1, p.country].filter(Boolean).join(', ')
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search a place…',
  className = 'input',
  style,
  required = false,
  minChars = 2,
  autoFocus = false,
  mode = null,           // 'country' | 'city' | null
  countryCode = null,    // ISO-3166-1 alpha-2, used in city mode
  countryName = null,    // country name fallback filter when code missing
  disabled = false,
  disabledHint = '',
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [rect, setRect] = useState(null)
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  // Keep the portal dropdown positioned relative to the input on resize/scroll.
  useEffect(() => {
    if (!open) return
    const update = () => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, suggestions.length])

  useEffect(() => {
    const q = (value || '').trim()
    if (q.length < minChars) {
      setSuggestions([])
      setLoading(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl
        setLoading(true)
        // Request more when filtering to give enough post-filter candidates.
        const count = mode ? 20 : 6
        const params = new URLSearchParams({
          name: q,
          count: String(count),
          language: 'en',
          format: 'json',
        })
        if (mode === 'city' && countryCode) params.set('countryCode', countryCode)
        const resp = await fetch(`${GEOCODE_URL}?${params.toString()}`, { signal: ctrl.signal })
        const data = await resp.json()
        const filtered = filterByMode(data?.results, mode, { countryCode, countryName }).slice(0, 6)
        setSuggestions(filtered)
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(debounceRef.current)
  }, [value, minChars, mode, countryCode, countryName])

  useEffect(() => {
    const handler = (e) => {
      const inBox = boxRef.current && boxRef.current.contains(e.target)
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      if (!inBox && !inDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (p) => {
    const label = formatPlace(p, mode)
    onChange?.(label)
    onSelect?.({ label, ...p })
    setOpen(false)
    setHighlight(-1)
  }

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault()
      pick(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && (suggestions.length > 0 || loading) && rect

  return (
    <div ref={boxRef} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        className={className}
        value={value}
        onChange={(e) => { onChange?.(e.target.value); setOpen(true); setHighlight(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={disabled && disabledHint ? disabledHint : placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
        disabled={disabled}
      />
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            zIndex: 2147483000,
            background: 'var(--surface-1, #1b1411)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {loading && suggestions.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
              Searching…
            </div>
          )}
          {suggestions.map((p, i) => {
            const primary = mode === 'country' ? (p.country || p.name) : p.name
            const secondary = mode === 'country'
              ? ''
              : [p.admin1, p.country].filter(Boolean).join(', ')
            return (
              <button
                key={`${p.id}-${i}`}
                type="button"
                role="option"
                aria-selected={highlight === i}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(p) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  background: highlight === i ? 'var(--surface-2)' : 'transparent',
                  border: 'none',
                  borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--border)',
                  color: 'var(--cream)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>📍</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--cream)' }}>{primary}</span>
                  {secondary && (
                    <span style={{ color: 'var(--cream-dim)', fontSize: '0.78rem', marginLeft: 8 }}>
                      {secondary}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
