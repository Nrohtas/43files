'use client';

import React, { useState, useRef } from 'react';
import styles from './fileupload.module.css';

export default function FileUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = selectedFile.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (isValid) {
            setFile(selectedFile);
            setStatus({ type: '', message: '' });
        } else {
            setStatus({ type: 'error', message: 'กรุณาอัพโหลดไฟล์ Excel (.xlsx, .xls) เท่านั้น' });
            setFile(null);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const removeFile = () => {
        setFile(null);
        setStatus({ type: '', message: '' });
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus({ type: 'success', message: 'อัพโหลดไฟล์สำเร็จ!' });
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
            } else {
                setStatus({ type: 'error', message: data.message || 'เกิดข้อผิดพลาดในการอัพโหลด' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>อัพโหลดไฟล์ Excel</h1>
            <p className={styles.subtitle}>กรุณาเลือกไฟล์ .xlsx หรือ .xls เพื่อนำเข้าข้อมูล</p>

            <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
                <input
                    ref={inputRef}
                    type="file"
                    className={styles.fileInput}
                    accept=".xlsx, .xls"
                    onChange={handleChange}
                />

                {!file ? (
                    <div
                        className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
                        onClick={onButtonClick}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <span className={styles.icon}>📁</span>
                        <p className={styles.uploadText}>คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                        <p className={styles.uploadHint}>รองรับเฉพาะไฟล์ Excel เท่านั้น</p>
                    </div>
                ) : (
                    <div className={styles.previewArea}>
                        <span className={styles.fileName}>📄 {file.name}</span>
                        <button type="button" className={styles.removeBtn} onClick={removeFile}>×</button>
                    </div>
                )}

                {status.message && (
                    <div className={`${styles.message} ${styles[status.type]}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={!file || uploading}
                >
                    {uploading ? 'กำลังอัพโหลด...' : 'ยืนยันการอัพโหลด'}
                </button>
            </form>
        </div>
    );
}
