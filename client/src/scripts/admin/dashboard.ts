
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
                    // fileInput.click(); // Optional: Disable card click triggers file input to avoid confusion? 
                    // Let's keep card click explicitly for selection if they click empty space, 
                    // but maybe it is better to force button usage for clarity now.
                    // User request said "Add button to select file", so maybe reliance on card click is less needed.
                    // keeping it disabled for now to be precise.
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
                const typeName = type.toUpperCase();

                if (type === 'hdc') {
                    // Real Upload Logic for HDC
                    if (!confirm(`ยืนยันการนำเข้าไฟล์ Excel (${files.length} ไฟล์) เข้าสู่ระบบฐานข้อมูล HDC?`)) return;

                    // Upload one by one or batch? The backend handles one file at a time currently (upload.single).
                    // We should loop through files if multiple are selected, or restricted to single file.
                    // Implementation: Upload first file only for now as dashboard typically handles one report file.
                    // Or loop. Let's loop.

                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'กำลังอัปโหลด...';

                    const uploadPromises = Array.from(files).map(file => {
                        const formData = new FormData();
                        formData.append('file', file);

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
                    // Simulate Upload for OPPP (not requested yet)
                    const confirmMsg = `ยืนยันการส่งข้อมูล ${typeName} จำนวน ${files.length} ไฟล์?`;
                    if (confirm(confirmMsg)) {
                        alert('ระบบได้รับข้อมูลเรียบร้อยแล้ว\n(จำลองการส่งข้อมูล)');
                        // Reset
                        fileInput.value = '';
                        fileInfo.textContent = 'ยังไม่ได้เลือกไฟล์';
                        fileInfo.style.color = '#64748b';
                        uploadBtn.disabled = true;
                        uploadBtn.style.opacity = '0.5';
                        uploadBtn.style.cursor = 'not-allowed';
                    }
                }
            }
        });
    };

    setupUploadHandler('hdc', 'hdcFileInput', '.btn-select-file.hdc', '.btn-upload.hdc', 'hdcFileInfo');
    setupUploadHandler('oppp', 'opppFileInput', '.btn-select-file.oppp', '.btn-upload.oppp', 'opppFileInfo');
});
