import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import OPPPServiceReport from '@/components/OPPPServiceReport';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: "OPPP Service Report Dashboard",
    description: "Detailed report for OPPP Service 43 files submission by month",
};

export default function OPPPServiceReportPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <OPPPServiceReport />
            <Footer />
        </main>
    );
}
