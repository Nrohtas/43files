import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HDCService from '@/components/HDCService';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: "HDC Service 43 Files Report",
    description: "Detailed service report of 43 files submission",
};

export default function HDCServicePage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
                <HDCService />
            </Suspense>
        </main>
    );
}
