'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string; // The selected value (code/id)
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    theme?: 'blue' | 'green';
    width?: string;
    className?: string;
}

export default function CustomSelect({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    theme = 'blue',
    width = 'auto',
    className = ''
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Colors based on theme
    const themeColors = {
        blue: {
            border: '#40C4FF',
            hoverBg: '#F0F9FF',
            hoverText: '#0284C7', // Darker blue for text
            selectedBg: '#E0F2FE',
            selectedText: '#0284C7'
        },
        green: {
            border: '#10B981',
            hoverBg: '#F0FDF4',
            hoverText: '#059669', // Darker green for text
            selectedBg: '#DCFCE7',
            selectedText: '#059669'
        }
    };

    const currentTheme = themeColors[theme];

    // Find label for current value
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`custom-select-container ${className}`}
            style={{
                position: 'relative',
                width: width,
                minWidth: '120px'
            }}
        >
            {/* The Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', // Centered text as requested in previous design
                    gap: '8px',
                    padding: '10px 16px',
                    background: '#fff',
                    border: `2px solid ${currentTheme.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0F172A',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? `0 0 0 3px ${currentTheme.border}40` : '0 2px 4px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap'
                }}
            >
                <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                }}>{displayLabel}</span>
                <i className={`ph-bold ph-caret-down`} style={{
                    fontSize: '12px',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    opacity: 0.6
                }}></i>
            </div>

            {/* The Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    minWidth: 'max-content', // Allow expanding if content is wide
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 1000,
                    padding: '4px'
                }}>
                    {options.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                            No options
                        </div>
                    ) : (
                        options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = currentTheme.hoverBg;
                                        e.currentTarget.style.color = currentTheme.hoverText;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isSelected ? currentTheme.selectedBg : 'transparent';
                                        e.currentTarget.style.color = isSelected ? currentTheme.selectedText : '#334155';
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        borderRadius: '6px',
                                        color: isSelected ? currentTheme.selectedText : '#334155',
                                        background: isSelected ? currentTheme.selectedBg : 'transparent',
                                        fontWeight: isSelected ? 600 : 400,
                                        transition: 'colors 0.1s',
                                        textAlign: 'left'
                                    }}
                                >
                                    {option.label}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
