import React from 'react';

class GlobalErrorHandler {
    constructor() {
        if (GlobalErrorHandler.instance) {
            return GlobalErrorHandler.instance;
        }

        this.errorBoundary = null;
        this.isHandlingError = false;
        this.handledErrors = new Set();
        this.setupGlobalErrorHandling();

        GlobalErrorHandler.instance = this;
        return this;
    }

    setErrorBoundary(errorBoundary) {
        if (!this.errorBoundary) {
            this.errorBoundary = errorBoundary;
            console.log('✅ GlobalErrorHandler: Error boundary registered successfully');
        } else {
            console.warn('⚠️ GlobalErrorHandler: Error boundary already registered, ignoring duplicate');
        }
    }

    setupGlobalErrorHandling() {
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            event.preventDefault(); // Suppress "Uncaught (in promise)" browser log
            this.handleGlobalError(event.reason);
        });

        // Catch synchronous global errors (setTimeout throws, etc.)
        // NOTE: do NOT use capture phase (true) here — it intercepts React's own
        // internal error dispatching and breaks React's error boundary mechanism,
        // causing a white screen instead of showing the fallback UI.
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error:', event.error);
            event.preventDefault(); // Suppress "Uncaught Error" browser log
            this.handleGlobalError(event.error);
        });
    }

    handleGlobalError(error) {
        // Deduplicate: same error object fired by multiple listeners (e.g.
        // both window.onerror and 'error' event for the same throw)
        if (error && this.handledErrors.has(error)) {
            console.warn('⚠️ GlobalErrorHandler: Duplicate error, skipping');
            return;
        }

        if (error) {
            this.handledErrors.add(error);
            // Clean up after a short window to avoid memory leaks
            setTimeout(() => this.handledErrors.delete(error), 2000);
        }

        console.log('🚨 GlobalErrorHandler: Processing global error');
        console.log('🚨 GlobalErrorHandler: errorBoundary exists?', !!this.errorBoundary);
        console.log('🚨 GlobalErrorHandler: errorBoundary.handleGlobalError exists?', !!this.errorBoundary?.handleGlobalError);

        // Hide React dev overlay FIRST, before calling error boundary
        this.hideReactDevOverlay();

        if (this.errorBoundary && this.errorBoundary.handleGlobalError) {
            console.log('✅ GlobalErrorHandler: Triggering error boundary');
            console.log('✅ GlobalErrorHandler: About to call handleGlobalError on:', this.errorBoundary);
            try {
                this.errorBoundary.handleGlobalError(error);
                console.log('✅ GlobalErrorHandler: handleGlobalError called successfully');
            } catch (handlingError) {
                console.error('🚨 GlobalErrorHandler: Error while triggering boundary:', handlingError);
            }
        } else {
            console.warn('⚠️ GlobalErrorHandler: No error boundary registered');
            console.warn('⚠️ GlobalErrorHandler: this.errorBoundary =', this.errorBoundary);
        }
    }

    /**
     * Hides React dev overlays WITHOUT doing aggressive DOM sweeps that would hide our error UI.
     */
    hideReactDevOverlay() {
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
    }
}

// ── Singleton bootstrap ───────────────────────────────────────────────────────
console.log('🚨 GlobalErrorHandler: Creating singleton instance');
const globalErrorHandler = new GlobalErrorHandler();

console.log('🚨 GlobalErrorHandler: Setting window.globalErrorHandler');
window.globalErrorHandler = globalErrorHandler;
console.log('🚨 GlobalErrorHandler: window.globalErrorHandler set to:', window.globalErrorHandler);

// ── Higher-order component ────────────────────────────────────────────────────
export const withErrorBoundary = (Component) => {
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
            console.error('Error caught by HOC boundary:', error, errorInfo);
            globalErrorHandler.hideReactDevOverlay();
        }

        render() {
            if (this.state.hasError) {
                return (
                    <div style={{
                        padding: '2rem', textAlign: 'center',
                        backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '1rem 0',
                    }}>
                        <h3>Something went wrong with this component</h3>
                        <p>Please try refreshing the page or contact support.</p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            style={{
                                padding: '0.5rem 1rem', backgroundColor: '#007bff',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                );
            }
            return <Component {...this.props} />;
        }
    };
};

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Safely execute a function; forwards any thrown error to the global handler. */
export const safeExecute = (fn, fallback = null) => {
    try {
        return fn();
    } catch (error) {
        console.error('Error in safeExecute:', error);
        globalErrorHandler.handleGlobalError(error);
        return fallback;
    }
};

/**
 * Wrap an event handler so thrown errors are caught and forwarded to the
 * global handler instead of propagating as uncaught.
 */
export const wrapEventHandler = (handler) => {
    return (event) => {
        try {
            return handler(event);
        } catch (error) {
            console.error('Error in event handler:', error);
            globalErrorHandler.handleGlobalError(error);
            if (event && event.preventDefault) event.preventDefault();
        }
    };
};

export default globalErrorHandler;