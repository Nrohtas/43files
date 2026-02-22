'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import CustomSelect from './CustomSelect';
import Footer from './Footer';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/apiClient';
import * as XLSX from 'xlsx';


// Types
interface District {
    code: string;
    name: string;
}

interface Unit {
    code: string;
    name: string;
    hostype?: string;
    months: {
        pass: number | null;
        reject: number | null;
        total: number | null;
        status: string;
    }[];
}

interface Hostype {
    code: string;
    name: string;
}

export default function OPPPReport() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL Params
    const paramYear = searchParams.get('year');
    const paramMonth = searchParams.get('month') || '11';
    const paramDistrict = searchParams.get('district');
    const paramHostype = searchParams.get('hostype');

    // State
    const [years, setYears] = useState<string[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [hostypes, setHostypes] = useState<Hostype[]>([]);

    // Selection State
    const [selectedYear, setSelectedYear] = useState<string>('2569'); // Default 2569 for OPPP
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedHostype, setSelectedHostype] = useState<string | null>(null);

    // Data State
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState('-');

    // UI State
    const [missingExpanded, setMissingExpanded] = useState(false);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
    const [hostypeDropdownOpen, setHostypeDropdownOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            // 1. Load Years
            try {
                const res = await fetch('/api/years/report'); // Use report-specific filtered years
                if (res.ok) {
                    const data = await res.json();
                    setYears(data);
                }
            } catch (e) { console.error(e); }

            // 2. Load Districts
            try {
                const res = await fetch('/api/districts');
                if (res.ok) {
                    const data = await res.json();
                    setDistricts(data);
                }
            } catch (e) { console.error(e); }

            // 3. Load Hostypes
            try {
                const res = await fetch('/api/hostypes');
                if (res.ok) {
                    const data = await res.json();
                    setHostypes(data);
                }
            } catch (e) { console.error(e); }

            // 4. Last Update
            fetchLastUpdate();

            // Set initial selection from URL or Defaults
            if (paramYear) setSelectedYear(paramYear);
            if (paramDistrict) setSelectedDistrict(paramDistrict);
            if (paramHostype) setSelectedHostype(paramHostype);
        };
        init();
    }, []);

    const fetchLastUpdate = async () => {
        try {
            const res = await authenticatedFetch(`/api/last-update?type=oppp&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.lastUpdate) {
                    // Parse date
                    let dateStr = data.lastUpdate;
                    if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
                        dateStr = dateStr.replace(' ', 'T');
                    }
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                        setLastUpdate(`${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543} เวลา ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} น.`);
                        return;
                    }
                }
            }
            setLastUpdate('-');
        } catch (e) {
            setLastUpdate('-');
        }
    };

    // React to params or state changes to fetch unit data
    useEffect(() => {
        if (selectedDistrict && selectedYear) {
            fetchUnits(selectedDistrict, selectedYear, selectedHostype);
        }
    }, [selectedDistrict, selectedYear, selectedHostype]);

    // Update URL when selection changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedYear) params.set('year', selectedYear);
        if (selectedDistrict) params.set('district', selectedDistrict);
        if (selectedHostype) params.set('hostype', selectedHostype);
        params.set('month', paramMonth); // preserve month param

        router.replace(`/oppp/report?${params.toString()}`); // Use replace to avoid history stack buildup
    }, [selectedYear, selectedDistrict, selectedHostype]);

    const handleYearChange = (val: string) => setSelectedYear(val);
    const handleDistrictChange = (val: string | null) => setSelectedDistrict(val);
    const handleHostypeChange = (val: string | null) => setSelectedHostype(val);

    const handleExportExcel = () => {
        if (units.length === 0) {
            alert('ไม่มีข้อมูลสำหรับส่งออก');
            return;
        }

        const prevYearSuffix = (parseInt(selectedYear) - 1).toString().slice(-2);
        const currYearSuffix = selectedYear.slice(-2);
        const headerRow = [
            'รหัส', 'หน่วยบริการ',
            `ต.ค. ${prevYearSuffix}`, `พ.ย. ${prevYearSuffix}`, `ธ.ค. ${prevYearSuffix}`,
            `ม.ค. ${currYearSuffix}`, `ก.พ. ${currYearSuffix}`, `มี.ค. ${currYearSuffix}`,
            `เม.ย. ${currYearSuffix}`, `พ.ค. ${currYearSuffix}`, `มิ.ย. ${currYearSuffix}`,
            `ก.ค. ${currYearSuffix}`, `ส.ค. ${currYearSuffix}`, `ก.ย. ${currYearSuffix}`
        ];

        // Prepare Data Rows
        const dataRows = units.map(unit => {
            const row: (string | number | null)[] = [unit.code, unit.name];
            // Flatten months array to status only
            unit.months.forEach(m => {
                row.push(m.status || '-');
            });
            return row;
        });

        // Combine all to AOA
        const aoa = [headerRow, ...dataRows];

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Set column widths
        ws['!cols'] = [
            { wch: 10 }, // รหัส
            { wch: 35 }, // หน่วยบริการ
            ...new Array(12).fill({ wch: 15 }) // Month columns
        ];

        // Create Workbook and Save
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "OPPP Report");

        // Generate Filename
        const districtName = districts.find(d => d.code === selectedDistrict)?.name || selectedDistrict;
        const filename = `OPPP_Report_${districtName}_${selectedYear}.xlsx`;

        XLSX.writeFile(wb, filename);
    };


    const fetchUnits = async (districtCode: string, year: string, hostype: string | null) => {
        setLoading(true);
        try {
            let url = `/api/oppp/${encodeURIComponent(districtCode)}?year=${year}`;
            if (hostype) {
                url += `&hostype=${encodeURIComponent(hostype)}`;
            }

            const res = await authenticatedFetch(url);
            if (res.ok) {
                const data = await res.json();
                setUnits(data);
            } else {
                setUnits([]);
            }
        } catch (e) {
            console.error(e);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    // Logic for counting stats (client-side only to avoid hydration mismatch)
    const [stats, setStats] = useState<{ total: number; submitted: number; missing: number; missingList: Unit[] }>({ total: 0, submitted: 0, missing: 0, missingList: [] });

    useEffect(() => {
        if (!units.length) {
            setStats({ total: 0, submitted: 0, missing: 0, missingList: [] });
            return;
        }

        const today = new Date();
        const realFiscalYear = (today.getMonth() >= 9) ? today.getFullYear() + 544 : today.getFullYear() + 543;
        const realFiscalMonthIndex = (today.getMonth() + 3) % 12; // 0=Oct, 11=Sep

        const selectedYearInt = parseInt(selectedYear);
        let cutoffIndex = 0;

        if (selectedYearInt < realFiscalYear) {
            cutoffIndex = 12;
        } else if (selectedYearInt > realFiscalYear) {
            cutoffIndex = 0;
        } else {
            cutoffIndex = realFiscalMonthIndex + 1; // Include current month
        }

        const completeUnits = units.filter(u => {
            for (let i = 0; i < cutoffIndex; i++) {
                if (u.months[i]?.status?.toUpperCase() !== 'Y') return false;
            }
            return true;
        });

        const incompleteUnits = units.filter(u => !completeUnits.includes(u));

        setStats({
            total: units.length,
            submitted: completeUnits.length,
            missing: incompleteUnits.length,
            missingList: incompleteUnits
        });
    }, [units, selectedYear]);

    // Helpers
    const getDistrictName = (code: string | null) => {
        if (!code) return 'เลือกอำเภอ';
        const d = districts.find(d => d.code === code);
        return d ? `อำเภอ${d.name}` : 'เลือกอำเภอ';
    };

    const getHostypeName = (code: string | null) => {
        if (!code) return 'ทั้งหมด';
        return code || 'ทั้งหมด';
    };

    return (
        <div className="hdc-content">
            {/* Title & Filters */}
            {/* Title & Filters */}
            <div className="report-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <h2 className="report-title" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                    <Image
                        src="/nhso_logo.png"
                        alt="NHSO Logo"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain', marginRight: '10px' }}
                    />
                    Dashboard การจัดส่งข้อมูล 43 แฟ้ม OPPP รายเดือน
                </h2>

                <div className="report-filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 'auto', gap: '20px' }}>
                    <div className="filter-group">
                        {/* Link to Service Dashboard */}
                        <Link
                            href="/opppservice"
                            className="nav-link-item-btn"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #40C4FF 0%, #2CD3E1 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(64, 196, 255, 0.3)',
                                marginRight: '10px'
                            }}
                            onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(64, 196, 255, 0.4)';
                            }}
                            onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(64, 196, 255, 0.3)';
                            }}
                        >
                            <i className="ph-duotone ph-briefcase" style={{ fontSize: '18px', color: 'white' }}></i>
                            แฟ้ม Service
                        </Link>

                        {/* Year Dropdown */}
                        <CustomSelect
                            value={selectedYear}
                            options={years.map(y => ({ value: y, label: `ปีงบประมาณ ${y}` }))}
                            onChange={handleYearChange}
                            theme="blue"
                        />

                        {/* District Dropdown */}
                        <CustomSelect
                            value={selectedDistrict || ''}
                            options={[
                                { value: '', label: 'เลือกอำเภอ' },
                                ...districts.map(d => ({ value: d.code, label: `อำเภอ${d.name}` }))
                            ]}
                            onChange={(val) => handleDistrictChange(val || null)}
                            theme="blue"
                        />

                        {/* Hostype Dropdown */}
                        <CustomSelect
                            value={selectedHostype || ''}
                            options={[
                                { value: '', label: 'สังกัด: ทั้งหมด' },
                                ...hostypes.map(h => ({ value: h.name, label: h.name }))
                            ]}
                            onChange={(val) => handleHostypeChange(val || null)}
                            theme="blue"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="info-card report-card">
                    <div className="card-header">
                        <h4>
                            <i className="ph-fill ph-hospital" style={{ color: '#0284C7', fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}></i>
                            หน่วยบริการ (แห่ง)
                        </h4>
                    </div>
                    <div className="card-value">{stats.total}</div>
                </div>
                <div className="info-card report-card">
                    <div className="card-header">
                        <h4>
                            <i className="ph-fill ph-check-circle" style={{ color: '#0284C7', fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}></i>
                            ส่งครบทุกเดือน (แห่ง)
                        </h4>
                    </div>
                    <div className="card-value" style={{ color: '#0284C7' }}>{stats.submitted}</div>
                </div>
                <div
                    className="info-card report-card"
                    id="missingCard"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s' }}
                    onClick={() => setMissingExpanded(!missingExpanded)}
                >
                    <div className="card-header">
                        <h4>
                            <i className="ph-fill ph-warning-circle" style={{ color: '#EF4444', fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}></i>
                            ส่งไม่ครบทุกเดือน (แห่ง)
                            <i className="ph-bold ph-magnifying-glass" style={{ marginLeft: '8px', fontSize: '16px', color: '#EF4444' }}></i>
                        </h4>
                    </div>
                    <div className="card-value" style={{ color: '#EF4444' }}>{stats.missing}</div>
                </div>
            </div>

            {/* Missing Section */}
            <div className={`missing-section ${missingExpanded ? 'expanded' : ''}`}>
                <div className="missing-section-card" id="opppReportMissingCard">
                    <div className="missing-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, padding: 0 }}>
                            <i className="ph-fill ph-warning-circle" style={{ fontSize: '20px', marginRight: '10px' }}></i>
                            รายชื่อหน่วยบริการส่งไม่ครบทุกเดือน
                        </h3>
                        <button
                            onClick={() => setMissingExpanded(false)}
                            style={{
                                border: '1px solid #E2E8F0',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: '#fff',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 600,
                                marginLeft: '10px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#CBD5E1';
                                e.currentTarget.style.color = '#1E293B';
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.color = '#475569';
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <i className="ph-bold ph-minus" style={{ fontSize: '12px' }}></i>
                            ซ่อน
                        </button>
                    </div>
                    <div className="missing-section-body">
                        {stats.missingList.length === 0 ? (
                            <div className="empty-state">
                                <i className="ph-fill ph-check-circle" style={{ color: '#0284C7' }}></i>
                                <h4>ทุกหน่วยบริการส่งข้อมูลครบแล้ว</h4>
                                <p>ไม่มีหน่วยบริการที่รอประมวลผลในเดือนนี้ 🎉</p>
                            </div>
                        ) : (
                            stats.missingList.map(unit => (
                                <div key={unit.code} className="missing-unit-item">
                                    <div className="missing-unit-icon">
                                        <i className="ph-fill ph-warning-circle"></i>
                                    </div>
                                    <div className="missing-unit-info">
                                        <div className="missing-unit-code">{unit.code}</div>
                                        <div className="missing-unit-name" title={unit.name}>{unit.name}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="table-card">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ margin: 0 }}>{getDistrictName(selectedDistrict)} {selectedHostype ? `(สังกัด: ${selectedHostype})` : ''}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                        <a href="https://op.nhso.go.th/op/main/MainWebAction.do"
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#40C4FF', textDecoration: 'none', transition: 'all 0.2s', padding: '4px 8px', borderRadius: '4px' }}>
                            <i className="ph-bold ph-link-simple" style={{ fontSize: '14px' }}></i>
                            <span style={{ fontWeight: 500 }}>ที่มา: รายงาน OPPP</span>
                            <i className="ph-bold ph-arrow-square-out" style={{ fontSize: '12px' }}></i>
                        </a>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284C7', fontWeight: 600 }}>
                                <i className="ph-fill ph-calendar-check" style={{ fontSize: '14px' }}></i>
                                <span>ประมวลผลวันที่รับบริการ (แฟ้ม Service)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="ph ph-clock" style={{ fontSize: '14px' }}></i>
                                <span>อัปเดต: <span id="lastUpdateTime">{lastUpdate}</span></span>
                            </div>
                        </div>
                        {/* Export Button */}
                        <button
                            onClick={handleExportExcel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '10px',
                                color: '#166534',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#dcfce7';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#f0fdf4';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                            }}
                        >
                            <i className="ph-duotone ph-file-xls" style={{ fontSize: '18px' }}></i>
                            Export Excel
                        </button>
                    </div>
                </div>
                <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <table className="hdc-table">
                        <thead>
                            {(() => {
                                const prevYearSuffix = (parseInt(selectedYear) - 1).toString().slice(-2);
                                const currYearSuffix = selectedYear.slice(-2);
                                const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 30, background: '#fff', textAlign: 'center', verticalAlign: 'middle', padding: '12px 8px', fontWeight: 700, color: '#334155' };

                                return (
                                    <tr>
                                        <th className="sticky-col-code" style={{ top: 0, zIndex: 50, background: '#fff', verticalAlign: 'middle' }}>รหัส</th>
                                        <th className="sticky-col-name" style={{ top: 0, zIndex: 50, background: '#fff', verticalAlign: 'middle' }}>หน่วยบริการ</th>
                                        <th className="text-center" style={headerStyle}>ต.ค. {prevYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>พ.ย. {prevYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ธ.ค. {prevYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ม.ค. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ก.พ. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>มี.ค. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>เม.ย. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>พ.ค. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>มิ.ย. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ก.ค. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ส.ค. {currYearSuffix}</th>
                                        <th className="text-center" style={headerStyle}>ก.ย. {currYearSuffix}</th>
                                    </tr>
                                );
                            })()}
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : units.length === 0 ? (
                                <tr>
                                    <td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                        {selectedDistrict ? 'ไม่พบข้อมูลหน่วยบริการในอำเภอนี้' : 'กรุณาเลือกอำเภอเพื่อดูข้อมูล'}
                                    </td>
                                </tr>
                            ) : (
                                units.map(unit => {
                                    // Style logic
                                    const hostypeStr = unit.hostype ? String(unit.hostype).trim() : '';
                                    const targetGreen = ['05', '07', '08', '11', '18', '5', '7', '8'];
                                    const targetPurple = ['21'];

                                    let cellStyle: React.CSSProperties = { fontWeight: 500 };
                                    let codeStyle: React.CSSProperties = { fontFamily: 'monospace', background: '#f0f2f5', padding: '2px 6px', borderRadius: '4px' };

                                    let stickyBg = '#fff'; // Default background for sticky cols
                                    if (targetGreen.includes(hostypeStr)) {
                                        cellStyle = { fontWeight: 600, color: '#059669' };
                                        codeStyle = { ...codeStyle, color: '#059669', fontWeight: 600 };
                                        stickyBg = '#fff'; // or '#f0fdf4' if you want row highlight
                                    } else if (targetPurple.includes(hostypeStr)) {
                                        cellStyle = { fontWeight: 600, color: '#7C3AED' };
                                        codeStyle = { ...codeStyle, color: '#7C3AED', fontWeight: 600 };
                                        stickyBg = '#fff';
                                    }

                                    return (
                                        <tr key={unit.code}>
                                            <td className="sticky-col-code" style={{ zIndex: 40, background: stickyBg }}><span style={codeStyle}>{unit.code}</span></td>
                                            <td className="sticky-col-name" style={{ ...cellStyle, zIndex: 40, background: stickyBg }}>
                                                <div className="name-cell-wrapper">{unit.name}</div>
                                            </td>
                                            {unit.months.map((monthData, idx) => {
                                                // Calculate cutoff logic
                                                const today = new Date();
                                                const currentFiscalYear = (today.getMonth() >= 9) ? today.getFullYear() + 544 : today.getFullYear() + 543;
                                                const currentFiscalMonthIndex = (today.getMonth() + 3) % 12; // 0=Oct, 11=Sep

                                                const selectedYearInt = parseInt(selectedYear);
                                                let isFuture = false;

                                                if (selectedYearInt > currentFiscalYear) {
                                                    isFuture = true;
                                                } else if (selectedYearInt === currentFiscalYear) {
                                                    // If idx is Current Month or later, it's future/pending
                                                    // User said "Current Month - 1" is the last to show.
                                                    // So if idx >= currentFiscalMonthIndex, it is hidden.
                                                    if (idx > currentFiscalMonthIndex) { // Hide months AFTER current month
                                                        isFuture = true;
                                                    }
                                                }
                                                // If selectedYear < currentFiscalYear, isFuture is false (show all)

                                                if (isFuture) {
                                                    return (
                                                        <td key={idx} className="text-center">
                                                            <div style={{ color: '#94A3B8', fontSize: '20px', textAlign: 'center' }}>-</div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={idx} className="text-center">
                                                        {!monthData.status ? (
                                                            <div style={{ color: '#94A3B8', fontSize: '20px', textAlign: 'center' }}>-</div>
                                                        ) : monthData.status.toUpperCase() === 'Y' ? (
                                                            <div className="status-icon success" style={{ color: '#0284C7', background: '#E0F2FE' }}><i className="ph-fill ph-check-circle"></i></div>
                                                        ) : (
                                                            <div className="status-icon error"><i className="ph-fill ph-x-circle"></i></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
