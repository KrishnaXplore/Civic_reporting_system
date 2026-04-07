import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8FAFC', fontFamily: 'sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>⚠️</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', background: '#3B82F6', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
