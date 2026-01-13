'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function NavBar() {
    const pathname = usePathname();

    return (
        <div className="sub-header">
            <nav className="header-nav">
                <Link href="/hdc" className={`nav-link-modern ${pathname.includes('/hdc') ? 'active hdc-menu' : ''}`}>
                    <Image src="/moph_logo.png" alt="MOPH Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                    <span>43 แฟ้ม HDC</span>
                </Link>
                <Link href="/oppp" className={`nav-link-modern ${pathname.includes('/oppp') ? 'active' : ''}`}>
                    <Image src="/nhso_logo.png" alt="NHSO Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                    <span>43 แฟ้ม OPPP</span>
                </Link>
                <Link href="/admin" className={`nav-link-modern ${pathname.includes('/admin') ? 'active' : ''}`}>
                    <i className="ph-fill ph-shield-check"></i>
                    <span>Admin</span>
                </Link>
            </nav>
        </div>
    );
}
