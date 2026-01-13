import type { Metadata } from "next";
import AdminLogin from '@/components/AdminLogin';

export const metadata: Metadata = {
    title: "Admin Login - 43 Files",
    description: "Login to Admin Dashboard",
};

export default function LoginPage() {
    return <AdminLogin />;
}
