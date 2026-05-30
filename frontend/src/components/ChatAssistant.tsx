import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sendChatMessage, type HistoryMessage } from '../api/chat'
import { createActivity } from '../api/activities'
import { createFlight } from '../api/flights'
import { createAccommodation } from '../api/accommodations'
import { createTransport } from '../api/transports'
import { createExtra } from '../api/extras'
import { createPackingItem } from '../api/packing_items'
import { createNote } from '../api/notes'
import { QUERY_KEYS } from '../hooks/useTripData'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TextMsg {
  id: string
  role: 'user' | 'assistant'
  type: 'text'
  content: string
}

interface ActionMsg {
  id: string
  role: 'assistant'
  type: 'action'
  entityType: string
  data: Record<string, unknown>
  state: 'pending' | 'confirmed' | 'dismissed'
}

type ChatMsg = TextMsg | ActionMsg

// ── Helpers ────────────────────────────────────────────────────────────────────

const ENTITY_LABELS: Record<string, string> = {
  activity:      'Activity',
  transport:     'Transport',
  accommodation: 'Accommodation',
  flight:        'Flight',
  note:          'Note',
  packing_item:  'Packing Item',
  extra:         'Extra',
}

function getDisplayFields(entityType: string, data: Record<string, unknown>) {
  const fmt = (v: unknown) => v != null && v !== '' ? String(v) : null
  switch (entityType) {
    case 'activity':
      return [
        { label: 'Title',    value: fmt(data.title) },
        { label: 'Date',     value: fmt(data.activity_date) },
        { label: 'Time',     value: data.start_time ? `${data.start_time}${data.end_time ? ` – ${data.end_time}` : ''}` : null },
        { label: 'Location', value: fmt(data.location) },
        { label: 'Cost',     value: data.cost != null ? String(data.cost) : null },
      ]
    case 'transport':
      return [
        { label: 'Type',      value: fmt(data.transport_type) },
        { label: 'From',      value: fmt(data.origin) },
        { label: 'To',        value: fmt(data.destination) },
        { label: 'Departure', value: fmt(data.departure_time) },
      ]
    case 'accommodation':
      return [
        { label: 'Name',      value: fmt(data.name) },
        { label: 'Type',      value: fmt(data.accommodation_type) },
        { label: 'Check-in',  value: fmt(data.check_in) },
        { label: 'Check-out', value: fmt(data.check_out) },
      ]
    case 'flight':
      return [
        { label: 'From',      value: fmt(data.origin) },
        { label: 'To',        value: fmt(data.destination) },
        { label: 'Departure', value: fmt(data.departure_time) },
        { label: 'Airline',   value: fmt(data.airline) },
        { label: 'Flight',    value: fmt(data.flight_number) },
      ]
    case 'note':
      return [{ label: 'Text', value: fmt(data.text) }]
    case 'packing_item':
      return [
        { label: 'Item',     value: fmt(data.name) },
        { label: 'Category', value: fmt(data.category) },
      ]
    case 'extra':
      return [
        { label: 'Category',    value: fmt(data.category) },
        { label: 'Description', value: fmt(data.description) },
        { label: 'Amount',      value: data.amount != null ? `${data.amount}${data.currency ? ` ${data.currency}` : ''}` : null },
      ]
    default:
      return Object.entries(data).slice(0, 4).map(([k, v]) => ({ label: k, value: fmt(v) }))
  }
}

async function dispatchCreate(tripId: string, entityType: string, data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  switch (entityType) {
    case 'activity':      return createActivity(tripId, d)
    case 'transport':     return createTransport(tripId, d)
    case 'accommodation': return createAccommodation(tripId, d)
    case 'flight':        return createFlight(tripId, d)
    case 'note':          return createNote(tripId, d)
    case 'packing_item':  return createPackingItem(tripId, d)
    case 'extra':         return createExtra(tripId, d)
    default: throw new Error(`Unknown entity type: ${entityType}`)
  }
}

function getQueryKey(tripId: string, entityType: string) {
  switch (entityType) {
    case 'activity':      return QUERY_KEYS.activities(tripId)
    case 'transport':     return QUERY_KEYS.transports(tripId)
    case 'accommodation': return QUERY_KEYS.accommodations(tripId)
    case 'flight':        return QUERY_KEYS.flights(tripId)
    case 'note':          return QUERY_KEYS.notes(tripId)
    case 'packing_item':  return QUERY_KEYS.packingItems(tripId)
    case 'extra':         return QUERY_KEYS.extras(tripId)
    default: return null
  }
}

// ── ActionCard ─────────────────────────────────────────────────────────────────

