'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function NavBar() {
    const pathname = usePathname();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        if (activeDropdown) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('touchend', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchend', handleClickOutside);
        };
    }, [activeDropdown]);

    // Close dropdown when navigating
    useEffect(() => {
        setActiveDropdown(null);
    }, [pathname]);

    const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, dropdownName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDropdown(prev => prev === dropdownName ? null : dropdownName);
    };

    return (
        <div className="sub-header">
            <nav className="header-nav" ref={navRef}>
                {/* HDC Dropdown */}
                <div className="nav-item-dropdown">
                    <button
                        type="button"
                        className={`nav-link-modern ${pathname.includes('/hdc') ? 'active hdc-menu' : ''}`}
                        onClick={(e) => toggleDropdown(e, 'hdc')}
                        aria-expanded={activeDropdown === 'hdc'}
                        aria-haspopup="true"
                        style={{
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation'
                        }}
                    >
                        <Image src="/moph_logo.png" alt="MOPH Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                        <span><span className="mobile-prefix">43 แฟ้ม </span>HDC</span>
                        <i className="ph-bold ph-caret-down" style={{
                            fontSize: '14px',
                            marginLeft: '4px',
                            opacity: 0.7,
                            transition: 'transform 0.2s',
                            transform: activeDropdown === 'hdc' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}></i>
                    </button>
                    <div
                        className={`dropdown-menu ${activeDropdown === 'hdc' ? 'show' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link href="/hdc" className={`dropdown-item hdc-variant ${pathname === '/hdc' ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
                            <i className="ph-duotone ph-chart-line-up"></i>
                            Dashboard HDC
                        </Link>
                        <Link href="/hdc/report" className={`dropdown-item hdc-variant ${pathname === '/hdc/report' ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
                            <i className="ph-duotone ph-table"></i>
                            Dashboard รายเดือน
                        </Link>
                        <Link href="/hdcservice" className={`dropdown-item hdc-variant ${pathname.includes('/hdcservice') ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
                            <i className="ph-duotone ph-briefcase"></i>
                            Dashboard แฟ้ม Service
                        </Link>
                    </div>
                </div>

                {/* OPPP Dropdown */}
                <div className="nav-item-dropdown">
                    <button
                        type="button"
                        className={`nav-link-modern ${pathname.includes('/oppp') ? 'active' : ''}`}
                        onClick={(e) => toggleDropdown(e, 'oppp')}
                        aria-expanded={activeDropdown === 'oppp'}
                        aria-haspopup="true"
                        style={{
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation'
                        }}
                    >
                        <Image src="/nhso_logo.png" alt="NHSO Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                        <span><span className="mobile-prefix">43 แฟ้ม </span>OPPP</span>
                        <i className="ph-bold ph-caret-down" style={{
                            fontSize: '14px',
                            marginLeft: '4px',
                            opacity: 0.7,
                            transition: 'transform 0.2s',
                            transform: activeDropdown === 'oppp' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}></i>
                    </button>
                    <div
                        className={`dropdown-menu ${activeDropdown === 'oppp' ? 'show' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link href="/oppp" className={`dropdown-item ${pathname === '/oppp' ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
                            <i className="ph-duotone ph-user"></i>
                            Dashboard OPPP
                        </Link>
                        <Link href="/oppp/report" className={`dropdown-item ${pathname === '/oppp/report' ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
                            <i className="ph-duotone ph-table"></i>
                            Dashboard รายเดือน
                        </Link>
                        <Link href="/opppservice" className={`dropdown-item ${pathname.includes('/opppservice') ? 'active' : ''}`} onClick={() => setActiveDropdown(null)}>
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

