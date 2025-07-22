"use client";

import ClientAuthProvider from '@/components/ClientAuthProvider';
import Navigation from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClientAuthProvider>
            <Navigation />
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    success: {
                        style: {
                            background: '#10b981', // Green
                        },
                    },
                    error: {
                        style: {
                            background: '#ef4444', // Red
                        },
                    },
                }}
            />
        </ClientAuthProvider>
    );
}