function ActionCard({ msg, tripId, onStateChange }: {
  msg: ActionMsg
  tripId: string
  onStateChange: (id: string, state: ActionMsg['state']) => void
}) {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)

  const label = ENTITY_LABELS[msg.entityType] ?? msg.entityType
  const fields = getDisplayFields(msg.entityType, msg.data).filter(f => f.value !== null)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await dispatchCreate(tripId, msg.entityType, msg.data)
      const key = getQueryKey(tripId, msg.entityType)
      if (key) await qc.invalidateQueries({ queryKey: key })
      onStateChange(msg.id, 'confirmed')
      toast.success(`${label} added to your trip`)
    } catch {
      toast.error('Failed to add item. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (msg.state === 'confirmed') {
    return (
      <div className="chat-action-card chat-action-card--confirmed">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2 7.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label} added
      </div>
    )
  }

  if (msg.state === 'dismissed') {
    return (
      <div className="chat-action-card chat-action-card--dismissed">
        {label} dismissed
      </div>
    )
  }

  return (
    <div className="chat-action-card">
      <div className="chat-action-card__header">
        <span className="chat-action-card__badge">{label.toUpperCase()}</span>
      </div>
      <dl className="chat-action-card__fields">
        {fields.map(f => (
          <div key={f.label} className="chat-action-card__field">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      <div className="chat-action-card__actions">
        <button
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '10px 16px' }}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? 'Adding…' : 'Add to trip'}
        </button>
        <button
          className="btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
          onClick={() => onStateChange(msg.id, 'dismissed')}
          disabled={busy}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ── TypingIndicator ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble--ai" aria-label="AI is typing">
      <div className="chat-typing">
        <span /><span /><span />
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

// Converts local UI messages → Ollama history format.
// Action messages are represented as plain text so the model retains context.
function buildHistory(messages: ChatMsg[]): HistoryMessage[] {
  const history: HistoryMessage[] = []
  for (const m of messages) {
    if (m.type === 'text') {
      history.push({ role: m.role, content: m.content })
    } else {
      // action message — summarize so the model knows what happened
      const label = ENTITY_LABELS[m.entityType] ?? m.entityType
      if (m.state === 'confirmed') {
        const details = Object.entries(m.data)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
        history.push({ role: 'assistant', content: `I added a ${label} to the trip (${details}).` })
      } else if (m.state === 'dismissed') {
        history.push({ role: 'assistant', content: `I proposed adding a ${label} but the user dismissed it.` })
      }
      // pending actions are not yet resolved — exclude from history
    }
  }
  return history
}

export default function ChatAssistant({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: TextMsg = { id: crypto.randomUUID(), role: 'user', type: 'text', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await sendChatMessage(tripId, text, buildHistory(messages))
      if (res.type === 'text') {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', type: 'text',
          content: res.content ?? '',
        }])
      } else if (res.type === 'action' && res.action) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', type: 'action',
          entityType: res.action!.entity_type,
          data: res.action!.data,
          state: 'pending',
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', type: 'text',
        content: 'Could not reach the AI assistant. Make sure Ollama is running.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
  }

  const handleActionStateChange = (id: string, state: ActionMsg['state']) => {
    setMessages(prev => prev.map(m =>
      m.id === id && m.type === 'action' ? { ...m, state } : m
    ))
  }

  return (
    <>
      <div
        className={`chat-overlay${open ? ' chat-overlay--open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open AI assistant">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            {/* Robot head */}
            <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            {/* Eyes */}
            <circle cx="9.5" cy="12" r="1.2" fill="currentColor" />
            <circle cx="14.5" cy="12" r="1.2" fill="currentColor" />
            {/* Antenna */}
            <line x1="12" y1="7" x2="12" y2="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="12" cy="3.2" r="1" fill="currentColor" />
            {/* Ears */}
            <line x1="5" y1="11.5" x2="3" y2="11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <line x1="19" y1="11.5" x2="21" y2="11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <div
        className={`chat-drawer${open ? ' chat-drawer--open' : ''}`}
        role="dialog"
        aria-label="WanderPlan AI assistant"
        aria-modal={open}
      >
        <div className="chat-drawer__header">
          <div className="chat-drawer__header-title">
            <span className="chat-drawer__ai-dot" aria-hidden />
            WanderPlan AI
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className="btn-ghost"
              style={{ padding: '6px 8px' }}
              onClick={() => { setMessages([]); setInput('') }}
              aria-label="Clear conversation"
              title="Clear conversation"
              disabled={messages.length === 0}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 1v3.5L10.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="btn-ghost"
              style={{ padding: '6px 8px' }}
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-messages" role="log" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="chat-empty">
              <p>Ask me anything about your trip, or say <em>"Add a visit to the Eiffel Tower on June 5th"</em> to let me help you plan.</p>
            </div>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-message-row${msg.role === 'user' ? ' chat-message-row--user' : ''}`}
            >
              {msg.type === 'text' ? (
                <div className={`chat-bubble chat-bubble--${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.content}
                </div>
              ) : (
                <ActionCard
                  msg={msg}
                  tripId={tripId}
                  onStateChange={handleActionStateChange}
                />
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message-row">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your trip…"
              rows={1}
              disabled={loading}
              aria-label="Message to AI assistant"
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M14 8H2M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="chat-input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  )
}
