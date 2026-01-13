import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HDCReport from '@/components/HDCReport';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: "HDC 43 Files Report",
    description: "Detailed report of 43 files submission",
};

export default function ReportPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
                <HDCReport />
            </Suspense>
        </main>
    );
}
