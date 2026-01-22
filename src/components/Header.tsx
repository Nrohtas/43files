import React from 'react';

export default function Header() {
    return (
        <header className="top-header">
            <div className="header-left">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/assets/images/logo_digital_health.png" alt="Logo"
                        style={{ height: '85px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2' }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            margin: 0,
                            background: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            สำนักงานสาธารณสุขจังหวัดพิษณุโลก
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#6b21a8', // Solid Purple 800
                            }}>
                                กลุ่มงานสุขภาพดิจิทัล
                            </span>
                            <span style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></span>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>
                                การจัดส่งข้อมูล 43 แฟ้ม
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
