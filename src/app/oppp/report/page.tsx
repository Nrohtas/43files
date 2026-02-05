import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import OPPPReport from '@/components/OPPPReport';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: "OPPP 43 Files Report",
    description: "Detailed report of 43 files submission",
};

export default function ReportPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
                <OPPPReport />
            </Suspense>
            <Footer />
        </main>
    );
}
