import React, { useState, useRef, useEffect } from 'react';

const ErrorTest = () => {
    const [shouldThrow, setShouldThrow] = useState(false);
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const throwError = () => {
        console.log('🔥 ErrorTest: About to throw error');
        console.log('🔥 ErrorTest: Error boundary registered?', window.globalErrorHandler?.errorBoundary);

        // Use a more controlled approach to trigger the error
        // Throw the error asynchronously with a small delay to ensure component is mounted
        setTimeout(() => {
            if (isMountedRef.current) {
                throw new Error('Test error for error boundary');
            } else {
                console.warn('🔥 ErrorTest: Component not mounted, cannot throw error');
            }
        }, 100); // Increased delay to ensure component is mounted
    };

    const triggerErrorBoundary = () => {
        console.log('🔥 ErrorTest: Manually triggering error boundary');
        if (window.globalErrorHandler && window.globalErrorHandler.errorBoundary) {
            window.globalErrorHandler.errorBoundary.triggerErrorBoundary(new Error('Manual error boundary test'));
        } else {
            console.warn('🔥 ErrorTest: Error boundary not available for manual trigger');
        }
    };

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Error Boundary Test</h2>
            <p>This component can throw an error to test the error boundary.</p>
            <div style={{ marginBottom: '1rem' }}>
                <button
                    onClick={throwError}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        marginRight: '1rem'
                    }}
                >
                    Throw Test Error
                </button>
                <button
                    onClick={triggerErrorBoundary}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Manual Error Boundary
                </button>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                Check console for debug logs
            </div>
        </div>
    );
};

export default ErrorTest;
