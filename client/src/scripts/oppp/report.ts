// API Configuration
export const API_BASE_URL = 'http://localhost:3000';

// Type Definitions
interface District {
    code: string;
    name: string;
}



interface Unit {
    code: string;
    name: string;
    hostype?: string;
    months: (string | null)[];
}

interface Hostype {
    code: string;
    name: string;
}

interface MissingUnit {
    code: string;
    name: string;
}



document.addEventListener('DOMContentLoaded', async () => {

    // --- Get year and month from URL parameters ---
    // --- Get year and month from URL parameters ---
    const urlParams = new URLSearchParams(window.location.search);

    // Calculate default fiscal year (Previous Month Logic)
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const defaultFiscalYear = (prevMonthDate.getMonth() >= 9) ? prevMonthDate.getFullYear() + 544 : prevMonthDate.getFullYear() + 543;

    const currentYear = urlParams.get('year') || defaultFiscalYear.toString();
    const currentMonth = urlParams.get('month') || '11';

    // --- State Variables ---
    let districts: District[] = [];
    let hostypes: Hostype[] = [];
    let selectedHostypeCode: string | null = null;
    let currentSelectedDistrict: { code: string, name: string } | null = null;
    let missingUnits: MissingUnit[] = [];

    // --- DOM Elements ---
    const tableBody = document.getElementById('hdcTableBody') as HTMLTableSectionElement | null;
    const districtTitle = document.getElementById('currentDistrictTitle') as HTMLHeadingElement | null;
    const statTotal = document.getElementById('totalUnits') as HTMLDivElement | null;
    const statSubmitted = document.getElementById('totalSubmitted') as HTMLDivElement | null;
    const statMissing = document.getElementById('totalMissing') as HTMLDivElement | null;

    // Custom dropdown elements
    const yearDropdownTrigger = document.getElementById('yearDropdownTrigger');
    const yearDropdownMenu = document.getElementById('yearDropdownMenu');
    const selectedYearSpan = document.getElementById('selectedYear');

    const dropdownTrigger = document.getElementById('districtDropdownTrigger');
    const dropdownMenu = document.getElementById('districtDropdownMenu');
    const selectedDistrictSpan = document.getElementById('selectedDistrict');

    // --- Inject Hostype Dropdown HTML ---
    const injectHostypeDropdown = (): void => {
        const districtDropdownContainer = document.querySelector('.district-dropdown-container');
        if (!districtDropdownContainer || !districtDropdownContainer.parentElement) return;

        const hostypeHTML = `
            <div class="hostype-dropdown-container" style="position: relative;">
                <div class="hostype-dropdown-trigger" id="hostypeDropdownTrigger"
                    style="cursor: pointer; padding: 10px 16px; background: #fff; border-radius: 8px; border: 2px solid var(--primary-blue); display: flex; align-items: center; gap: 10px; min-width: 220px; justify-content: space-between; box-shadow: 0 2px 4px rgba(64, 196, 255, 0.1); transition: all 0.2s;">
                    <span id="selectedHostype" style="font-weight: 600; color: var(--text-heading);">สังกัด: ทั้งหมด</span>
                    <i class="ph ph-caret-down" style="color: var(--primary-blue);"></i>
                </div>
                <div class="hostype-dropdown-menu" id="hostypeDropdownMenu"
                    style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 8px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); z-index: 1000; max-height: 400px; overflow-y: auto; display: none;">
                </div>
            </div>
        `;

        const parent = districtDropdownContainer.parentElement;
        if (!parent.style.display) {
            parent.style.display = 'flex';
            parent.style.gap = '12px';
        }

        districtDropdownContainer.insertAdjacentHTML('afterend', hostypeHTML);
    };

    injectHostypeDropdown();

    // --- Function to Load District Data ---
    const loadDistrict = async (districtCode: string, districtName: string, hostypeCode: string | null = null): Promise<void> => {
        if (districtTitle) {
            districtTitle.textContent = `อำเภอ${districtName} `;
        }

        try {
            // Using /api/oppp here
            let url = `${API_BASE_URL}/api/oppp/${encodeURIComponent(districtCode)}?year=${currentYear}`;
            if (hostypeCode) {
                url += `&hostype=${encodeURIComponent(hostypeCode)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} `);
            }

            const units: Unit[] = await response.json();

            // Update Stats
            if (statTotal) statTotal.textContent = units.length.toString();

            // Count submitted for the selected month
            // --- Determine "Required" months for completeness check ---
            // Completeness means: submitted='y' for ALL months that are due.
            // Due rule: Month M is due when we are in Month M+1.

            const today = new Date();
            // Calculate current fiscal year from today's date (Thai Year)
            const realFiscalYear = (today.getMonth() >= 9) ? today.getFullYear() + 544 : today.getFullYear() + 543;

            // Calculate current fiscal month index (0=Oct, 11=Sep) based on today
            const realFiscalMonthIndex = (today.getMonth() + 3) % 12;

            const selectedYearInt = parseInt(currentYear);

            let cutoffIndex = 0; // Number of months to check (0 to 12)

            if (selectedYearInt < realFiscalYear) {
                // Past year: check all 12 months
                cutoffIndex = 12;
            } else if (selectedYearInt > realFiscalYear) {
                // Future year: nothing due yet
                cutoffIndex = 0;
            } else {
                // Current year: check months strictly before current month
                // e.g. If today is Jan (Idx 3), check Oct(0), Nov(1), Dec(2).
                cutoffIndex = realFiscalMonthIndex;
            }

            // Filter units
            // Complete = u.months[i] === 'y' for all i < cutoffIndex
            const completeUnits = units.filter(u => {
                for (let i = 0; i < cutoffIndex; i++) {
                    if (u.months[i] !== 'y') return false;
                }
                return true;
            });

            const incompleteUnits = units.filter(u => !completeUnits.includes(u));

            if (statSubmitted) statSubmitted.textContent = completeUnits.length.toString();
            if (statMissing) statMissing.textContent = incompleteUnits.length.toString();

            // Update stat labels with current month/year
            updateStatLabels();

            // Track missing units (Incomplete ones)
            missingUnits = incompleteUnits.map((u) => ({
                code: u.code,
                name: u.name
            }));

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

                const renderStatus = (status: string | null, _monthIndex: number): string => {
                    if (!status) {
                        return `<div style="color: #94A3B8; font-size: 20px;">-</div>`;
                    }
                    if (status === 'y') {
                        return `<div class="status-icon success"><i class="ph-fill ph-check-circle"></i></div>`;
                    }
                    return `<div class="status-icon error"><i class="ph-fill ph-x-circle"></i></div>`;
                };

                let monthsHtml = '';
                u.months.forEach((status, index) => {
                    monthsHtml += `<td style="text-align:center">${renderStatus(status, index)}</td>`;
                });

                // Check for specific hostypes to color
                const targetGreen = ['05', '07', '08', '11', '18', '5', '7', '8'];
                const targetPurple = ['21'];

                const hostypeStr = u.hostype ? String(u.hostype).trim() : '';

                let cellStyle = 'font-weight:500;';
                let codeStyle = 'font-family:monospace; background:#f0f2f5; padding:2px 6px; border-radius:4px;';

                if (targetGreen.includes(hostypeStr)) {
                    cellStyle = 'font-weight:600; color: #059669;'; // Emerald Green
                    codeStyle += ' color: #059669; font-weight:600;';
                } else if (targetPurple.includes(hostypeStr)) {
                    cellStyle = 'font-weight:600; color: #7C3AED;'; // Violet Purple
                    codeStyle += ' color: #7C3AED; font-weight:600;';
                }

                tr.innerHTML = `
                    <td><span style="${codeStyle}">${u.code}</span></td>
                    <td style="${cellStyle}">${u.name}</td>
                    ${monthsHtml}
                `;
                tableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error loading district data:', error);

            if (tableBody) {
                tableBody.innerHTML = '';
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="14" style="text-align:center; padding:40px; color:#EF4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาตรวจสอบการเชื่อมต่อกับ API</td>`;
                tableBody.appendChild(tr);
            }

            if (statTotal) statTotal.textContent = '0';
            if (statSubmitted) statSubmitted.textContent = '0';
            if (statMissing) statMissing.textContent = '0';
        }
    };

    // --- Load Years and populate dropdown ---
    const loadYearsFromAPI = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/years`);
            if (!response.ok) throw new Error('Failed to load years');
            const years: string[] = await response.json();

            if (yearDropdownMenu) {
                yearDropdownMenu.innerHTML = '';
                // Filter out 2568 as requested if needed (implied from HDC version)
                years.filter(y => y !== '2568').forEach(year => {
                    const option = document.createElement('div');
                    option.className = 'year-option';
                    option.dataset.year = year;
                    option.style.cssText = 'padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;';
                    option.textContent = `ปีงบประมาณ ${year}`;
                    if (year === currentYear) {
                        option.classList.add('selected');
                        if (selectedYearSpan) selectedYearSpan.textContent = `ปีงบประมาณ ${year}`;
                    }
                    yearDropdownMenu.appendChild(option);
                });

                bindYearDropdownOptions();
            }
        } catch (error) {
            console.error('Error loading years:', error);
        }
    };

    // --- Update stat card labels with current month/year ---
    const updateStatLabels = async (): Promise<void> => {
        // Validation: Logic disabled to preserve icons in HTML headers.
        // The headers are now static with icons, no need to overwrite them.
    };

    // --- Year Dropdown Handlers ---
    if (yearDropdownTrigger && yearDropdownMenu) {
        yearDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = yearDropdownMenu as HTMLElement;
            if (menu.style.display === 'none' || !menu.style.display) {
                // Close others
                const hostypeMenu = document.getElementById('hostypeDropdownMenu');
                if (hostypeMenu) hostypeMenu.style.display = 'none';

                if (dropdownMenu) (dropdownMenu as HTMLElement).style.display = 'none';

                menu.style.display = 'block';
            } else {
                menu.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target as Node;
            if (!yearDropdownTrigger.contains(target) && !yearDropdownMenu.contains(target)) {
                (yearDropdownMenu as HTMLElement).style.display = 'none';
            }
        });
    }

    const bindYearDropdownOptions = (): void => {
        const options = document.querySelectorAll('.year-option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                const year = (option as HTMLElement).dataset.year;
                if (!year) return;

                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('year', year);
                // Keep current month or default
                newUrl.searchParams.set('month', currentMonth);

                if (currentSelectedDistrict) {
                    newUrl.searchParams.set('district', currentSelectedDistrict.code);
                }

                // Add hostype param if exists
                if (selectedHostypeCode) {
                    newUrl.searchParams.set('hostype', selectedHostypeCode);
                }

                window.location.href = newUrl.toString();
            });
        });
    };



    // --- Load Districts from API ---
    const loadDistrictsFromAPI = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/districts`);
            if (!response.ok) throw new Error('Failed to load districts');
            const apiDistricts: District[] = await response.json();
            districts = apiDistricts;

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
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    }; // --- Load Hostypes from API ---
    const loadHostypesFromAPI = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/hostypes`);
            if (!response.ok) throw new Error('Failed to load hostypes');
            const apiHostypes: Hostype[] = await response.json();
            hostypes = apiHostypes;

            const hostypeDropdownMenu = document.getElementById('hostypeDropdownMenu');
            if (hostypeDropdownMenu) {
                let optionsHTML = `
                    <div class="hostype-option selected" data-hostype-code="" style="padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;">
                        ทั้งหมด
                    </div>
                `;

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

    // --- District Dropdown Handlers ---
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

    const bindDropdownOptions = (): void => {
        const options = document.querySelectorAll('.district-option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                const districtCode = (option as HTMLElement).dataset.districtCode;
                const districtName = (option as HTMLElement).dataset.districtName;
                if (!districtCode || !districtName) return;

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

                selectedHostypeCode = name;

                if (selectedHostypeSpan) {
                    selectedHostypeSpan.textContent = `สังกัด: ${displayName}`;
                }

                options.forEach((opt) => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (hostypeDropdownMenu) {
                    hostypeDropdownMenu.style.display = 'none';
                }

                if (currentSelectedDistrict) {
                    loadDistrict(currentSelectedDistrict.code, currentSelectedDistrict.name, selectedHostypeCode);
                }
            });
        });
    };

    // --- Initial Load ---
    await loadYearsFromAPI();
    // await loadMonthsFromAPI(); REMOVED
    await loadDistrictsFromAPI();
    await loadHostypesFromAPI();

    // Check URL parameter for district code
    const districtParam = urlParams.get('district');

    if (districtParam) {
        setTimeout(() => {
            const district = districts.find(d => d.code === districtParam);
            if (district) {
                currentSelectedDistrict = { code: district.code, name: district.name };

                if (selectedDistrictSpan) {
                    selectedDistrictSpan.textContent = district.name;
                }

                const options = document.querySelectorAll('.district-option');
                options.forEach((opt) => {
                    if ((opt as HTMLElement).dataset.districtCode === district.code) {
                        opt.classList.add('selected');
                    }
                });

                loadDistrict(district.code, district.name);
            }
        }, 100);
    }

    // --- Expandable Section Functions ---
    const missingSection = document.getElementById('missingSection');
    const missingSectionBody = document.getElementById('missingSectionBody');
    const missingCard = document.getElementById('missingCard');
    const collapseBtn = document.getElementById('collapseBtn');

    const renderMissingUnitsList = (): void => {
        if (!missingSectionBody) return;

        if (missingUnits.length === 0) {
            missingSectionBody.innerHTML = `
                <div class="empty-state">
                    <i class="ph-fill ph-check-circle"></i>
                    <h4>ทุกหน่วยบริการส่งข้อมูลครบแล้ว</h4>
                    <p>ไม่มีหน่วยบริการที่ยังไม่ได้ส่งข้อมูลในเดือนนี้ 🎉</p>
                </div>
            `;
            return;
        }

        let html = '';
        missingUnits.forEach((unit) => {
            html += `
                <div class="missing-unit-item">
                    <div class="missing-unit-icon">
                        <i class="ph-fill ph-warning-circle"></i>
                    </div>
                    <div class="missing-unit-info">
                        <div class="missing-unit-code">${unit.code}</div>
                        <div class="missing-unit-name" title="${unit.name}">${unit.name}</div>
                    </div>
                </div>
            `;
        });
        missingSectionBody.innerHTML = html;
    };

    const expandSection = (): void => {
        if (missingSection) {
            renderMissingUnitsList();
            missingSection.classList.add('expanded');
        }
    };

    const collapseSection = (): void => {
        if (missingSection) {
            missingSection.classList.remove('expanded');
        }
    };

    const toggleSection = (): void => {
        if (missingSection?.classList.contains('expanded')) {
            collapseSection();
        } else {
            expandSection();
        }
    };

    if (missingCard) {
        missingCard.addEventListener('click', toggleSection);
    }

    if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collapseSection();
        });
    }

});
