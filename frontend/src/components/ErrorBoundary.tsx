import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-warm)', fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 28px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--destructive-wash)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: 10, letterSpacing: '-0.022em' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--fog)', marginBottom: 24, lineHeight: 1.55 }}>
            {this.state.error.message}
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
