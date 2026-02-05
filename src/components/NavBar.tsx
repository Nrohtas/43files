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
                <div className="nav-item-dropdown">
                    <div className={`nav-link-modern ${pathname.includes('/oppp') ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                        <Image src="/nhso_logo.png" alt="NHSO Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                        <span>43 แฟ้ม OPPP</span>
                        <i className="ph-bold ph-caret-down" style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.7 }}></i>
                    </div>
                    <div className="dropdown-menu">
                        <Link href="/oppp" className={`dropdown-item ${pathname === '/oppp' ? 'active' : ''}`}>
                            <i className="ph-duotone ph-user"></i>
                            Dashboard OPPP
                        </Link>
                        <Link href="/oppp/report" className={`dropdown-item ${pathname === '/oppp/report' ? 'active' : ''}`}>
                            <i className="ph-duotone ph-table"></i>
                            Dashboard รายเดือน
                        </Link>
                        <Link href="/opppservice" className={`dropdown-item ${pathname.includes('/opppservice') ? 'active' : ''}`}>
                            <i className="ph-duotone ph-briefcase"></i>
                            Dashboard แฟ้ม Service
                        </Link>
                    </div>
                </div>
                <Link href="/admin" className={`nav-link-modern ${pathname.includes('/admin') ? 'active' : ''}`}>
                    <i className="ph-fill ph-shield-check"></i>
                    <span>Admin</span>
                </Link>

            </nav>
        </div>
    );
}
