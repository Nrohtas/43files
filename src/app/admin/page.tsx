import type { Metadata } from "next";
import AdminDashboard from '@/components/AdminDashboard';
import NavBar from '@/components/NavBar';
import Header from '@/components/Header';

export const metadata: Metadata = {
    title: "Admin Dashboard - 43 Files",
    description: "Upload and manage HDC/OPPP files",
};

export default function AdminPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <AdminDashboard />
        </main>
    );
}
