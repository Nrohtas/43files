'use client';

import React, { useState, useEffect } from 'react';

interface UpdateItem {
    update_id: number;
    update_date: string;
    update_description: string;
    update_version?: string;
    update_created: string;
}

const Footer = () => {
    const [showModal, setShowModal] = useState(false);
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [latestVersion, setLatestVersion] = useState('V20260206');

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/updates');
            if (res.ok) {
                const data = await res.json();
                setUpdates(data);
                // Get latest version from first item (sorted by date desc)
                if (data.length > 0 && data[0].update_version) {
                    setLatestVersion(data[0].update_version);
                }
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch latest version on mount
    useEffect(() => {
        const fetchLatestVersion = async () => {
            try {
                const res = await fetch('/api/updates');
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0 && data[0].update_version) {
                        setLatestVersion(data[0].update_version);
                    }
                }
            } catch (error) {
                console.error('Error fetching version:', error);
            }
        };
        fetchLatestVersion();
    }, []);

    const handleOpenModal = () => {
        setShowModal(true);
        fetchUpdates();
    };

    const formatDateThai = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 543;
        return `${day}/${month}/${year}`;
    };

    return (
        <>
            <footer style={{
                padding: '24px 0',
                marginTop: 'auto',
                width: '100%',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#fff'
            }}>
                <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#64748B',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    textAlign: 'center'
                }}>
                    <span style={{ opacity: 0.8 }}>Copyright © 2026</span>
                    <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                    <span style={{ fontWeight: 500, color: '#475569' }}>Digital Health Group of Phitsanulok Provincial Public Health Office</span>
                    <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                    <button
                        onClick={handleOpenModal}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#8E24AA',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: 0,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#6A1B9A'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#8E24AA'}
                    >
                        {latestVersion}
                    </button>
                </p>
            </footer>

            {/* Changelog Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #8E24AA 0%, #6A1B9A 100%)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="ph-duotone ph-rocket-launch" style={{ fontSize: '24px', color: 'white' }}></i>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
                                        System Update
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px'
                                }}
                            >
                                <i className="ph-bold ph-x"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{
                            padding: '24px',
                            maxHeight: 'calc(80vh - 100px)',
                            overflowY: 'auto'
                        }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <i className="ph-duotone ph-spinner-gap ph-spin" style={{ fontSize: '40px', color: '#8E24AA' }}></i>
                                    <p style={{ marginTop: '12px', color: '#64748B' }}>กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : updates.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <i className="ph-duotone ph-note-blank" style={{ fontSize: '50px', color: '#CBD5E1' }}></i>
                                    <p style={{ marginTop: '12px', color: '#94A3B8' }}>ยังไม่มีรายการอัปเดต</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {updates.map((update) => (
                                        <div
                                            key={update.update_id}
                                            style={{
                                                position: 'relative',
                                                paddingLeft: '24px',
                                                borderLeft: '2px solid #E2E8F0'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                left: '-8px',
                                                top: '4px',
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                background: '#8E24AA',
                                                border: '2px solid white',
                                                boxShadow: '0 0 0 2px #E2E8F0'
                                            }}></div>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#8E24AA',
                                                marginBottom: '4px'
                                            }}>
                                                {formatDateThai(update.update_date)}
                                                {update.update_version && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        opacity: 0.7,
                                                        fontSize: '12px'
                                                    }}>
                                                        ({update.update_version})
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: '14px',
                                                color: '#334155',
                                                lineHeight: 1.6,
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {update.update_description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Footer;
