// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Type Definitions
interface District {
    code: string;
    name: string;
}

interface ApiUnit {
    code: string;
    name: string;
}

interface Unit {
    code: string;
    name: string;
    months: boolean[];
}

interface Hostype {
    code: string;
    name: string;
}

document.addEventListener('DOMContentLoaded', async () => {

    // --- Districts List (will be loaded from API) ---
    let districts: District[] = [];
    let hostypes: Hostype[] = [];
    let selectedHostypeCode: string | null = null;  // null means "ทั้งหมด"
    let currentSelectedDistrict: { code: string, name: string } | null = null;  // Track selected district

    // --- Inject Hostype Dropdown HTML ---
    const injectHostypeDropdown = (): void => {
        const districtDropdownContainer = document.querySelector('.district-dropdown-container');
        if (!districtDropdownContainer || !districtDropdownContainer.parentElement) return;

        const hostypeHTML = `
            <div class="hostype-dropdown-container" style="position: relative;">
                <div class="hostype-dropdown-trigger" id="hostypeDropdownTrigger"
                    style="cursor: pointer; padding: 12px 20px; background: #fff; border-radius: 8px; box-shadow: var(--shadow-card); display: flex; align-items: center; gap: 10px; min-width: 220px; justify-content: space-between;">
                    <span id="selectedHostype" style="font-weight: 600; color: var(--text-heading);">สังกัด: ทั้งหมด</span>
                    <i class="ph ph-caret-down" style="color: var(--text-light);"></i>
                </div>
                <div class="hostype-dropdown-menu" id="hostypeDropdownMenu"
                    style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 8px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 1000; max-height: 400px; overflow-y: auto; display: none;">
                </div>
            </div>
        `;

        // Wrap both dropdowns in a flex container
        const parent = districtDropdownContainer.parentElement;
        if (!parent.style.display) {
            parent.style.display = 'flex';
            parent.style.gap = '12px';
        }

        districtDropdownContainer.insertAdjacentHTML('afterend', hostypeHTML);
    };

    // Inject the dropdown on load
    injectHostypeDropdown();

    // --- DOM Elements ---
    const tableBody = document.getElementById('hdcTableBody') as HTMLTableSectionElement | null;
    const districtTitle = document.getElementById('currentDistrictTitle') as HTMLHeadingElement | null;
    const statTotal = document.getElementById('totalUnits') as HTMLDivElement | null;
    const statSubmitted = document.getElementById('totalSubmitted') as HTMLDivElement | null;
    const statMissing = document.getElementById('totalMissing') as HTMLDivElement | null;

    // --- Function to Load District ---
    const loadDistrict = async (districtCode: string, districtName: string, hostypeCode: string | null = null): Promise<void> => {
        // Update Title with "อำเภอ" prefix
        if (districtTitle) {
            districtTitle.textContent = `อำเภอ${districtName}`;
        }

        try {
            // Fetch from API using district code and optional hostype
            let url = `${API_BASE_URL}/api/hdc/${encodeURIComponent(districtCode)}`;
            if (hostypeCode) {
                url += `?hostype=${encodeURIComponent(hostypeCode)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const units: Unit[] = await response.json();

            // Update Stats
            if (statTotal) statTotal.textContent = units.length.toString();

            // Count submitted for November (index 1)
            const currentMonthIndex = 1;  // พ.ย.
            const submittedCount = units.filter((u) => u.months[currentMonthIndex]).length;
            if (statSubmitted) statSubmitted.textContent = submittedCount.toString();
            if (statMissing) statMissing.textContent = (units.length - submittedCount).toString();

            // Render Table
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (units.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="14" style="text-align:center; padding:40px; color:#94A3B8;">ไม่พบข้อมูลหน่วยบริการในอำเภอนี้</td>`;
                tableBody.appendChild(tr);
                return;
            }

            units.forEach((u) => {
                const tr = document.createElement('tr');

                const renderStatus = (status: boolean, monthIndex: number): string => {
                    // For months 0-1 (Oct-Nov): show checkmark/X based on data
                    // For months 2-11 (Dec-Sep): show dash since no data yet
                    if (monthIndex >= 2) {
                        // December onwards - no data yet, show dash
                        return `<div style="color: #94A3B8; font-size: 20px;">-</div>`;
                    }

                    // October/November - show based on y/n
                    return status
                        ? `<div class="status-icon success"><i class="ph-fill ph-check-circle"></i></div>`
                        : `<div class="status-icon error"><i class="ph-fill ph-x-circle"></i></div>`;
                };

                // Generate TD for each month
                let monthsHtml = '';
                u.months.forEach((status, index) => {
                    monthsHtml += `<td style="text-align:center">${renderStatus(status, index)}</td>`;
                });

                tr.innerHTML = `
                    <td><span style="font-family:monospace; background:#f0f2f5; padding:2px 6px; border-radius:4px;">${u.code}</span></td>
                    <td style="font-weight:500;">${u.name}</td>
                    ${monthsHtml}
                `;
                tableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error loading district data:', error);

            // Show error message in table
            if (tableBody) {
                tableBody.innerHTML = '';
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="14" style="text-align:center; padding:40px; color:#EF4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาตรวจสอบการเชื่อมต่อกับ API</td>`;
                tableBody.appendChild(tr);
            }

            // Reset stats
            if (statTotal) statTotal.textContent = '0';
            if (statSubmitted) statSubmitted.textContent = '0';
            if (statMissing) statMissing.textContent = '0';
        }
    };

    // --- Load Districts from API ---
    const loadDistrictsFromAPI = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/districts`);
            if (!response.ok) {
                throw new Error('Failed to load districts');
            }
            const apiDistricts: District[] = await response.json();
            districts = apiDistricts;

            const dropdownMenu = document.getElementById('districtDropdownMenu');
            if (dropdownMenu) {
                dropdownMenu.innerHTML = '';
                districts.forEach(district => {
                    const option = document.createElement('div');
                    option.className = 'district-option';
                    option.dataset.districtCode = district.code;
                    option.dataset.districtName = district.name;
                    option.style.cssText = 'padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;';
                    option.textContent = `อำเภอ${district.name}`;
                    dropdownMenu.appendChild(option);
                });

                bindDropdownOptions();
            }

            // Keep default text as "เลือกอำเภอ" without loading data automatically
            // User must select a district to view data
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    };

    // --- Load Hostypes from API ---
    const loadHostypesFromAPI = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/hostypes`);
            if (!response.ok) {
                throw new Error('Failed to load hostypes');
            }
            const apiHostypes: Hostype[] = await response.json();
            hostypes = apiHostypes;

            const hostypeDropdownMenu = document.getElementById('hostypeDropdownMenu');
            if (hostypeDropdownMenu) {
                // Add "ทั้งหมด" option first
                let optionsHTML = `
                    <div class="hostype-option selected" data-hostype-code="" style="padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;">
                        ทั้งหมด
                    </div>
                `;

                // Add hostype options
                hostypes.forEach(hostype => {
                    optionsHTML += `
                        <div class="hostype-option" data-hostype-name="${hostype.name}" style="padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;">
                            ${hostype.name}
                        </div>
                    `;
                });

                hostypeDropdownMenu.innerHTML = optionsHTML;
                bindHostypeDropdownOptions();
            }
        } catch (error) {
            console.error('Error loading hostypes:', error);
        }
    };

    // --- Bind Sidebar Events ---
    // Dropdown Logic
    const dropdownTrigger = document.getElementById('districtDropdownTrigger');
    const dropdownMenu = document.getElementById('districtDropdownMenu');
    const selectedDistrictSpan = document.getElementById('selectedDistrict');

    // Toggle Dropdown (Inner)
    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownMenu.style.display === 'none' || !dropdownMenu.style.display) {
                dropdownMenu.style.display = 'block';
            } else {
                dropdownMenu.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target as Node;
            if (!dropdownTrigger.contains(target) && !dropdownMenu.contains(target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    // Handle Option Click
    const bindDropdownOptions = (): void => {
        const options = document.querySelectorAll('.district-option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                const districtCode = (option as HTMLElement).dataset.districtCode;
                const districtName = (option as HTMLElement).dataset.districtName;
                if (!districtCode || !districtName) return;

                // Store selected district
                currentSelectedDistrict = { code: districtCode, name: districtName };

                if (selectedDistrictSpan) {
                    selectedDistrictSpan.textContent = districtName;
                }

                options.forEach((opt) => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (dropdownMenu) {
                    dropdownMenu.style.display = 'none';
                }

                loadDistrict(districtCode, districtName);
            });
        });
    };

    // --- Hostype Dropdown Handlers ---
    const hostypeDropdownTrigger = document.getElementById('hostypeDropdownTrigger');
    const hostypeDropdownMenu = document.getElementById('hostypeDropdownMenu');
    const selectedHostypeSpan = document.getElementById('selectedHostype');

    if (hostypeDropdownTrigger && hostypeDropdownMenu) {
        hostypeDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hostypeDropdownMenu.style.display === 'none' || !hostypeDropdownMenu.style.display) {
                hostypeDropdownMenu.style.display = 'block';
            } else {
                hostypeDropdownMenu.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target as Node;
            if (!hostypeDropdownTrigger.contains(target) && !hostypeDropdownMenu.contains(target)) {
                hostypeDropdownMenu.style.display = 'none';
            }
        });
    }

    const bindHostypeDropdownOptions = (): void => {
        const options = document.querySelectorAll('.hostype-option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                const name = (option as HTMLElement).dataset.hostypeName || null;
                const displayName = (option as HTMLElement).textContent?.trim() || 'ทั้งหมด';

                selectedHostypeCode = name; // Now storing name instead of code

                if (selectedHostypeSpan) {
                    selectedHostypeSpan.textContent = `สังกัด: ${displayName}`;
                }

                options.forEach((opt) => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (hostypeDropdownMenu) {
                    hostypeDropdownMenu.style.display = 'none';
                }

                // Reload district data with hostype filter using the stored district selection
                if (currentSelectedDistrict) {
                    loadDistrict(currentSelectedDistrict.code, currentSelectedDistrict.name, selectedHostypeCode);
                }
            });
        });
    };

    // --- Initial Load ---
    await loadDistrictsFromAPI();
    await loadHostypesFromAPI();

    // Check URL parameter for district code
    const urlParams = new URLSearchParams(window.location.search);
    const districtParam = urlParams.get('district');

    if (districtParam && districts.length > 0) {
        // Find the district by code
        const district = districts.find(d => d.code === districtParam);
        if (district) {
            // Store the initial district from URL
            currentSelectedDistrict = { code: district.code, name: district.name };

            // Update dropdown display
            if (selectedDistrictSpan) {
                selectedDistrictSpan.textContent = district.name;
            }

            // Mark as selected in dropdown
            const options = document.querySelectorAll('.district-option');
            options.forEach((opt) => {
                if ((opt as HTMLElement).dataset.districtCode === district.code) {
                    opt.classList.add('selected');
                }
            });

            // Load the district data
            await loadDistrict(district.code, district.name);
        }
    }

});
