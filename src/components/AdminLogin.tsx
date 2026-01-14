'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                // Store session
                localStorage.setItem('authToken', data.token); // Store token
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role || 'user');
                localStorage.setItem('username', data.user.username || '');

                router.push('/admin');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#EFF6FF',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto'
                    }}>
                        <i className="ph-fill ph-lock-key" style={{ fontSize: '40px', color: '#3B82F6' }}></i>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                        Admin Login
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>
                        เข้าสู่ระบบจัดการข้อมูล 43 แฟ้ม<br />
                        สสจ.พิษณุโลก
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <i className="ph ph-user" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '18px' }}></i>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 42px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: '#1E293B'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <i className="ph ph-lock" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '18px' }}></i>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 42px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: '#1E293B'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '8px',
                            color: '#EF4444',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="ph-bold ph-warning-circle"></i>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            color: 'white',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>

                    <a href="/" style={{ textAlign: 'center', color: '#64748B', fontSize: '14px', textDecoration: 'none', marginTop: '10px' }}>
                        &larr; กลับไปหน้าหลัก
                    </a>
                </form>
            </div>
        </div>
    );
}
