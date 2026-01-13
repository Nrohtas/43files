'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface UploadHistoryItem {
    id: number;
    file_name: string;
    file_type: 'hdc' | 'oppp';
    file_size: number;
    file_time: string;
    file_log?: string;
    username?: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<{ username: string, role: string } | null>(null);
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Upload State
    const [uploadingHdc, setUploadingHdc] = useState(false);
    const [uploadingOppp, setUploadingOppp] = useState(false);

    // Refs for file inputs
    const hdcInputRef = useRef<HTMLInputElement>(null);
    const opppInputRef = useRef<HTMLInputElement>(null);

    // File Selection State
    const [hdcFiles, setHdcFiles] = useState<FileList | null>(null);
    const [opppFiles, setOpppFiles] = useState<FileList | null>(null);

    // Init Logic
    useEffect(() => {
        // Check Auth using localStorage (matching legacy logic)
        const role = localStorage.getItem('userRole');
        const username = localStorage.getItem('username');
        if (!role) {
            router.push('/admin/login');
            return;
        }
        setUser({ username: username || 'Admin', role: role });

        loadUploadHistory();
    }, []);

    const loadUploadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/uploads/history'); // Use existing API via proxy
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            } else {
                console.error('Failed to load history');
                setHistory([]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleLogout = () => {
        if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
            localStorage.removeItem('userRole');
            localStorage.removeItem('user');
            localStorage.removeItem('username');
            router.push('/admin/login');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hdc' | 'oppp') => {
        if (e.target.files && e.target.files.length > 0) {
            if (type === 'hdc') setHdcFiles(e.target.files);
            else setOpppFiles(e.target.files);
        } else {
            if (type === 'hdc') setHdcFiles(null);
            else setOpppFiles(null);
        }
    };

    const handleUpload = async (type: 'hdc' | 'oppp') => {
        const files = type === 'hdc' ? hdcFiles : opppFiles;
        if (!files || files.length === 0) return;

        const label = type === 'hdc' ? 'HDC' : 'OPPP';
        if (!confirm(`ยืนยันการนำเข้าไฟล์ Excel (${files.length} ไฟล์) เข้าสู่ระบบฐานข้อมูล ${label}?`)) return;

        if (type === 'hdc') setUploadingHdc(true);
        else setUploadingOppp(true);

        const username = localStorage.getItem('username') || 'Unknown';

        // Process sequentially or parallel? Legacy used Promise.all
        const promises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', username);

            try {
                const res = await fetch(`/api/upload/${type}`, {
                    method: 'POST',
                    body: formData
                });
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return { success: false, error: `Server Error: ${text.substring(0, 50)}` };
                }
            } catch (e) {
                return { success: false, error: 'Network Error' };
            }
        });

        try {
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            let msg = `ประมวลผลเสร็จสิ้น: สำเร็จ ${successCount} ไฟล์`;
            if (failCount > 0) {
                msg += `, ล้มเหลว ${failCount} ไฟล์\n\nรายละเอียดข้อผิดพลาด:\n`;
                const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');
                msg += errors.join('\n');
            }
            alert(msg);

            // Reset
            if (type === 'hdc') {
                setHdcFiles(null);
                if (hdcInputRef.current) hdcInputRef.current.value = '';
            } else {
                setOpppFiles(null);
                if (opppInputRef.current) opppInputRef.current.value = '';
            }

            loadUploadHistory();

        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดร้ายแรงในการอัปโหลด');
        } finally {
            if (type === 'hdc') setUploadingHdc(false);
            else setUploadingOppp(false);
        }
    };

    // Helper to format file size
    const formatSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Helper to format date
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!user) return null; // Or loading spinner

    return (
        <div className="main-content">
            {/* Header */}
            <div style={{ padding: '30px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="ph-fill ph-cloud-arrow-up" style={{ color: '#64748B' }}></i>
                    เลือกรายการอัปโหลดข้อมูล
                </h1>
                <p style={{ color: '#64748B', marginTop: '5px', marginLeft: '34px' }}>
                    กรุณาเลือกประเภทข้อมูลที่ต้องการนำเข้าระบบ
                </p>
            </div>

            <div className="upload-options-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                padding: '40px',
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                {/* HDC Card */}
                <div className="upload-card hdc district-card" style={{
                    textAlign: 'center',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    border: '2px solid transparent', // Overridden by hover
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <Image src="/assets/images/moph_logo.png" alt="MOPH" width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>43 แฟ้ม HDC</h3>
                    <p style={{ color: '#64748B' }}>อัปโหลดไฟล์ข้อมูล 43 แฟ้ม HDC<br />สำหรับประมวลผล HDC Dashboard</p>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="file"
                            ref={hdcInputRef}
                            style={{ display: 'none' }}
                            accept=".xls,.xlsx"
                            multiple
                            onChange={(e) => handleFileChange(e, 'hdc')}
                        />
                        <button
                            onClick={() => hdcInputRef.current?.click()}
                            style={{
                                background: 'white',
                                color: '#10B981',
                                border: '2px solid #10B981',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className="ph-bold ph-folder-open"></i> เลือกไฟล์
                        </button>
                        <div style={{ fontSize: '13px', color: '#64748B', height: '20px' }}>
                            {hdcFiles ? `เลือกแล้ว ${hdcFiles.length} ไฟล์` : 'ยังไม่ได้เลือกไฟล์'}
                        </div>
                        <button
                            disabled={!hdcFiles || uploadingHdc}
                            onClick={() => handleUpload('hdc')}
                            style={{
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                padding: '12px 30px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: (!hdcFiles || uploadingHdc) ? 'not-allowed' : 'pointer',
                                opacity: (!hdcFiles || uploadingHdc) ? 0.5 : 1,
                                marginTop: '5px',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {uploadingHdc ? (
                                <span>กำลังอัปโหลด...</span>
                            ) : (
                                <>
                                    <i className="ph-bold ph-upload-simple"></i> ยืนยันการส่งข้อมูล
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* OPPP Card */}
                <div className="upload-card oppp district-card" style={{
                    textAlign: 'center',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <Image src="/assets/images/nhso_logo.png" alt="NHSO" width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>43 แฟ้ม OPPP</h3>
                    <p style={{ color: '#64748B' }}>อัปโหลดไฟล์ข้อมูล 43 แฟ้ม OPPP<br />สำหรับประมวลผล OPPP Dashboard</p>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="file"
                            ref={opppInputRef}
                            style={{ display: 'none' }}
                            accept=".xls,.xlsx"
                            multiple
                            onChange={(e) => handleFileChange(e, 'oppp')}
                        />
                        <button
                            onClick={() => opppInputRef.current?.click()}
                            style={{
                                background: 'white',
                                color: '#3B82F6',
                                border: '2px solid #3B82F6',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className="ph-bold ph-folder-open"></i> เลือกไฟล์
                        </button>
                        <div style={{ fontSize: '13px', color: '#64748B', height: '20px' }}>
                            {opppFiles ? `เลือกแล้ว ${opppFiles.length} ไฟล์` : 'ยังไม่ได้เลือกไฟล์'}
                        </div>
                        <button
                            disabled={!opppFiles || uploadingOppp}
                            onClick={() => handleUpload('oppp')}
                            style={{
                                background: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                padding: '12px 30px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: (!opppFiles || uploadingOppp) ? 'not-allowed' : 'pointer',
                                opacity: (!opppFiles || uploadingOppp) ? 0.5 : 1,
                                marginTop: '5px',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {uploadingOppp ? (
                                <span>กำลังอัปโหลด...</span>
                            ) : (
                                <>
                                    <i className="ph-bold ph-upload-simple"></i> ยืนยันการส่งข้อมูล
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', padding: '0 40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="ph-fill ph-clock-counter-clockwise" style={{ color: '#64748B' }}></i>
                    ประวัติการอัปโหลดล่าสุด
                </h2>

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>เวลาที่ส่ง</th>
                                <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ชื่อไฟล์</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ประเภท</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>งวดข้อมูล</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ผู้ส่ง</th>
                                <th style={{ textAlign: 'right', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ขนาด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                        <i className="ph-duotone ph-spinner-gap ph-spin" style={{ fontSize: '30px', marginBottom: '10px', display: 'block', margin: '0 auto' }}></i>
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                        <i className="ph-duotone ph-list-dashes" style={{ fontSize: '30px', marginBottom: '10px', display: 'block', margin: '0 auto' }}></i>
                                        ยังไม่มีประวัติการอัปโหลด
                                    </td>
                                </tr>
                            ) : (
                                history.map(item => {
                                    const isHdc = item.file_type === 'hdc';
                                    const typeColor = isHdc ? '#10B981' : '#3B82F6';
                                    const typeBg = isHdc ? '#ECFDF5' : '#EFF6FF';
                                    const typeLabel = (item.file_type || '').toUpperCase();

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '16px', color: '#1E293B', fontSize: '14px' }}>{formatDate(item.file_time)}</td>
                                            <td style={{ padding: '16px', color: '#1E293B', fontWeight: 500, fontSize: '14px' }}>{item.file_name}</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{ background: typeBg, color: typeColor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: `1px solid ${typeColor}30` }}>
                                                    {typeLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#475569', fontFamily: 'monospace', fontSize: '14px' }}>{item.file_log || '-'}</td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <div style={{ width: '24px', height: '24px', background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748B', fontWeight: 700 }}>
                                                        {(item.username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    {item.username || 'Unknown'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#64748B', fontSize: '13px' }}>{formatSize(item.file_size)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Logout button in header/somewhere? */}
            {/* The original design had logout in header. My NavBar is separating that? */}
            {/* The Header component I reused doesn't have logout. */}
            {/* I should probably add logout functionality to the NavBar or Header if user is logged in. */}
            {/* But for now, I can add a logout floating button or modify existing Header? */}
            {/* Or I can rely on a custom header for Admin page as originally designed? */}

            {/* Let's see. The original design used a DIFFERENT Header for Admin page (lines 146-171 in index.html) */}
            {/* It showed "Administrator" and "Logout". */}
            {/* My reused `Header.tsx` is generic. */}
            {/* I should probably NOT use `Header` component for Admin page if it differs, OR pass props. */}
            {/* For simplicity, I will stick to the standard Header/NavBar for consistency, but maybe add Logout button to Admin Page? */}

            <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        background: '#FEE2E2',
                        color: '#EF4444',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '30px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                    }}
                >
                    <i className="ph-bold ph-sign-out"></i> ออกจากระบบ
                </button>
            </div>
        </div>
    );
}
