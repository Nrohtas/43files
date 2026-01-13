import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HDCDashboard from '@/components/HDCDashboard';

export default function HDCPage() {
    return (
        <main className="main-content">
            <Header />
            <NavBar />
            <HDCDashboard />
        </main>
    );
}
