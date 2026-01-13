// API base URL
// API base URL
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api';
console.log('🟢 OPPP Script Loaded - Version with BLUE styling');

// State
const today = new Date();
const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const fiscalYear = 2568; // Default fixed to 2568 per request
// const fiscalYear = (prevMonthDate.getMonth() >= 9) ? prevMonthDate.getFullYear() + 544 : prevMonthDate.getFullYear() + 543;

let currentYear = fiscalYear.toString();
let currentMonth = (prevMonthDate.getMonth() + 1).toString();

// Type definitions
interface DistrictSummary {
    code: string;
    name: string;
    totalUnits: number;
    submitted: number;
    missing: number;
}

interface MissingUnit {
    code: string;
    name: string;
}

interface DistrictMissingGroup {
    districtCode: string;
    districtName: string;
    units: MissingUnit[];
}

interface Month {
    value: string;
    name: string;
    nameEng: string;
}

// DOM elements
const districtsContainer = document.getElementById('districtsContainer') as HTMLDivElement;
const provinceTotalUnitsEl = document.getElementById('provinceTotalUnits');
const provinceSubmittedEl = document.getElementById('provinceSubmitted');
const provinceMissingEl = document.getElementById('provinceMissing');
const provinceMissingCard = document.getElementById('provinceMissingCard');
const provinceMissingSection = document.getElementById('provinceMissingSection');
const provinceMissingSectionBody = document.getElementById('provinceMissingSectionBody');
const collapseProvinceBtn = document.getElementById('collapseProvinceBtn');
const yearSelector = document.getElementById('yearSelector') as HTMLSelectElement;
const monthSelector = document.getElementById('monthSelector') as HTMLSelectElement;

