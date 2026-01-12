
// Type definitions for parsed Excel data
interface HdcExcelRow {
    hospcode: string;
    year_th: string | number;
    month_no: string | number;
    [key: string]: any; // Allow other columns but ignore them
}
