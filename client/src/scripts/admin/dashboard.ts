
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = '/admin/login.html';
        return;
    }

    console.log('Admin Dashboard Loaded');

    // Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
                localStorage.removeItem('userRole'); // Clear session
                localStorage.removeItem('user');
                window.location.href = '/admin/login.html';
            }
        });
    }


    // Helper function to setup upload logic
    const setupUploadHandler = (
        type: 'hdc' | 'oppp',
        fileInputId: string,
        selectBtnClass: string,
        uploadBtnClass: string,
        fileInfoId: string
    ) => {
        const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
        const selectBtn = document.querySelector(selectBtnClass) as HTMLButtonElement;
        const uploadBtn = document.querySelector(uploadBtnClass) as HTMLButtonElement;
        const fileInfo = document.getElementById(fileInfoId) as HTMLDivElement;
        const cardId = type === 'hdc' ? 'uploadHdcData' : 'uploadOpppData';
        const card = document.getElementById(cardId);

        if (!fileInput || !selectBtn || !uploadBtn || !fileInfo) return;

        // Trigger file input
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        // Also trigger on card click, but exclude buttons
        if (card) {
            card.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target !== selectBtn && target !== uploadBtn && !selectBtn.contains(target) && !uploadBtn.contains(target)) {
                    // fileInput.click(); 
                }
            });
        }

        // Handle File Selection
        fileInput.addEventListener('change', () => {
            const files = fileInput.files;
            if (files && files.length > 0) {
                const count = files.length;
                const text = count === 1 ? files[0].name : `เลือกแล้ว ${count} ไฟล์`;
                fileInfo.textContent = text;
                fileInfo.style.color = '#1e293b';

                // Enable Upload Button
                uploadBtn.disabled = false;
                uploadBtn.style.opacity = '1';
                uploadBtn.style.cursor = 'pointer';
            } else {
                fileInfo.textContent = 'ยังไม่ได้เลือกไฟล์';
                fileInfo.style.color = '#64748b';

                // Disable Upload Button
                uploadBtn.disabled = true;
                uploadBtn.style.opacity = '0.5';
                uploadBtn.style.cursor = 'not-allowed';
            }
        });

        // Handle Confirm Upload
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const files = fileInput.files;
            if (files && files.length > 0) {
                if (type === 'hdc') {
                    // Real Upload Logic for HDC
                    if (!confirm(`ยืนยันการนำเข้าไฟล์ Excel (${files.length} ไฟล์) เข้าสู่ระบบฐานข้อมูล HDC?`)) return;

                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'กำลังอัปโหลด...';

                    // Get username from localStorage
                    const username = localStorage.getItem('username') || '';

                    const uploadPromises = Array.from(files).map(file => {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('username', username);

                        return fetch('http://localhost:3000/api/upload/hdc', {
                            method: 'POST',
                            body: formData
                        }).then(async response => {
                            const text = await response.text();
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                throw new Error(`Server returned error (${response.status}): ${text.substring(0, 100)}...`);
                            }
                        });
                    });

                    Promise.all(uploadPromises)
                        .then(results => {
                            console.log('Upload results:', results);
                            const successCount = results.filter(r => r.success).length;
                            const failCount = results.length - successCount;

                            let msg = `ประมวลผลเสร็จสิ้น: สำเร็จ ${successCount} ไฟล์`;
                            if (failCount > 0) msg += `, ล้มเหลว ${failCount} ไฟล์`;

                            alert(msg);
                            loadUploadHistory(); // Refresh history

                            // Reset UI
                            fileInput.value = '';
                            fileInfo.textContent = 'ยังไม่ได้เลือกไฟล์';
                            fileInfo.style.color = '#64748b';
                            uploadBtn.disabled = true;
                            uploadBtn.style.opacity = '0.5';
                            uploadBtn.style.cursor = 'not-allowed';
                            uploadBtn.innerHTML = '<i class="ph-bold ph-upload-simple" style="margin-right: 8px;"></i>ยืนยันการส่งข้อมูล';
                        })
                        .catch(err => {
                            console.error('Upload error:', err);
                            alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message);
                            uploadBtn.disabled = false;
                            uploadBtn.innerHTML = '<i class="ph-bold ph-upload-simple" style="margin-right: 8px;"></i>ยืนยันการส่งข้อมูล';
                        });

                } else {
                    // Real Upload Logic for OPPP
                    if (!confirm(`ยืนยันการนำเข้าไฟล์ Excel (${files.length} ไฟล์) เข้าสู่ระบบฐานข้อมูล OPPP?`)) return;

                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'กำลังอัปโหลด...';

                    // Get username from localStorage
                    const username = localStorage.getItem('username') || '';

                    const uploadPromises = Array.from(files).map(file => {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('username', username);

                        return fetch('http://localhost:3000/api/upload/oppp', {
                            method: 'POST',
                            body: formData
                        }).then(async response => {
                            const text = await response.text();
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                throw new Error(`Server returned error (${response.status}): ${text.substring(0, 100)}...`);
                            }
                        });
                    });

                    Promise.all(uploadPromises)
                        .then(results => {
                            console.log('Upload results:', results);
                            const successCount = results.filter(r => r.success).length;
                            const failCount = results.length - successCount;

                            let msg = `ประมวลผลเสร็จสิ้น: สำเร็จ ${successCount} ไฟล์`;
                            if (failCount > 0) msg += `, ล้มเหลว ${failCount} ไฟล์`;

                            alert(msg);
                            loadUploadHistory(); // Refresh history

                            // Reset UI
                            fileInput.value = '';
                            fileInfo.textContent = 'ยังไม่ได้เลือกไฟล์';
                            fileInfo.style.color = '#64748b';
                            uploadBtn.disabled = true;
                            uploadBtn.style.opacity = '0.5';
                            uploadBtn.style.cursor = 'not-allowed';
                            uploadBtn.innerHTML = '<i class="ph-bold ph-upload-simple" style="margin-right: 8px;"></i>ยืนยันการส่งข้อมูล';
                        })
                        .catch(err => {
                            console.error('Upload error:', err);
                            alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message);
                            uploadBtn.disabled = false;
                            uploadBtn.innerHTML = '<i class="ph-bold ph-upload-simple" style="margin-right: 8px;"></i>ยืนยันการส่งข้อมูล';
                        });
                }
            }
        });
    };



    // --- Upload History Logic ---
    const loadUploadHistory = async () => {
        const historyBody = document.getElementById('uploadHistoryBody');
        if (!historyBody) return;

        try {
            const response = await fetch('http://localhost:3000/api/uploads/history');
            const history = await response.json();

            if (!Array.isArray(history) || history.length === 0) {
                historyBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="padding: 40px; text-align: center; color: #94a3b8;">
                            <i class="ph-duotone ph-list-dashes" style="font-size: 30px; margin-bottom: 10px; display: block;"></i>
                            ยังไม่มีประวัติการอัปโหลด
                        </td>
                    </tr>
                `;
                return;
            }

            historyBody.innerHTML = history.map((item: any) => {
                // Format Date: 13 ม.ค. 2569 10:30
                const date = new Date(item.file_time);
                const dateStr = date.toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Format Size
                const sizeInMB = (item.file_size / (1024 * 1024)).toFixed(2);
                const sizeStr = `${sizeInMB} MB`;

                // Type Badge Style
                const isHdc = item.file_type === 'hdc';
                const typeColor = isHdc ? '#10B981' : '#3b82f6';
                const typeBg = isHdc ? '#ecfdf5' : '#eff6ff';
                const typeLabel = isHdc ? 'HDC' : 'OPPP';

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                        <td style="padding: 16px; color: #1e293b; font-size: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="ph-duotone ph-clock" style="color: #64748b;"></i>
                                ${dateStr}
                            </div>
                        </td>
                        <td style="padding: 16px; color: #1e293b; font-weight: 500; font-size: 14px;">
                            ${item.file_name}
                        </td>
                        <td style="padding: 16px; text-align: center;">
                            <span style="background: ${typeBg}; color: ${typeColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid ${typeColor}30;">
                                ${typeLabel}
                            </span>
                        </td>
                        <td style="padding: 16px; text-align: center; color: #475569; font-family: monospace; font-size: 14px;">
                            ${item.file_log || '-'}
                        </td>
                        <td style="padding: 16px; text-align: center; color: #475569; font-size: 14px;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <div style="width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; font-weight: 700;">
                                    ${(item.username || '?').charAt(0).toUpperCase()}
                                </div>
                                ${item.username || 'Unknown'}
                            </div>
                        </td>
                        <td style="padding: 16px; text-align: right; color: #64748b; font-size: 13px;">
                            ${sizeStr}
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading history:', error);
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: #ef4444;">
                         <i class="ph-bold ph-warning-circle" style="margin-right: 5px;"></i>
                         เกิดข้อผิดพลาดในการโหลดข้อมูล
                    </td>
                </tr>
            `;
        }
    };

    // Load history on start
    loadUploadHistory();

    setupUploadHandler('hdc', 'hdcFileInput', '.btn-select-file.hdc', '.btn-upload.hdc', 'hdcFileInfo');
    setupUploadHandler('oppp', 'opppFileInput', '.btn-select-file.oppp', '.btn-upload.oppp', 'opppFileInfo');


});
