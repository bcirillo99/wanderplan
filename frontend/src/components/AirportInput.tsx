// frontend/src/components/AirportInput.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchAirports, getAirport, type AirportResult } from '../api/airports'

interface AirportInputProps {
  label: string
  value: string           // IATA code stored in form state
  onChange: (code: string) => void
  placeholder?: string
  required?: boolean
}

function useDebounce(value: string, ms: number) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

export default function AirportInput({ label, value, onChange, placeholder = 'JFK', required }: AirportInputProps) {
  const [query, setQuery]       = useState('')        // text in the input
  const [results, setResults]   = useState<AirportResult[]>([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState<AirportResult | null>(null)
  const [activeIdx, setActiveIdx] = useState(-1)

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounced   = useDebounce(query, 280)

  // Resolve initial value to display name
  useEffect(() => {
    if (!value) { setSelected(null); setQuery(''); return }
    if (selected?.code === value) return
    getAirport(value).then(a => {
      if (a) { setSelected(a); setQuery('') }
    })
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search when debounced query changes
  useEffect(() => {
    if (!debounced || selected) return
    setLoading(true)
    searchAirports(debounced)
      .then(r => { setResults(r); setOpen(r.length > 0); setActiveIdx(-1) })
      .finally(() => setLoading(false))
  }, [debounced, selected])

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = useCallback((a: AirportResult) => {
    setSelected(a)
    setQuery('')
    setOpen(false)
    setResults([])
    onChange(a.code)
  }, [onChange])

  function clear() {
    setSelected(null)
    setQuery('')
    setResults([])
    setOpen(false)
    onChange('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(results[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const displayCode = selected?.code ?? value

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label className="form-label">
        {label}{required && <span style={{ color: 'var(--destructive)', marginLeft: 2 }}>*</span>}
      </label>

      {/* Main input area */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          border: `1px solid ${open ? 'var(--charcoal)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-sm)', background: 'var(--surface-white)',
          boxShadow: open ? '0 0 0 4px oklch(22% 0.012 50 / 0.06)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
          overflow: 'hidden',
          minHeight: 46,
        }}
      >
        {/* Code badge */}
        {displayCode && (
          <span className="tabular" style={{
            flexShrink: 0, padding: '0 14px',
            fontWeight: 700, fontSize: '0.9375rem',
            color: 'var(--coral-deep)', borderRight: '1px solid var(--border-subtle)',
            alignSelf: 'stretch', display: 'flex', alignItems: 'center',
            letterSpacing: '0.02em',
          }}>
            {displayCode}
          </span>
        )}

        {selected ? (
          /* Resolved state: show city + name */
          <span style={{
            flex: 1, padding: '0 14px',
            fontSize: '0.875rem', color: 'var(--fog)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selected.city} · {selected.name}
          </span>
        ) : (
          /* Typing state */
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
            onFocus={() => { if (results.length) setOpen(true) }}
            onKeyDown={onKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '12px 14px', fontSize: '0.9375rem',
              color: 'var(--charcoal)', background: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
            autoComplete="off"
          />
        )}

        {/* Clear / loading icon */}
        {loading && (
          <span style={{ padding: '0 12px', color: 'var(--fog)', fontSize: '0.75rem' }}>…</span>
        )}
        {(selected || value) && !loading && (
          <button
            type="button"
            onClick={clear}
            style={{
              padding: '0 12px', border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--whisper)', display: 'flex', alignItems: 'center',
              alignSelf: 'stretch',
            }}
            title="Clear"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="material-panel"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            zIndex: 300, overflow: 'hidden',
            boxShadow: 'var(--shadow-float)',
            animation: 'scaleIn 0.18s var(--ease-out-quart) both',
            transformOrigin: 'top center',
          }}
        >
          {results.map((a, i) => (
            <button
              key={a.code}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(a) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: i === activeIdx ? 'var(--surface-warm)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="tabular" style={{
                fontWeight: 700, fontSize: '0.9375rem',
                color: 'var(--coral-deep)', width: 42, flexShrink: 0,
                letterSpacing: '0.02em',
              }}>
                {a.code}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--charcoal)', display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {a.city}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--fog)', display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name}
                </span>
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--fog)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                {a.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
