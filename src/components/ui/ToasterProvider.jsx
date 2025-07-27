import React from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * Provides a global container for toast notifications.
 * This component should be placed at the root of the application.
 */
const ToasterProvider = () => {
    return (
        <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
                // Define default options
                className: '',
                duration: 5000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
                // Default options for specific types
                success: {
                    duration: 3000,
                    theme: {
                        primary: 'green',
                        secondary: 'black',
                    },
                },
                error: {
                    duration: 5000,
                }
            }}
        />
    );
};

export default ToasterProvider;
