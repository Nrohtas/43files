import type { Metadata } from "next";
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import OPPPService from '@/components/OPPPService';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: "OPPP Service Dashboard",
    description: "Dashboard for OPPP Service 43 files submission",
};

export default function OPPPServicePage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <OPPPService />
            <Footer />
        </main>
    );
}
