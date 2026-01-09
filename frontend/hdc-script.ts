// API base URL
const API_BASE = 'http://localhost:3000/api';

// Type definitions
interface DistrictSummary {
    code: string;
    name: string;
    totalUnits: number;
    submitted: number;
    missing: number;
}

// DOM elements
const districtsContainer = document.getElementById('districtsContainer') as HTMLDivElement;

// Fetch district summary data
async function fetchDistrictSummary(): Promise<DistrictSummary[]> {
    try {
        const response = await fetch(`${API_BASE}/districts/summary`);
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

// Render district cards
function renderDistrictCards(districts: DistrictSummary[]) {
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
        <div class="district-card" onclick="navigateToDistrict('${district.code}')">
            <div class="district-card-header">
                <div>
                    <div class="district-name">${district.name}</div>
                    <div class="district-code">รหัสอำเภอ: ${district.code}</div>
                </div>
                <div class="district-icon">
                    <i class="ph-fill ph-buildings"></i>
                </div>
            </div>
            
            <div class="district-stats">
                <div class="stat-item">
                    <div class="stat-value total">${district.totalUnits}</div>
                    <div class="stat-label">หน่วยบริการ</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value submitted">${district.submitted}</div>
                    <div class="stat-label">ส่งแล้ว</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value missing">${district.missing}</div>
                    <div class="stat-label">ไม่ได้ส่ง</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Navigate to district detail page
function navigateToDistrict(districtCode: string) {
    window.location.href = `district-detail.html?district=${districtCode}`;
}

// Make function globally available
(window as any).navigateToDistrict = navigateToDistrict;

// Initialize dashboard
async function initDashboard() {
    const districts = await fetchDistrictSummary();
    renderDistrictCards(districts);
}

// Load data when page is ready
initDashboard();
