'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function NavBar() {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside - delayed to prevent race condition
    useEffect(() => {
        if (!isDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        // Delay adding listener to prevent immediate close
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('touchend', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchend', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Close dropdown when navigating
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [pathname]);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(prev => !prev);
    };

    return (
        <div className="sub-header">
            <nav className="header-nav">
                <Link href="/hdc" className={`nav-link-modern ${pathname.includes('/hdc') ? 'active hdc-menu' : ''}`}>
                    <Image src="/moph_logo.png" alt="MOPH Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                    <span><span className="mobile-prefix">43 แฟ้ม </span>HDC</span>
                </Link>
                <div className="nav-item-dropdown" ref={dropdownRef}>
                    <button
                        type="button"
                        className={`nav-link-modern ${pathname.includes('/oppp') ? 'active' : ''}`}
                        onClick={handleButtonClick}
                        aria-expanded={isDropdownOpen}
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
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}></i>
                    </button>
                    <div
                        className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link href="/oppp" className={`dropdown-item ${pathname === '/oppp' ? 'active' : ''}`} onClick={() => setIsDropdownOpen(false)}>
                            <i className="ph-duotone ph-user"></i>
                            Dashboard OPPP
                        </Link>
                        <Link href="/oppp/report" className={`dropdown-item ${pathname === '/oppp/report' ? 'active' : ''}`} onClick={() => setIsDropdownOpen(false)}>
                            <i className="ph-duotone ph-table"></i>
                            Dashboard รายเดือน
                        </Link>
                        <Link href="/opppservice" className={`dropdown-item ${pathname.includes('/opppservice') ? 'active' : ''}`} onClick={() => setIsDropdownOpen(false)}>
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
