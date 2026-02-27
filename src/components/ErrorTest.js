import React, { useState } from 'react';

const ErrorTest = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    const throwError = () => {
        console.log('🔥 ErrorTest: About to throw error');
        console.log('🔥 ErrorTest: Error boundary registered?', window.globalErrorHandler?.errorBoundary);

        // Use setTimeout to throw error in next render cycle
        setTimeout(() => {
            setShouldThrow(true);
        }, 0);
    };

    // This will throw during render when shouldThrow is true
    if (shouldThrow) {
        throw new Error('Test error for error boundary');
    }

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Error Boundary Test</h2>
            <p>This component can throw an error to test the error boundary.</p>
            <button
                onClick={throwError}
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
                Throw Test Error
            </button>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                Check console for debug logs
            </div>
        </div>
    );
};

export default ErrorTest;
