import React from 'react';

class DirectErrorTest extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    throwError = () => {
        throw new Error('Direct error boundary test');
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    margin: '1rem 0'
                }}>
                    <h3>Direct Error Caught!</h3>
                    <p>This error boundary caught the error directly.</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
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
                <p>This component has its own error boundary.</p>
                <button
                    onClick={this.throwError}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Throw Direct Error
                </button>
            </div>
        );
    }
}

export default DirectErrorTest;