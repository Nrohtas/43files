import type { Metadata } from "next";
import { Suspense } from "react";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import OPPPService from '@/components/OPPPService';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: "OPPP Service Dashboard",
    description: "Dashboard for OPPP Service 43 files submission",
};

function OPPPServiceLoading() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#64748B' }}>
            <i className="ph-duotone ph-spinner-gap ph-spin" style={{ fontSize: '40px', marginRight: '12px' }}></i>
            กำลังโหลด...
        </div>
    );
}

export default function OPPPServicePage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <Suspense fallback={<OPPPServiceLoading />}>
                <OPPPService />
            </Suspense>
            <Footer />
        </main>
    );
}
