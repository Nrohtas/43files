import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET - Fetch HDC API status data
export async function GET() {
    try {
        // Get all records ordered by latest update
        const [rows] = await pool.execute(`
            SELECT 
                api_id,
                h_count,
                h_y,
                h_n,
                d_update
            FROM hdc_api 
            ORDER BY d_update DESC
        `);

        // Get summary statistics
        const [summaryRows] = await pool.execute(`
            SELECT 
                COUNT(*) as total_runs,
                SUM(h_count) as total_units,
                SUM(h_y) as total_processed,
                SUM(h_n) as total_pending,
                MAX(d_update) as last_update
            FROM hdc_api
        `);

        // Get latest record for current status
        const [latestRows] = await pool.execute(`
            SELECT 
                h_count,
                h_y,
                h_n,
                d_update
            FROM hdc_api
            ORDER BY d_update DESC
            LIMIT 1
        `);

        const summary = (summaryRows as any[])[0] || {
            total_runs: 0,
            total_units: 0,
            total_processed: 0,
            total_pending: 0,
            last_update: null
        };

        const latest = (latestRows as any[])[0] || {
            h_count: 0,
            h_y: 0,
            h_n: 0,
            d_update: null
        };

        return NextResponse.json({
            success: true,
            data: {
                history: rows,
                summary: {
                    totalRuns: summary.total_runs || 0,
                    totalUnits: summary.total_units || 0,
                    totalProcessed: summary.total_processed || 0,
                    totalPending: summary.total_pending || 0,
                    lastUpdate: summary.last_update
                },
                latest: {
                    unitCount: latest.h_count || 0,
                    processed: latest.h_y || 0,
                    pending: latest.h_n || 0,
                    updateTime: latest.d_update
                }
            }
        });
    } catch (error) {
        console.error('Error fetching HDC API status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch HDC API status' },
            { status: 500 }
        );
    }
}
