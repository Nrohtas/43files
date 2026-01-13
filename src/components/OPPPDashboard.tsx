'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DistrictSummary {
    code: string;
    name: string;
    totalUnits: number;
    submitted: number;
    missing: number;
}

interface MissingUnit {
    code: string;
    name: string;
}

interface DistrictMissingGroup {
    districtCode: string;
    districtName: string;
    units: MissingUnit[];
}

interface Month {
    value: string;
    name: string;
}

export default function OPPPDashboard() {
    const router = useRouter();

    // State
    const [year, setYear] = useState('2568');
    const [month, setMonth] = useState('11');
    const [years, setYears] = useState<string[]>(['2568']);
    const [months, setMonths] = useState<Month[]>([]);

    // Data State
    const [summary, setSummary] = useState<DistrictSummary[]>([]);
    const [allMissingUnits, setAllMissingUnits] = useState<DistrictMissingGroup[]>([]);
    const [filteredMissingUnits, setFilteredMissingUnits] = useState<DistrictMissingGroup[]>([]);
    const [lastUpdate, setLastUpdate] = useState<string>('-');

    // UI State
    const [loading, setLoading] = useState(true);
    const [missingSectionExpanded, setMissingSectionExpanded] = useState(false);
    const [missingSectionTitle, setMissingSectionTitle] = useState('รายชื่อหน่วยบริการที่ไม่ได้ส่งข้อมูล');

    // Init Logic
    useEffect(() => {
        const init = async () => {
            // Calculate default month (previous month)
            const today = new Date();
            const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const defaultMonth = (prevMonthDate.getMonth() + 1).toString();
            setMonth(defaultMonth);

            await fetchYears();
            await fetchMonths();
            // Don't call fetchData here if it's dependent on state that might not be set yet? 
            // Better to rely on the dedicated effect below, but we need to ensure years/months are loaded.
            // Actually, we can just let the next effect handle it.
        };
        init();
    }, []);

    // Fetch data when year/month changes
    useEffect(() => {
        if (month) {
            fetchData(year, month);
        }
    }, [year, month]);

    const fetchYears = async () => {
        try {
            const res = await fetch('/api/years');
            if (res.ok) {
                const data = await res.json();
                setYears(data);
            }
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    };

    const fetchMonths = async () => {
        try {
            const res = await fetch('/api/months');
            if (res.ok) {
                const data = await res.json();
                setMonths(data);
            }
        } catch (error) {
            console.error('Error fetching months:', error);
        }
    };

    const fetchData = async (selectedYear: string, selectedMonth: string) => {
        setLoading(true);
        // Collapse missing section on refresh
        setMissingSectionExpanded(false);
        setMissingSectionTitle('รายชื่อหน่วยบริการที่ไม่ได้ส่งข้อมูล');

        try {
            // Fetch Summary (OPPP endpoint)
            const resSummary = await fetch(`/api/oppp/districts/summary?year=${selectedYear}&month=${selectedMonth}`);
            if (resSummary.ok) {
                const data = await resSummary.json();
                setSummary(data);
            }

            // Fetch Missing Units (OPPP endpoint)
            const resMissing = await fetch(`/api/oppp/missing-units/all?year=${selectedYear}&month=${selectedMonth}`);
            if (resMissing.ok) {
                const data = await resMissing.json();
                setAllMissingUnits(data);
                setFilteredMissingUnits(data); // Default show all
            }

            // Fetch Last Update (OPPP type)
            const resUpdate = await fetch(`/api/last-update?type=oppp&t=${Date.now()}`);
            if (resUpdate.ok) {
                const data = await resUpdate.json();
                if (data.lastUpdate) {
                    formatLastUpdate(data.lastUpdate);
                } else {
                    setLastUpdate('-');
                }
            } else {
                setLastUpdate('-');
            }

        } catch (error) {
            console.error('Error fetching OPPP dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatLastUpdate = (dateStr: string) => {
        try {
            let cleanDateStr = dateStr;
            if (typeof cleanDateStr === 'string' && cleanDateStr.includes(' ') && !cleanDateStr.includes('T')) {
                cleanDateStr = cleanDateStr.replace(' ', 'T');
            }

            const date = new Date(cleanDateStr);
            if (isNaN(date.getTime())) {
                setLastUpdate('Err Date');
                return;
            }

            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const d = date.getDate();
            const m = thaiMonths[date.getMonth()];
            const y = date.getFullYear() + 543;
            const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} น.`;

            setLastUpdate(`${d} ${m} ${y} เวลา ${time}`);
        } catch (e) {
            setLastUpdate('-');
        }
    };

    // Calculate province stats
    const totalUnits = summary.reduce((acc, curr) => acc + curr.totalUnits, 0);
    const totalSubmitted = summary.reduce((acc, curr) => acc + curr.submitted, 0);
    const totalMissing = summary.reduce((acc, curr) => acc + curr.missing, 0);

    // Handlers
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(e.target.value);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMonth(e.target.value);
    };

    const toggleMissingSection = () => {
        setMissingSectionExpanded(!missingSectionExpanded);
    };

    const showMissingForDistrict = (districtCode: string, districtName: string) => {
        const districtData = allMissingUnits.filter(d => d.districtCode === districtCode);
        setFilteredMissingUnits(districtData);
        setMissingSectionTitle(`รายชื่อหน่วยบริการที่รอประมวลผล (${districtName})`);
        setMissingSectionExpanded(true);

        // Scroll to section
        const section = document.getElementById('provinceMissingSection');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const resetMissingFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFilteredMissingUnits(allMissingUnits);
        setMissingSectionTitle('รายชื่อหน่วยบริการที่ไม่ได้ส่งข้อมูล');
    };

    return (
        <div className="dashboard-content">
            <div className="province-summary-card">
                <div className="province-summary-header">
                    <h2>
                        <i className="ph-fill ph-chart-bar"
                            style={{ color: 'var(--primary-blue)', fontSize: '20px', verticalAlign: 'middle', marginRight: '10px' }}></i>
                        Dashboard การจัดส่งข้อมูล 43 แฟ้ม OPPP
                    </h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link href="/oppp/report" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #40C4FF 0%, #2CD3E1 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px rgba(44, 211, 225, 0.2)'
                        }}>
                            <i className="ph-duotone ph-table"></i>
                            Dashboard รายเดือน
                        </Link>
                        <select
                            className="month-selector"
                            value={year}
                            onChange={handleYearChange}
                            style={{ border: '2px solid #40C4FF', color: '#0F172A', textAlign: 'center' }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>ปี {y}</option>
                            ))}
                        </select>
                        <select
                            className="month-selector"
                            value={month}
                            onChange={handleMonthChange}
                            style={{ border: '2px solid #40C4FF', color: '#0F172A', textAlign: 'center' }}
                        >
                            {months.length === 0 ? (
                                <option>ไม่มีข้อมูลเดือน</option>
                            ) : (
                                months.map(m => (
                                    <option key={m.value} value={m.value}>{m.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <div className="province-stats">
                    <div className="province-stat">
                        <div className="province-stat-label">หน่วยบริการทั้งหมด</div>
                        <div className="province-stat-value">{totalUnits}</div>
                    </div>
                    <div className="province-stat">
                        <div className="province-stat-label">ประมวลผลแล้ว</div>
                        <div className="province-stat-value" style={{ color: '#0284C7' }}>{totalSubmitted}</div>
                    </div>
                    <div
                        className="province-stat clickable"
                        style={{ border: missingSectionExpanded ? '1px solid #EF4444' : '1px solid transparent', background: '#FEF2F2' }}
                        onClick={toggleMissingSection}
                    >
                        <div className="province-stat-label">
                            <i className="ph-fill ph-warning-circle" style={{ color: '#EF4444', fontSize: '16px' }}></i>
                            รอประมวลผล
                            <i className="ph-bold ph-magnifying-glass"
                                style={{ color: '#EF4444', fontSize: '14px', marginLeft: '4px' }}></i>
                        </div>
                        <div className="province-stat-value" style={{ color: '#EF4444' }}>{totalMissing}</div>
                    </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <a href="https://op.nhso.go.th/op/main/MainWebAction.do"
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#40C4FF', textDecoration: 'none', transition: 'all 0.2s', padding: '4px 8px', borderRadius: '4px' }}>
                        <i className="ph-bold ph-link-simple" style={{ fontSize: '14px' }}></i>
                        <span style={{ fontWeight: 500 }}>ที่มา: รายงาน OPPP</span>
                        <i className="ph-bold ph-arrow-square-out" style={{ fontSize: '12px' }}></i>
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph ph-clock" style={{ fontSize: '14px' }}></i>
                        <span>อัปเดต: <span>{lastUpdate}</span></span>
                    </div>
                </div>
            </div>

            {/* Expandable Missing Units Section */}
            <div className={`province-missing-section ${missingSectionExpanded ? 'expanded' : ''}`} id="provinceMissingSection">
                <div className="missing-section-card">
                    <div className="missing-section-header-province">
                        <h3>
                            <i className="ph-fill ph-warning-circle"></i>
                            {missingSectionTitle}
                            {filteredMissingUnits.length !== allMissingUnits.length && (
                                <button
                                    onClick={resetMissingFilter}
                                    style={{ fontSize: '12px', marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                                >
                                    แสดงทั้งหมด
                                </button>
                            )}
                        </h3>
                        <button className="collapse-btn-province" onClick={() => setMissingSectionExpanded(false)}>
                            ซ่อน
                        </button>
                    </div>
                    <div className="missing-section-body-province">
                        {filteredMissingUnits.length === 0 ? (
                            <div className="empty-missing-state">
                                <i className="ph-fill ph-check-circle"></i>
                                <h4>ทุกหน่วยบริการส่งข้อมูลครบแล้ว</h4>
                                <p>ไม่มีหน่วยบริการที่รอประมวลผลในเดือนนี้ 🎉</p>
                            </div>
                        ) : (
                            filteredMissingUnits.map(group => (
                                group.units.length > 0 && (
                                    <div key={group.districtCode} className="district-group">
                                        <div className="district-group-header">
                                            <i className="ph-fill ph-map-pin"></i>
                                            <h4>{group.districtName}</h4>
                                            <span className="district-group-count">{group.units.length}</span>
                                        </div>
                                        <div className="district-units-list">
                                            {group.units.map(unit => (
                                                <div key={unit.code} className="missing-unit-item-small">
                                                    <span className="unit-code">{unit.code}</span>
                                                    <span className="unit-name">{unit.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="districts-grid">
                {loading ? (
                    <div className="loading">
                        <p>กำลังโหลดข้อมูล...</p>
                    </div>
                ) : summary.length === 0 ? (
                    <div className="empty-state">
                        <i className="ph ph-folder-notch-open"></i>
                        <p>ไม่พบข้อมูลอำเภอ</p>
                    </div>
                ) : (
                    summary.map(district => (
                        <div
                            key={district.code}
                            className="district-card"
                            onClick={() => showMissingForDistrict(district.code, district.name)}
                        >
                            <div className="district-card-header">
                                <div>
                                    <div className="district-name">{district.name}</div>
                                    <div className="district-code">รหัสอำเภอ: {district.code}</div>
                                </div>
                                <div
                                    className="district-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/oppp/report/?district=${district.code}&year=${year}&month=${month}`);
                                    }}
                                    title="ดูรายละเอียด Dashboard รายเดือน"
                                    style={{ width: 'auto', height: 'auto', padding: '6px 12px', borderRadius: '20px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', background: '#F0F9FF', color: '#0284C7' }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>รายเดือน</span>
                                    <i className="ph-duotone ph-table" style={{ fontSize: '14px' }}></i>
                                </div>
                            </div>

                            <div className="district-stats">
                                <div className="stat-item">
                                    <div className="stat-value total">{district.totalUnits}</div>
                                    <div className="stat-label">หน่วยบริการ</div>
                                </div>
                                <div className="stat-item" style={{ backgroundColor: '#E0F2FE' }}>
                                    <div className="stat-value submitted" style={{ color: '#0284C7' }}>{district.submitted}</div>
                                    <div className="stat-label">ประมวลผลแล้ว</div>
                                </div>
                                <div
                                    className="stat-item"
                                    style={{ background: '#FEF2F2', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onMouseOver={(e) => { if (district.missing > 0) e.currentTarget.style.transform = 'scale(1.05)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <div className="stat-value missing" style={district.missing > 0 ? { color: '#EF4444' } : { color: '#94A3B8' }}>{district.missing}</div>
                                        {district.missing > 0 && (
                                            <i className="ph-bold ph-magnifying-glass" style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '14px', color: '#EF4444' }}></i>
                                        )}
                                    </div>
                                    <div className="stat-label">รอประมวลผล</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
