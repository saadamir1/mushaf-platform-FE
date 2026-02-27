import React, { useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../styles/theme';

/**
 * ErrorThrower — a tiny child that throws during render when given an error.
 *
 * WHY THIS EXISTS:
 * An Error Boundary cannot catch its own render errors — only errors from
 * its children. So to programmatically trigger the boundary from outside
 * (e.g. global error handler), we set `triggerError` on state, which passes
 * the error to this child, which throws during React's render pass, which
 * RobustErrorBoundary (the parent) catches via getDerivedStateFromError.
 *
 * This avoids:
 *  - "Cannot update during an existing state transition" (throwing in render())
 *  - "Can't call setState on unmounted component" (constructor registration)
 *  - Uncaught errors propagating past the boundary to crash the whole tree
 */
const ErrorThrower = ({ error }) => {
    if (error) throw error;
    return null;
};

class RobustErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showFallback: false,
            // Set by triggerErrorBoundary(); causes ErrorThrower child to throw
            // on the next render so getDerivedStateFromError handles it cleanly.
            triggerError: null,
        };

        this._isMounted = false;
        this._pendingError = null; // Queue for errors arriving before componentDidMount
    }

    // ── Error Boundary lifecycle ──────────────────────────────────────────────

    static getDerivedStateFromError(error) {
        // Clear triggerError so ErrorThrower stops throwing on re-renders
        return {
            hasError: true,
            error,
            showFallback: true,
            triggerError: null,
        };
    }

    componentDidMount() {
        this._isMounted = true;

        // Register AFTER mount — setState is only safe after componentDidMount
        if (typeof window !== 'undefined' && window.globalErrorHandler) {
            if (!window.globalErrorHandler.isRegistered) {
                console.log('✅ RobustErrorBoundary: Registering with global error handler');
                window.globalErrorHandler.setErrorBoundary(this);
                window.globalErrorHandler.isRegistered = true;
            } else {
                console.log('⚠️ RobustErrorBoundary: Already registered, skipping');
            }
        } else {
            console.warn('⚠️ RobustErrorBoundary: Global error handler not available');
        }

        // Flush any error that arrived before mount
        if (this._pendingError) {
            console.log('🔍 RobustErrorBoundary: Flushing pre-mount error');
            this.setState({
                hasError: true,
                error: this._pendingError,
                errorInfo: null,
                showFallback: true,
                triggerError: null,
            });
            this._pendingError = null;
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (typeof window !== 'undefined' && window.globalErrorHandler) {
            window.globalErrorHandler.isRegistered = false;
        }
    }

    componentDidCatch(error, errorInfo) {
        console.log('🔍 RobustErrorBoundary: componentDidCatch', error);
        this.hideAllErrorOverlays();
        this.setState({ errorInfo }, () => {
            console.log('🔍 RobustErrorBoundary: error UI now visible');
        });
    }

    // ── Public API (called by GlobalErrorHandler) ─────────────────────────────

    /**
     * For non-React errors: window.onerror, unhandledrejection, setTimeout throws,
     * event handlers. Uses direct setState — safe because this runs outside render.
     */
    handleGlobalError = (error) => {
        console.log('🔍 RobustErrorBoundary: handleGlobalError called with:', error);
        console.log('🔍 RobustErrorBoundary: _isMounted =', this._isMounted);

        // Hide error overlays first
        this.hideAllErrorOverlays();

        if (this._isMounted) {
            console.log('🔍 RobustErrorBoundary: Calling setState with error state');
            this.setState((prevState) => {
                console.log('🔍 RobustErrorBoundary: prevState =', prevState);
                if (prevState.hasError && prevState.showFallback) {
                    console.log('🔍 RobustErrorBoundary: Error already visible, returning null');
                    return null; // don't update state
                }
                const newState = {
                    hasError: true,
                    error: error || new Error('An unexpected error occurred'),
                    errorInfo: null,
                    showFallback: true,
                    triggerError: null,
                };
                console.log('🔍 RobustErrorBoundary: New state =', newState);
                return newState;
            }, () => {
                console.log('🔍 RobustErrorBoundary: setState callback - state updated, current state =', this.state);
            });
        } else {
            console.log('🔍 RobustErrorBoundary: Not yet mounted, queuing error');
            this._pendingError = error || new Error('An unexpected error occurred');
        }
    };

    /**
     * Programmatically show the error UI from outside (e.g. ErrorTest green button).
     *
     * Sets triggerError → React re-renders → ErrorThrower child throws →
     * getDerivedStateFromError on THIS component catches it → error UI shows.
     * No warnings, no white screen, no uncaught propagation.
     */
    triggerErrorBoundary = (error) => {
        console.log('🔍 RobustErrorBoundary: triggerErrorBoundary called');
        const err = error || new Error('Manual error trigger');

        if (this._isMounted) {
            this.setState({ triggerError: err });
        } else {
            this._pendingError = err;
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    hideAllErrorOverlays = () => {
        const selectors = [
            '#webpack-dev-server-client-overlay',
            '#__next-error-overlay',
            '.react-error-overlay',
            '.dev-overlay',
            '[data-react-error-overlay]',
        ];
        selectors.forEach((selector) => {
            const el = document.querySelector(selector);
            if (el) { el.style.display = 'none'; el.remove(); }
        });

        // DO NOT do aggressive DOM sweeps like searching for text containing "error"
        // or "something went wrong" — those patterns match our own error UI!
        // Just hide known error overlays above and let our error boundary render cleanly.
    };

    handleRefresh = () => window.location.reload();
    handleGoHome = () => { window.location.href = '/'; };
    handleTryAgain = () => {
        this.setState({
            hasError: false, error: null, errorInfo: null,
            showFallback: false, triggerError: null,
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        const { isDark } = this.context || { isDark: false };
        const theme = isDark ? COLORS.dark : COLORS.light;

        console.log('🔍 RobustErrorBoundary: render() called, state =', this.state);
        if (this.state.hasError && this.state.showFallback) {
            console.log('🔍 RobustErrorBoundary: ✅ Showing error UI');
            return (
                <div className="robust-error-boundary" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', padding: '2rem',
                    textAlign: 'center', backgroundColor: theme.bg,
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, overflow: 'auto',
                }}>
                    <div style={{
                        backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px',
                        maxWidth: '600px', width: '100%',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        border: `1px solid ${theme.border}`,
                    }}>
                        <span style={{ fontSize: '3rem', lineHeight: '1', display: 'block', marginBottom: '1rem' }}>
                            🚨
                        </span>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: theme.text }}>
                            Something went wrong
                        </h2>
                        <p style={{ margin: '0 0 1.5rem 0', color: theme.textSecondary, lineHeight: '1.5' }}>
                            We apologize for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                marginBottom: '1.5rem', padding: '1rem', backgroundColor: theme.bg,
                                borderRadius: '6px', border: `1px solid ${theme.border}`, textAlign: 'left',
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: theme.text }}>
                                    Technical Details (Development Mode)
                                </summary>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                    <p><strong>Error:</strong> {this.state.error.toString()}</p>
                                    {this.state.errorInfo?.componentStack && (
                                        <>
                                            <p><strong>Component Stack:</strong></p>
                                            <pre style={{ fontSize: '0.75rem', color: theme.textSecondary, whiteSpace: 'pre-wrap' }}>
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </>
                                    )}
                                </div>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={this.handleRefresh} style={{
                                padding: '0.75rem 1.5rem', backgroundColor: theme.primary,
                                color: 'white', border: 'none', borderRadius: '6px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            }}>🔄 Refresh Page</button>
                            <button onClick={this.handleGoHome} style={{
                                padding: '0.75rem 1.5rem', backgroundColor: 'transparent',
                                color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
                            }}>🏠 Go Home</button>
                            <button onClick={this.handleTryAgain} style={{
                                padding: '0.75rem 1.5rem', backgroundColor: theme.success,
                                color: 'white', border: 'none', borderRadius: '6px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
                            }}>🛠️ Try Again</button>
                        </div>

                        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: theme.textSecondary, opacity: 0.8 }}>
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        console.log('🔍 RobustErrorBoundary: Rendering normal children');
        // ErrorThrower renders as a child of this boundary.
        // When triggerError is set, it throws during React's render pass,
        // and THIS component catches it via getDerivedStateFromError above.
        return (
            <>
                <ErrorThrower error={this.state.triggerError} />
                {this.props.children}
            </>
        );
    }
}

export default RobustErrorBoundary;