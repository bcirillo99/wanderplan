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
        {label}{required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </label>

      {/* Main input area */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          border: `1px solid ${open ? 'var(--forest-light)' : 'var(--cream-dark)'}`,
          borderRadius: 12, background: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(184,221,200,0.35)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          overflow: 'hidden',
          minHeight: 42,
        }}
      >
        {/* Code badge */}
        {displayCode && (
          <span style={{
            flexShrink: 0, padding: '0 10px',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700, fontSize: '1rem',
            color: 'var(--forest)', borderRight: '1px solid var(--cream-dark)',
            alignSelf: 'stretch', display: 'flex', alignItems: 'center',
          }}>
            {displayCode}
          </span>
        )}

        {selected ? (
          /* Resolved state: show city + name */
          <span style={{
            flex: 1, padding: '0 10px',
            fontSize: '0.8rem', color: '#6b7280',
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
              padding: '10px 12px', fontSize: '0.875rem',
              color: 'var(--charcoal)', background: 'transparent',
              fontFamily: 'DM Sans, sans-serif',
            }}
            autoComplete="off"
          />
        )}

        {/* Clear / loading icon */}
        {loading && (
          <span style={{ padding: '0 10px', color: 'var(--sage)', fontSize: '0.75rem' }}>…</span>
        )}
        {(selected || value) && !loading && (
          <button
            type="button"
            onClick={clear}
            style={{
              padding: '0 10px', border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center',
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
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#fff', borderRadius: 12,
            border: '1px solid var(--cream-dark)',
            boxShadow: '0 8px 32px rgba(26,58,42,0.12)',
            zIndex: 300, overflow: 'hidden',
            animation: 'fadeIn 0.15s ease both',
          }}
        >
          {results.map((a, i) => (
            <button
              key={a.code}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(a) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: i === activeIdx ? 'var(--mist)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--cream-dark)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700, fontSize: '0.95rem',
                color: 'var(--forest)', width: 38, flexShrink: 0,
              }}>
                {a.code}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--charcoal)', display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.city}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name}
                </span>
              </span>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af', flexShrink: 0 }}>
                {a.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
