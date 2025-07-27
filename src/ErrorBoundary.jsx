// Lokasi file: src/ErrorBoundary.jsx
// Deskripsi: Diperbarui dengan tombol interaktif untuk memuat ulang dan menyalin error.

import React from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { Button } from './components/ui/button'; // Impor komponen Button

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        if (window.api && typeof window.api.logError === 'function') {
            const errorDetails = {
                message: error.toString(),
                stack: error.stack,
                componentStack: errorInfo.componentStack
            };
            window.api.logError(errorDetails);
        } else {
            console.error("Uncaught error (API not available for logging):", error, errorInfo);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleCopyError = () => {
        const { error, errorInfo } = this.state;
        const errorText = `Error: ${error.toString()}\n\nStack Trace:\n${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`;
        
        // Menggunakan API Clipboard bawaan browser
        navigator.clipboard.writeText(errorText).then(() => {
            alert('Detail error berhasil disalin ke clipboard!');
        }).catch(err => {
            console.error('Gagal menyalin error: ', err);
            alert('Gagal menyalin detail error.');
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen w-full text-center p-4 bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-16 w-16 mb-4" />
                    <h1 className="text-2xl font-bold">Terjadi Kesalahan Fatal</h1>
                    <p className="mt-2 text-base">
                        Aplikasi mengalami error yang tidak terduga.
                    </p>
                    <p className="mt-1 text-sm text-destructive/80">
                        Detail error telah dicatat untuk dianalisis.
                    </p>
                    {/* --- PERBAIKAN: Tombol interaktif untuk pengguna --- */}
                    <div className="mt-6 flex gap-4">
                        <Button variant="destructive" onClick={this.handleReload}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Muat Ulang Aplikasi
                        </Button>
                        <Button variant="outline" onClick={this.handleCopyError}>
                            <Copy className="mr-2 h-4 w-4" /> Salin Detail Error
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
