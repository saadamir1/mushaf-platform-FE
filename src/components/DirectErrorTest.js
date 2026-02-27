import React from 'react';

/**
 * ErrorThrower — a pure render-time thrower.
 *
 * Error Boundaries only catch errors thrown *during rendering*.
 * Throwing from an event handler (onClick) is NOT caught by the boundary
 * that wraps it — it must happen inside a child's render() call.
 *
 * This tiny component is that child: when `shouldThrow` is true it throws
 * during render, which DirectErrorTest's getDerivedStateFromError catches.
 */
const ErrorThrower = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Direct error boundary test');
    }
    return null;
};

class DirectErrorTest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            // Flip to true to make ErrorThrower throw on next render
            shouldThrow: false,
        };
    }

    // ── Error Boundary lifecycle ──────────────────────────────────────────────

    static getDerivedStateFromError(error) {
        // Runs synchronously during the render that threw.
        // Reset shouldThrow so we don't throw again if the user clicks "Try Again".
        return { hasError: true, error, shouldThrow: false };
    }

    componentDidCatch(error, errorInfo) {
        console.log('🔍 DirectErrorTest: componentDidCatch —', error, errorInfo);
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    /**
     * Trigger a render-time throw by setting shouldThrow = true.
     * React will re-render, ErrorThrower will throw, and getDerivedStateFromError
     * will catch it — no event-handler / lifecycle workaround needed.
     */
    triggerError = () => {
        this.setState({ shouldThrow: true });
    };

    tryAgain = () => {
        this.setState({ hasError: false, error: null, shouldThrow: false });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        margin: '1rem 0',
                    }}
                >
                    <h3>Direct Error Caught! ✅</h3>
                    <p>This error boundary caught the error directly.</p>
                    {this.state.error && (
                        <pre
                            style={{
                                fontSize: '0.8rem',
                                color: '#666',
                                backgroundColor: '#fff',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                                textAlign: 'left',
                                overflowX: 'auto',
                            }}
                        >
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <button
                        onClick={this.tryAgain}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Direct Error Test</h2>
                <p>
                    This component has its own error boundary. Clicking the button below
                    triggers a <strong>render-time</strong> throw, which is the only kind
                    that React Error Boundaries can catch.
                </p>

                {/*
                 * ErrorThrower lives inside the render tree.
                 * When shouldThrow becomes true it throws during React's render pass,
                 * which getDerivedStateFromError above catches correctly.
                 */}
                <ErrorThrower shouldThrow={this.state.shouldThrow} />

                <button
                    onClick={this.triggerError}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                    }}
                >
                    Throw Direct Error
                </button>
            </div>
        );
    }
}

export default DirectErrorTest;