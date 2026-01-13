import React from 'react';

export default function Header() {
    return (
        <header className="top-header">
            <div className="header-left">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/assets/images/logo_digital_health.png" alt="Logo"
                        style={{ height: '85px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                            สำนักงานสาธารณสุขจังหวัดพิษณุโลก
                        </h2>
                        <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>
                            กลุ่มงานสุขภาพดิจิทัล การจัดส่งข้อมูล 43 แฟ้ม
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
