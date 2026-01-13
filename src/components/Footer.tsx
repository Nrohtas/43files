import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            padding: '40px 30px',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: '13px',
            marginTop: 'auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
        }}>
            <div style={{ height: '1px', width: '200px', background: 'linear-gradient(90deg, transparent 0%, #E2E8F0 50%, transparent 100%)', marginBottom: '20px' }}></div>
            <p style={{ fontWeight: 500, letterSpacing: '0.02em' }}>
                Copyright ©2026 Digital Health Group of Phitsanulok Provincial Public Health Office
            </p>
        </footer>
    );
};

export default Footer;
