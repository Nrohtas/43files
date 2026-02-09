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

interface UpdateItem {
    update_id: number;
    update_date: string;
    update_description: string;
}

interface HdcApiStatus {
    history: {
        api_id: number;
        h_count: number;
        h_y: number;
        h_n: number;
        d_update: string;
    }[];
    summary: {
        totalRuns: number;
        totalUnits: number;
        totalProcessed: number;
        totalPending: number;
        lastUpdate: string | null;
    };
    latest: {
        unitCount: number;
        processed: number;
        pending: number;
        updateTime: string | null;
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<{ username: string, role: string } | null>(null);
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // HDC API Status State
    const [hdcApiStatus, setHdcApiStatus] = useState<HdcApiStatus | null>(null);
    const [loadingApiStatus, setLoadingApiStatus] = useState(true);

    // Upload State
    const [uploadingHdc, setUploadingHdc] = useState(false);
    const [uploadingOppp, setUploadingOppp] = useState(false);

    // Refs for file inputs and date picker
    const hdcInputRef = useRef<HTMLInputElement>(null);
    const opppInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // File Selection State
    const [hdcFiles, setHdcFiles] = useState<FileList | null>(null);
    const [opppFiles, setOpppFiles] = useState<FileList | null>(null);

    // Site Updates State
    const [siteUpdates, setSiteUpdates] = useState<UpdateItem[]>([]);
    const [newUpdateDescription, setNewUpdateDescription] = useState('');
    const [newUpdateVersion, setNewUpdateVersion] = useState('');

    // Custom Date Picker State
    const [newUpdateDate, setNewUpdateDate] = useState(''); // Gregorian YYYY-MM-DD for API
    const [displayDate, setDisplayDate] = useState(''); // Buddhist Era dd/mm/yyyy for UI

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

        // Initialize date selectors with today
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');

        setNewUpdateDate(`${y}-${m}-${d}`);
        setDisplayDate(`${d}/${m}/${y + 543}`);

        loadUploadHistory();
        loadHdcApiStatus();
        loadSiteUpdates();
    }, []);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // YYYY-MM-DD
        if (!val) return;
        setNewUpdateDate(val);

        const [y, m, d] = val.split('-');
        setDisplayDate(`${d}/${m}/${parseInt(y) + 543}`);
    };

    const loadSiteUpdates = async () => {
        try {
            const res = await fetch('/api/updates');
            if (res.ok) {
                const data = await res.json();
                setSiteUpdates(data);
            }
        } catch (error) {
            console.error('Error loading updates:', error);
        }
    };

    const handleCreateUpdate = async () => {
        if (!newUpdateDate || !newUpdateDescription) return;
        if (!confirm('ยืนยันการอัปเดตระบบ?')) return;

        try {
            const res = await fetch('/api/updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    update_date: newUpdateDate,
                    update_description: newUpdateDescription,
                    update_version: newUpdateVersion
                })
            });

            console.log('Response status:', res.status, res.statusText);
            const responseText = await res.text();
            console.log('Response body:', responseText);

            if (res.ok) {
                alert('บันทึกการอัปเดตระบบเรียบร้อยแล้ว');
                // Reset
                const today = new Date();
                const y = today.getFullYear();
                const m = (today.getMonth() + 1).toString().padStart(2, '0');
                const d = today.getDate().toString().padStart(2, '0');
                setNewUpdateDate(`${y}-${m}-${d}`);
                setDisplayDate(`${d}/${m}/${y + 543}`);

                setNewUpdateDescription('');
                setNewUpdateVersion('');
                loadSiteUpdates();
            } else {
                let errorMessage = res.statusText;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.details || res.statusText;
                } catch (e) {
                    errorMessage = responseText || res.statusText;
                }
                console.error('Failed to create update:', errorMessage);
                alert(`เกิดข้อผิดพลาดในการบันทึกประวัติการอัปเดตระบบ: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error creating update:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกประวัติการอัปเดตระบบ: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    const handleDeleteUpdate = async (id: number) => {
        if (!confirm('ยืนยันการลบรายการอัปเดตนี้?')) return;
        try {
            const res = await fetch(`/api/updates?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadSiteUpdates();
            } else {
                alert('ลบไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error deleting update:', error);
        }
    };

    const loadHdcApiStatus = async () => {
        setLoadingApiStatus(true);
        try {
            const res = await fetch('/api/hdc-api');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setHdcApiStatus(data.data);
                }
            }
        } catch (error) {
            console.error('Error loading HDC API status:', error);
        } finally {
            setLoadingApiStatus(false);
        }
    };

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
            localStorage.removeItem('authToken');
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
                const token = localStorage.getItem('authToken');
                const res = await fetch(`/api/upload/${type}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
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
            {/* HDC API Status Dashboard */}
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '30px 40px 0 40px'
            }}>
                <h2 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <i className="ph-fill ph-plugs-connected" style={{ color: '#10B981', fontSize: '28px' }}></i>
                    สถานะการเชื่อมต่อ HDC API
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <i className="ph-fill ph-clock" style={{ fontSize: '14px' }}></i>
                        อัปเดต: {hdcApiStatus?.latest.updateTime ? formatDate(hdcApiStatus.latest.updateTime) : '-'}
                    </span>
                </h2>

                {loadingApiStatus ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '60px',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <i className="ph-duotone ph-spinner-gap ph-spin" style={{ fontSize: '40px', color: '#10B981' }}></i>
                        <p style={{ marginTop: '15px', color: '#64748B' }}>กำลังโหลดข้อมูล...</p>
                    </div>
                ) : hdcApiStatus ? (
                    <>
                        {/* Status Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            marginBottom: '25px'
                        }}>
                            {/* Total Runs Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <i className="ph-fill ph-activity" style={{ fontSize: '24px', opacity: 0.9 }}></i>
                                    <span style={{ fontSize: '14px', opacity: 0.9 }}>จำนวนครั้งที่เรียก API</span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700 }}>{hdcApiStatus.summary.totalRuns}</div>
                            </div>

                            {/* Units Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <i className="ph-fill ph-buildings" style={{ fontSize: '24px', opacity: 0.9 }}></i>
                                    <span style={{ fontSize: '14px', opacity: 0.9 }}>หน่วยบริการ (ล่าสุด)</span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700 }}>{hdcApiStatus.latest.unitCount}</div>
                            </div>

                            {/* Processed Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <i className="ph-fill ph-check-circle" style={{ fontSize: '24px', opacity: 0.9 }}></i>
                                    <span style={{ fontSize: '14px', opacity: 0.9 }}>ประมวลผลแล้ว</span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700 }}>{hdcApiStatus.latest.processed}</div>
                            </div>

                            {/* Pending Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <i className="ph-fill ph-hourglass-medium" style={{ fontSize: '24px', opacity: 0.9 }}></i>
                                    <span style={{ fontSize: '14px', opacity: 0.9 }}>รอประมวลผล</span>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700 }}>{hdcApiStatus.latest.pending}</div>
                            </div>
                        </div>

                        {/* API History Table */}
                        {hdcApiStatus.history.length > 0 && (
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                overflow: 'hidden',
                                border: '1px solid #E2E8F0',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #E2E8F0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#F8FAFC'
                                }}>
                                    <i className="ph-fill ph-list-numbers" style={{ color: '#64748B', fontSize: '18px' }}></i>
                                    <span style={{ fontWeight: 600, color: '#1E293B' }}>ประวัติการเรียก API (5 รายการล่าสุด)</span>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                                                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>#</th>
                                                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>วันเวลา</th>
                                                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>
                                                    <i className="ph-fill ph-buildings" style={{ marginRight: '6px' }}></i>หน่วยบริการ
                                                </th>
                                                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>
                                                    <i className="ph-fill ph-check-circle" style={{ marginRight: '6px', color: '#10B981' }}></i>ประมวลผลแล้ว
                                                </th>
                                                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>
                                                    <i className="ph-fill ph-hourglass-medium" style={{ marginRight: '6px', color: '#F59E0B' }}></i>รอประมวลผล
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hdcApiStatus.history.slice(0, 5).map((item, index) => (
                                                <tr key={item.api_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ textAlign: 'center', padding: '12px 16px', color: '#94A3B8', fontSize: '13px' }}>{index + 1}</td>
                                                    <td style={{ padding: '12px 16px', color: '#1E293B', fontSize: '14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <i className="ph-fill ph-calendar-check" style={{ color: '#64748B' }}></i>
                                                            {formatDate(item.d_update)}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                                                        <span style={{
                                                            background: '#EFF6FF',
                                                            color: '#3B82F6',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '14px',
                                                            fontWeight: 600
                                                        }}>{item.h_count}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                                                        <span style={{
                                                            background: '#ECFDF5',
                                                            color: '#10B981',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '14px',
                                                            fontWeight: 600
                                                        }}>{item.h_y}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                                                        <span style={{
                                                            background: item.h_n > 0 ? '#FEF3C7' : '#F1F5F9',
                                                            color: item.h_n > 0 ? '#D97706' : '#94A3B8',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '14px',
                                                            fontWeight: 600
                                                        }}>{item.h_n}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '60px',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <i className="ph-duotone ph-database" style={{ fontSize: '50px', color: '#CBD5E1' }}></i>
                        <p style={{ marginTop: '15px', color: '#64748B', fontSize: '16px' }}>ยังไม่มีข้อมูลการเชื่อมต่อ API</p>
                        <p style={{ color: '#94A3B8', fontSize: '14px' }}>ข้อมูลจะปรากฏเมื่อมีการเรียกใช้ HDC API</p>
                    </div>
                )}
            </div>

            {/* Section Divider */}
            <div style={{
                maxWidth: '1000px',
                margin: '30px auto 0 auto',
                padding: '0 40px'
            }}>
                <h2 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <i className="ph-fill ph-upload-simple" style={{ color: '#3B82F6', fontSize: '28px' }}></i>
                    อัปโหลดข้อมูล 43 แฟ้ม
                </h2>
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
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#DCFCE7', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
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
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#DBEAFE', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
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
                                <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>วันที่ส่ง</th>
                                <th style={{ textAlign: 'left', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ชื่อไฟล์</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ประเภท</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>งวดข้อมูล</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ผู้ส่ง</th>
                                <th style={{ textAlign: 'right', padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>ขนาด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr key="loading">
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                        <i className="ph-duotone ph-spinner-gap ph-spin" style={{ fontSize: '30px', marginBottom: '10px', display: 'block', margin: '0 auto' }}></i>
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr key="empty">
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                        <i className="ph-duotone ph-list-dashes" style={{ fontSize: '30px', marginBottom: '10px', display: 'block', margin: '0 auto' }}></i>
                                        ยังไม่มีประวัติการอัปโหลด
                                    </td>
                                </tr>
                            ) : (
                                history.map((item, index) => {
                                    const isHdc = item.file_type === 'hdc';
                                    const typeColor = isHdc ? '#10B981' : '#3B82F6';
                                    const typeBg = isHdc ? '#ECFDF5' : '#EFF6FF';
                                    const typeLabel = (item.file_type || '').toUpperCase();

                                    return (
                                        <tr key={item.id ? `${item.id}-${index}` : `row-${index}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
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

            {/* System Updates Management */}
            <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', padding: '0 40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="ph-fill ph-newspaper-clipping" style={{ color: '#64748B' }}></i>
                    System Update
                </h2>

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Date (วัน/เดือน/ปี)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={displayDate}
                                    onClick={() => dateInputRef.current?.showPicker()}
                                    placeholder="เลือกวันที่..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        paddingRight: '40px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        cursor: 'pointer',
                                        background: 'white',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                />
                                <i className="ph-bold ph-calendar-blank" style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#64748B',
                                    pointerEvents: 'none',
                                    fontSize: '18px'
                                }}></i>
                                <input
                                    type="date"
                                    ref={dateInputRef}
                                    value={newUpdateDate}
                                    onChange={handleDateChange}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Description</label>
                            <textarea
                                value={newUpdateDescription}
                                onChange={(e) => setNewUpdateDescription(e.target.value)}
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'vertical' }}
                                placeholder="Update description..."
                            />
                        </div>
                        <button
                            onClick={handleCreateUpdate}
                            disabled={!newUpdateDate || !newUpdateDescription}
                            style={{
                                background: '#8E24AA',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: (!newUpdateDate || !newUpdateDescription) ? 'not-allowed' : 'pointer',
                                opacity: (!newUpdateDate || !newUpdateDescription) ? 0.5 : 1,
                                justifySelf: 'start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className="ph-bold ph-plus-circle"></i> บันทึกรายการอัปเดต
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '12px' }}>Update List</h3>
                        {siteUpdates.length === 0 ? (
                            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูล</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {siteUpdates.map((item) => (
                                    <div key={item.update_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#6A1B9A' }}>
                                                {new Date(item.update_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-line' }}>{item.update_description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUpdate(item.update_id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#EF4444',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="ลบ"
                                        >
                                            <i className="ph-bold ph-trash" style={{ fontSize: '18px' }}></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
