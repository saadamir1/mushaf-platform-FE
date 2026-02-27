import React from 'react';
import globalErrorHandler from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      // Used to trigger the boundary via a render-time throw
      pendingTriggerError: null,
    };

    this._isMounted = false;
    this._pendingError = null; // Errors that arrive before componentDidMount
  }

  // ── Error Boundary lifecycle ──────────────────────────────────────────────

  static getDerivedStateFromError(error) {
    return { hasError: true, error, pendingTriggerError: null };
  }

  componentDidMount() {
    this._isMounted = true;

    // Register with the global handler AFTER mount so setState is safe
    globalErrorHandler.setErrorBoundary(this);

    // Flush any error that arrived before we were mounted
    if (this._pendingError) {
      this.setState({ hasError: true, error: this._pendingError });
      this._pendingError = null;
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.hideReactErrorOverlay();
    this.setState({ hasError: true, error });
  }

  // ── Public API (called by globalErrorHandler) ─────────────────────────────

  /**
   * Handle errors originating outside React (window.onerror, unhandledrejection,
   * setTimeout, event handlers, etc.).
   *
   * Error Boundaries cannot catch these natively, so we update state manually.
   */
  handleGlobalError = (error) => {
    const err = error || new Error('An unexpected error occurred');

    if (this._isMounted) {
      this.setState((prevState) => {
        // Don't overwrite an already-visible error
        if (prevState.hasError) return null;
        return { hasError: true, error: err };
      });
    } else {
      // Queue for componentDidMount to flush
      this._pendingError = err;
    }
  };

  /**
   * Trigger the error fallback UI from outside the component.
   *
   * Sets `pendingTriggerError` so that on the NEXT render we throw inside
   * render(), letting React's own getDerivedStateFromError handle it cleanly —
   * no "setState on unmounted component" warnings.
   */
  triggerErrorBoundary = (error) => {
    const err = error || new Error('Manual error trigger');

    if (this._isMounted) {
      this.setState({ pendingTriggerError: err });
    } else {
      this._pendingError = err;
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  hideReactErrorOverlay = () => {
    const selectors = [
      '#webpack-dev-server-client-overlay',
      '#__next-error-overlay',
      '.react-error-overlay',
      '.dev-overlay',
      '[data-react-error-overlay]',
    ];

    selectors.forEach((selector) => {
      const overlay = document.querySelector(selector);
      if (overlay) {
        overlay.style.display = 'none';
        overlay.remove();
      }
    });

    const modals = document.querySelectorAll('.modal, .dialog, .popup');
    modals.forEach((modal) => {
      const text = modal.textContent ? modal.textContent.toLowerCase() : '';
      if (text.includes('error')) {
        modal.style.display = 'none';
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    // Throw during render so getDerivedStateFromError handles it correctly.
    // This is triggered by an external call to triggerErrorBoundary().
    if (this.state.pendingTriggerError) {
      throw this.state.pendingTriggerError;
    }

    if (this.state.hasError) {
      return (
        <div
          className="error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--background-color, #f8f9fa)',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-color, #e9ecef)',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem', lineHeight: '1', display: 'block' }}>
                🚨
              </span>
            </div>
            <h2
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                color: 'var(--text-color, #333)',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                margin: '0 0 1.5rem 0',
                color: 'var(--text-color, #666)',
                lineHeight: '1.5',
              }}
            >
              We apologize for the inconvenience. The application encountered an
              unexpected error.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  textAlign: 'left',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#495057',
                  }}
                >
                  Technical Details (Development Mode)
                </summary>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <p>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                </div>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-color, #007bff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 4px rgba(0, 123, 255, 0.3)',
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-color, #333)',
                  border: '1px solid var(--border-color, #dee2e6)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                🏠 Go Home
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--success-color, #28a745)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                🛠️ Try Again
              </button>
            </div>

            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-color, #666)',
                opacity: 0.8,
              }}
            >
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;