// Fetch available years
async function fetchYears(): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE}/years`);
        if (!response.ok) throw new Error('Failed to fetch years');
        return await response.json();
    } catch (error) {
        console.error('Error fetching years:', error);
        return ['2569']; // Fallback
    }
}

// Fetch available months
async function fetchMonths(): Promise<Month[]> {
    try {
        const response = await fetch(`${API_BASE}/months`);
        if (!response.ok) throw new Error('Failed to fetch months');
        return await response.json();
    } catch (error) {
        console.error('Error fetching months:', error);
        return [];
    }
}

// Fetch district summary data (OPPP)
async function fetchDistrictSummary(year: string, month: string): Promise<DistrictSummary[]> {
    try {
        const response = await fetch(`${API_BASE}/oppp/districts/summary?year=${year}&month=${month}`);
        if (!response.ok) {
            throw new Error('Failed to fetch district summary');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching district summary:', error);
        return [];
    }
}

// Fetch all missing units (province-wide) (OPPP)
async function fetchAllMissingUnits(year: string, month: string): Promise<DistrictMissingGroup[]> {
    try {
        const response = await fetch(`${API_BASE}/oppp/missing-units/all?year=${year}&month=${month}`);
        if (!response.ok) {
            throw new Error('Failed to fetch missing units');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching missing units:', error);
        return [];
    }
}

// Populate year selector
async function populateYearSelector() {
    const years = await fetchYears();

    yearSelector.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `ปี ${year}`;
        if (year === currentYear) option.selected = true;
        yearSelector.appendChild(option);
    });
}

// Populate month selector
async function populateMonthSelector() {
    const months = await fetchMonths();

    monthSelector.innerHTML = '';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        if (month.value === currentMonth) option.selected = true;
        monthSelector.appendChild(option);
    });
}

// Global variables to store data
let allMissingUnits: DistrictMissingGroup[] = [];

// ... existing code ...

// Render district cards
function renderDistrictCards(districts: DistrictSummary[]) {
    console.log('🔵 OPPP: renderDistrictCards called with', districts.length, 'districts');
    console.log('🔵 OPPP: Applying BLUE styling to submitted stats');

    if (districts.length === 0) {
        districtsContainer.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-folder-notch-open"></i>
                <p>ไม่พบข้อมูลอำเภอ</p>
            </div>
        `;
        return;
    }

    districtsContainer.innerHTML = districts.map(district => `
        <div class="district-card" onclick="showMissingForDistrict('${district.code}', '${district.name}')">
            <div class="district-card-header">
                <div>
                    <div class="district-name">${district.name}</div>
                    <div class="district-code">รหัสอำเภอ: ${district.code}</div>
                </div>
                <div class="district-icon" onclick="navigateToDistrict('${district.code}'); event.stopPropagation();" title="ดูรายละเอียด Dashboard รายเดือน" 
                    style="width: auto; height: auto; padding: 6px 12px; border-radius: 20px; display: flex; gap: 6px; align-items: center; cursor: pointer; transition: transform 0.2s;">
                    <span style="font-size: 12px; font-weight: 600;">รายเดือน</span>
                    <i class="ph-duotone ph-table" style="font-size: 14px;"></i>
                </div>
            </div>
            
            <div class="district-stats">
                <div class="stat-item">
                    <div class="stat-value total">${district.totalUnits}</div>
                    <div class="stat-label">หน่วยบริการ</div>
                </div>
                <div class="stat-item" style="background-color: #E0F2FE !important;">
                    <div class="stat-value submitted" style="color: #0284C7 !important;">${district.submitted}</div>
                    <div class="stat-label">ประมวลผลแล้ว</div>
                </div>
                <div class="stat-item" style="background: #FEF2F2; cursor: pointer; transition: transform 0.2s;" onmouseover="if(this.querySelector('.missing').textContent !== '0') this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';">
                    <div style="position: relative;">
                        <div class="stat-value missing" style="${district.missing > 0 ? 'color: #EF4444;' : 'color: #94A3B8;'}">${district.missing}</div>
                        ${district.missing > 0 ? '<i class="ph-bold ph-magnifying-glass" style="position: absolute; top: -4px; right: -4px; font-size: 14px; color: #EF4444;"></i>' : ''}
                    </div>
                    <div class="stat-label">รอประมวลผล</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Update province summary stats
function updateProvinceSummary(districts: DistrictSummary[]) {
    const totalUnits = districts.reduce((sum, d) => sum + d.totalUnits, 0);
    const submitted = districts.reduce((sum, d) => sum + d.submitted, 0);
    const missing = districts.reduce((sum, d) => sum + d.missing, 0);

    if (provinceTotalUnitsEl) provinceTotalUnitsEl.textContent = totalUnits.toString();
    if (provinceSubmittedEl) provinceSubmittedEl.textContent = submitted.toString();
    if (provinceMissingEl) provinceMissingEl.textContent = missing.toString();
}

// Render province-wide missing units grouped by district
function renderProvinceMissingUnits(districtGroups: DistrictMissingGroup[]) {
    if (!provinceMissingSectionBody) return;

    // Filter out districts with no missing units
    const groupsWithMissing = districtGroups.filter(g => g.units.length > 0);

    if (groupsWithMissing.length === 0) {
        provinceMissingSectionBody.innerHTML = `
            <div class="empty-missing-state">
                <i class="ph-fill ph-check-circle"></i>
                <h4>ทุกหน่วยบริการส่งข้อมูลครบแล้ว</h4>
                <p>ไม่มีหน่วยบริการที่รอประมวลผลในเดือนนี้ 🎉</p>
            </div>
        `;
        return;
    }

    let html = '';
    groupsWithMissing.forEach(group => {
        html += `
            <div class="district-group">
                <div class="district-group-header">
                    <i class="ph-fill ph-map-pin"></i>
                    <h4>${group.districtName}</h4>
                    <span class="district-group-count">${group.units.length}</span>
                </div>
                <div class="district-units-list">
                    ${group.units.map(unit => `
                        <div class="missing-unit-item-small">
                            <span class="unit-code">${unit.code}</span>
                            <span class="unit-name">${unit.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    provinceMissingSectionBody.innerHTML = html;
}

// Expand province missing section
function expandProvinceSection() {
    if (provinceMissingSection) {
        provinceMissingSection.classList.add('expanded');
    }
}

// Collapse province missing section
function collapseProvinceSection() {
    if (provinceMissingSection) {
        provinceMissingSection.classList.remove('expanded');
    }
}

// Toggle province missing section
function toggleProvinceSection() {
    if (provinceMissingSection?.classList.contains('expanded')) {
        collapseProvinceSection();
    } else {
        expandProvinceSection();
    }
}

// Navigate to district detail page (OPPP Report)
function navigateToDistrict(districtCode: string) {
    window.location.href = `/oppp/report/?district=${districtCode}&year=${currentYear}&month=${currentMonth}`;
}

// Make function globally available
(window as any).navigateToDistrict = navigateToDistrict;

// Show missing units for specific district
function showMissingForDistrict(districtCode: string, districtName: string) {
    if (!provinceMissingSectionBody) return;

    // Filter only selected district
    const districtMissing = allMissingUnits.filter(d => d.districtCode === districtCode);

    // Update header title
    const headerTitle = document.querySelector('.missing-section-header-province h3');
    if (headerTitle) {
        headerTitle.innerHTML = `
            <i class="ph-fill ph-warning-circle"></i>
            รายชื่อหน่วยบริการที่รอประมวลผล (${districtName})
            <button onclick="resetMissingFilter(); event.stopPropagation();" style="font-size: 12px; margin-left: 10px; padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
                แสดงทั้งหมด
            </button>
        `;
    }

    renderProvinceMissingUnits(districtMissing);
    expandProvinceSection();

    // Scroll to section
    if (provinceMissingSection) {
        provinceMissingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Reset filter to show all
function resetMissingFilter() {
    renderProvinceMissingUnits(allMissingUnits);

    // Reset header
    const headerTitle = document.querySelector('.missing-section-header-province h3');
    if (headerTitle) {
        headerTitle.innerHTML = `
            <i class="ph-fill ph-warning-circle"></i>
            รายชื่อหน่วยบริการที่รอประมวลผล
        `;
    }
}
(window as any).resetMissingFilter = resetMissingFilter;
(window as any).showMissingForDistrict = showMissingForDistrict;

// Event listeners for province missing section
if (provinceMissingCard) {
    provinceMissingCard.addEventListener('click', toggleProvinceSection);
}

if (collapseProvinceBtn) {
    collapseProvinceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapseProvinceSection();
    });
}

// Event listener for year selector
if (yearSelector) {
    yearSelector.addEventListener('change', async (e) => {
        currentYear = (e.target as HTMLSelectElement).value;

        // Collapse the missing section when changing year/month
        collapseProvinceSection();

        // Reload all data for the new year/month
        await initDashboard();
    });
}

// Event listener for month selector
if (monthSelector) {
    monthSelector.addEventListener('change', async (e) => {
        currentMonth = (e.target as HTMLSelectElement).value;

        // Collapse the missing section when changing month
        collapseProvinceSection();

        // Reload all data for the new month
        await initDashboard();
    });
}

// Main init function
async function initDashboard() {
    // Fetch and display district summary
    const districts = await fetchDistrictSummary(currentYear, currentMonth);
    renderDistrictCards(districts);
    updateProvinceSummary(districts);

    // Fetch and prepare missing units data
    allMissingUnits = await fetchAllMissingUnits(currentYear, currentMonth);
    renderProvinceMissingUnits(allMissingUnits);

    // Update last update time
    updateLastUpdateTime();
}

// Update last update time display
// Update last update time display
async function updateLastUpdateTime() {
    try {
        console.log('DEBUG OPPP Dashboard: Fetching last update time');
        const response = await fetch(`${API_BASE}/last-update?type=oppp&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch last update time');

        const data = await response.json();
        console.log('DEBUG OPPP Dashboard: Received data:', data);

        // If no data, show placeholder
        if (!data.lastUpdate) {
            const lastUpdateEl = document.getElementById('lastUpdateTime');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = '-';
            }
            return;
        }

        // Helper to parse date string robustly
        let dateStr = data.lastUpdate;
        if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
            dateStr = dateStr.replace(' ', 'T');
        }

        const lastUpdate = new Date(dateStr);

        // Check if date is valid
        if (isNaN(lastUpdate.getTime())) {
            console.error('Invalid date parsed from:', data.lastUpdate);
            const lastUpdateEl = document.getElementById('lastUpdateTime');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = '-';
            }
            return;
        }

        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const day = lastUpdate.getDate();
        const month = thaiMonths[lastUpdate.getMonth()];
        const year = lastUpdate.getFullYear() + 543;

        const hours = lastUpdate.getHours().toString().padStart(2, '0');
        const minutes = lastUpdate.getMinutes().toString().padStart(2, '0');
        const timeString = `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;

        const lastUpdateEl = document.getElementById('lastUpdateTime');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = timeString;
        }
    } catch (error) {
        console.error('Error fetching last update time:', error);
        const lastUpdateEl = document.getElementById('lastUpdateTime');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = '-';
        }
    }
}

// Load data when page is ready
(async () => {
    await populateYearSelector();
    await populateMonthSelector();
    await initDashboard();
})();
