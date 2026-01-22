import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            padding: '24px 0',
            marginTop: 'auto',
            width: '100%',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#fff' // Optional: keep it clean white
        }}>
            <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#64748B',
                fontWeight: 400,
                letterSpacing: '0.01em',
                textAlign: 'center'
            }}>
                <span style={{ opacity: 0.8 }}>Copyright ©2026</span>
                <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                <span style={{ fontWeight: 500, color: '#475569' }}>Digital Health Group of Phitsanulok Provincial Public Health Office</span>
            </p>
        </footer>
    );
};

export default Footer;
