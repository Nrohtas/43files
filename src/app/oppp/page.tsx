import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import OPPPDashboard from '@/components/OPPPDashboard';

export const metadata: Metadata = {
    title: "OPPP 43 Files Dashboard",
    description: "Dashboard for OPPP 43 files submission",
};

export default function OPPPDashboardPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <OPPPDashboard />
        </main>
    );
}
