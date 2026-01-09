import { Chart, ChartOptions } from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', (): void => {

    // --- Sparkline Charts (Simplified Line Charts) ---
    const sparkOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 }
        },
        elements: {
            point: { radius: 0 },
            line: { tension: 0.4, borderWidth: 2 }
        },
        layout: { padding: 0 }
    };

    const createSpark = (id: string, color: string, data: number[]): void => {
        const canvas = document.getElementById(id) as HTMLCanvasElement | null;
        if (!canvas) return;

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7'],
                datasets: [{
                    data: data,
                    borderColor: color,
                    fill: false
                }]
            },
            options: sparkOptions
        });
    };

    createSpark('spark1', '#40C4FF', [10, 12, 11, 14, 13, 16, 15]);
    createSpark('spark2', '#40C4FF', [10, 11, 10, 12, 11, 12, 11]);
    createSpark('spark3', '#40C4FF', [5, 6, 7, 6, 8, 9, 12]);


    // --- Main Area Chart ---
    const ctxMain = (document.getElementById('mainAreaChart') as HTMLCanvasElement | null)?.getContext('2d');
    if (ctxMain) {
        new Chart(ctxMain, {
            type: 'line',
            data: {
                labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
                datasets: [{
                    label: 'Metric',
                    data: [15, 30, 20, 45, 25, 35, 10],
                    borderColor: '#40C4FF',
                    backgroundColor: 'rgba(64, 196, 255, 0.0)', // No fill as per image style usually
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#40C4FF',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    tension: 0.0 /* Straight lines in the image mostly */
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    // @ts-ignore - datalabels plugin might not be installed
                    datalabels: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { display: false } // Hide labels for clean look
                    },
                    y: {
                        grid: {
                            color: '#F0F2F5',
                            // @ts-ignore - borderDash is valid but types might be outdated
                            borderDash: [5, 5]
                        },
                        ticks: { display: false },
                        border: { display: false }
                    }
                },
                elements: {
                    line: { tension: 0 } // Angular lines
                }
            }
        });
    }

    // --- Bar Chart ---
    const ctxBar = (document.getElementById('barChart') as HTMLCanvasElement | null)?.getContext('2d');

    if (ctxBar) {
        // Create gradient
        const gradientBar = ctxBar.createLinearGradient(0, 0, 0, 200);
        gradientBar.addColorStop(0, '#40C4FF');
        gradientBar.addColorStop(1, '#0091EA'); // Darker bottom

        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
                datasets: [{
                    data: [40, 30, 60, 80, 50, 40, 80, 50, 60, 30, 70, 40],
                    backgroundColor: '#B3E5FC',
                    borderRadius: 4,
                    barThickness: 10,
                    hoverBackgroundColor: '#40C4FF'
                }, {
                    // Secondary bars (overlapping or stacked style simulation)
                    // For simplicity in this demo, just one set, but we can do grouped
                    data: [20, 50, 30, 40, 70, 20, 60, 40, 20, 50, 40, 60],
                    backgroundColor: '#40C4FF',
                    borderRadius: 4,
                    barThickness: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false, stacked: false },
                    y: { display: false, grid: { display: false } }
                },
                layout: { padding: 10 }
            }
        });
    }

    // --- Submenu Toggle Logic ---
    const dashboardLink = document.getElementById('dashboard-link');
    const submenuWrapper = document.querySelector('.submenu-wrapper');
    const navGroup = document.querySelector('.nav-group');

    if (dashboardLink && submenuWrapper && navGroup) {
        dashboardLink.addEventListener('click', (e: Event): void => {
            e.preventDefault();
            // Toggle open class
            submenuWrapper.classList.toggle('open');
            navGroup.classList.toggle('active');
        });
    }
});
