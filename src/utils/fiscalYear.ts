/**
 * Fiscal Year Helper Utilities
 * ปีงบประมาณไทย เริ่ม 1 ต.ค. - 30 ก.ย.
 */

/**
 * คำนวณปีงบประมาณปัจจุบันตามวันที่ปัจจุบัน (พ.ศ.)
 * ต.ค. - ธ.ค. ถือเป็นปีงบประมาณถัดไป (เช่น ต.ค. 2026 -> ปีงบ 2570)
 * ม.ค. - ก.ย. ถือเป็นปีงบประมาณปัจจุบัน (เช่น ก.ย. 2026 -> ปีงบ 2569, ม.ค. 2027 -> ปีงบ 2570)
 */
export function getCurrentFiscalYear(date: Date = new Date()): string {
    const month = date.getMonth(); // 0-11 (9 = ต.ค.)
    const yearAD = date.getFullYear();
    const fiscalYearAD = month >= 9 ? yearAD + 1 : yearAD;
    return String(fiscalYearAD + 543);
}

/**
 * คำนวณปีงบประมาณและเดือนเริ่มต้นสำหรับ Dashboard รายงาน (อิงเดือนก่อนหน้า)
 */
export function getDefaultReportPeriod(date: Date = new Date()): { defaultYear: string; defaultMonth: string } {
    const prevMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const defaultMonth = (prevMonthDate.getMonth() + 1).toString().padStart(2, '0');
    const defaultYear = (prevMonthDate.getMonth() >= 9)
        ? (prevMonthDate.getFullYear() + 544).toString()
        : (prevMonthDate.getFullYear() + 543).toString();
    return { defaultYear, defaultMonth };
}

/**
 * แยกปีงบประมาณจากชื่อไฟล์ (ถ้ามีระบุปี ค.ศ. และเดือน เช่น YYYYMM)
 * ตัวอย่าง: senddataDateServReport_00051_202610_All.xls -> ค.ศ. 2026 เดือน 10 -> ปีงบ 2570
 */
export function extractFiscalYearFromFilename(filename: string): string | null {
    const match = filename.match(/(\d{4})(\d{2})/);
    if (match) {
        const fileYearAD = parseInt(match[1], 10);
        const fileMonth = parseInt(match[2], 10);
        if (fileMonth >= 1 && fileMonth <= 12 && fileYearAD >= 2020 && fileYearAD <= 2040) {
            const fiscalAD = fileMonth >= 10 ? fileYearAD + 1 : fileYearAD;
            return String(fiscalAD + 543);
        }
    }
    return null;
}
