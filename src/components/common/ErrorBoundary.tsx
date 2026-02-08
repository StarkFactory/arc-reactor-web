import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{
              color: '#94a3b8',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}>
              An unexpected error occurred. Try refreshing the page or click the button below to recover.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#1e293b',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#f87171',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '120px',
                marginBottom: '24px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
