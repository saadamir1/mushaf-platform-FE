import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// HOW ERROR HANDLING WORKS IN THIS APP
//
// Two types of errors, two different flows:
//
// 1. React errors (thrown during render/lifecycle of child components)
//    → Caught automatically by React via getDerivedStateFromError + componentDidCatch
//
// 2. Non-React errors (setTimeout, event handlers, Promise rejections)
//    → React boundaries CANNOT catch these
//    → Caught by GlobalErrorHandler in src/utils/errorHandler.js
//    → GlobalErrorHandler calls errorBoundary.handleGlobalError() on this component
//    → handleGlobalError() calls setState() to show the fallback UI
//
// Registration (this component → GlobalErrorHandler) happens in componentDidMount,
// NOT the constructor — setState is unsafe before mount and would silently fail.
//
// Related files:
//   src/utils/errorHandler.js       → window error listeners, calls handleGlobalError()
//   src/components/ErrorBoundary.js → this file
//   public/index.html               → inline script sets data-theme before React loads
//                                     (prevents flash-of-wrong-theme on reload/navigation)
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// WHY ErrorThrower EXISTS
//
// External code (GlobalErrorHandler) can call triggerErrorBoundary() to manually
// show the error UI. The naive fix — throw inside this component's own render() —
// doesn't work: a boundary cannot catch its OWN render errors, so the throw
// escapes upward and crashes the whole tree (white screen).
//
// Fix: render this tiny child. When `error` prop is set it throws during its
// render, and THIS component (its parent boundary) catches it correctly.
// ─────────────────────────────────────────────────────────────────────────────
const ErrorThrower = ({ error }) => {
    if (error) throw error;
    return null;
};


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showFallback: false,
            triggerError: null,
        };

        this._isMounted = false;
        this._pendingError = null; // holds errors that arrive before componentDidMount
    }

    // ── React Error Boundary lifecycle ────────────────────────────────────────

    static getDerivedStateFromError(error) {
        // Runs synchronously during the render that threw.
        // triggerError reset to null stops ErrorThrower from throwing again.
        return {
            hasError: true,
            error,
            showFallback: true,
            triggerError: null,
        };
    }

    componentDidCatch(error, errorInfo) {
        // Dev only: full error details in console, not in the UI
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 ErrorBoundary caught error');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            if (errorInfo?.componentStack) {
                console.error('Component Stack:', errorInfo.componentStack);
            }
            console.groupEnd();
        }

        this.hideDevOverlays();
        this.setState({ errorInfo });
    }

    componentDidMount() {
        this._isMounted = true;

        // Register with GlobalErrorHandler so it can call handleGlobalError()
        // on non-React errors. Must be here (not constructor) — see file header.
        if (typeof window !== 'undefined' && window.globalErrorHandler) {
            if (!window.globalErrorHandler.isRegistered) {
                window.globalErrorHandler.setErrorBoundary(this);
                window.globalErrorHandler.isRegistered = true;
            }
        }

        // Flush any error that arrived before mount
        if (this._pendingError) {
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

    // ── Public API — called by GlobalErrorHandler ─────────────────────────────

    // Handles non-React errors forwarded from src/utils/errorHandler.js
    handleGlobalError = (error) => {
        this.hideDevOverlays();

        if (this._isMounted) {
            this.setState((prevState) => {
                if (prevState.hasError && prevState.showFallback) return null;
                return {
                    hasError: true,
                    error: error || new Error('An unexpected error occurred'),
                    errorInfo: null,
                    showFallback: true,
                    triggerError: null,
                };
            });
        } else {
            this._pendingError = error || new Error('An unexpected error occurred');
        }
    };

    // Programmatically show error UI — uses ErrorThrower child pattern (see above)
    triggerErrorBoundary = (error) => {
        const err = error || new Error('Manual error trigger');
        if (this._isMounted) {
            this.setState({ triggerError: err });
        } else {
            this._pendingError = err;
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Only target known dev overlay selectors — never do text-content sweeps,
    // they match our own UI ("Something went wrong") and hide it.
    hideDevOverlays = () => {
        [
            '#webpack-dev-server-client-overlay',
            '#__next-error-overlay',
            '.react-error-overlay',
            '.dev-overlay',
            '[data-react-error-overlay]',
        ].forEach((sel) => {
            const el = document.querySelector(sel);
            if (el) { el.style.display = 'none'; el.remove(); }
        });
    };

    handleRefresh = () => {
        window.location.reload();
    };

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        if (this.state.hasError && this.state.showFallback) {
            // Theme is applied by the inline script in public/index.html before
            // React loads, so CSS variables from data-theme are always correct here.
            return (
                <div className="robust-error-boundary">
                    <div className="error-card">
                        <span className="error-icon">🚨</span>
                        <h2 className="error-title">Something went wrong</h2>
                        <p className="error-description">
                            We apologize for the inconvenience. The Mushaf Platform encountered an unexpected error.
                        </p>

                        <div className="error-actions">
                            <button
                                onClick={this.handleRefresh}
                                className="error-btn primary"
                            >
                                🔄 Refresh Page
                            </button>
                        </div>

                        <p className="error-support">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        // ErrorThrower is a no-op when triggerError is null.
        // When triggerError is set, it throws as a child so this boundary catches it.
        return (
            <>
                <ErrorThrower error={this.state.triggerError} />
                {this.props.children}
            </>
        );
    }
}

export default ErrorBoundary;