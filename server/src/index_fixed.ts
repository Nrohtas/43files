// Temporary file - copy the fixed endpoints below

// API endpoint for district summary - shows total units for each district
app.get('/api/districts/summary', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11'; // Default to November

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            COUNT(DISTINCT h.hospcode) as total_units,
            SUM(CASE WHEN UPPER(hdc.sentdata) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(hdc.sentdata, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
            AND hdc.year_th = ? 
            AND hdc.month_no = ?
        GROUP BY h.amp_code, a.amp_name
        ORDER BY h.amp_code ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const summary = results.map((row: any) => ({
            code: row.amp_code,
            name: row.amp_name,
            totalUnits: parseInt(row.total_units) || 0,
            submitted: parseInt(row.submitted) || 0,
            missing: parseInt(row.missing) || 0
        }));

        res.json(summary);
    });
});

// API endpoint for all missing units across the province (grouped by district)
app.get('/api/missing-units/all', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11';

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            h.hospcode,
            h.hospname
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
            AND hdc.year_th = ? 
            AND hdc.month_no = ?
        WHERE UPPER(IFNULL(hdc.sentdata, 'N')) != 'Y'
        ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        // ... rest of the code
    });
});

// API endpoint for OPPP district summary
app.get('/api/oppp/districts/summary', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11'; // Default to November

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            COUNT(DISTINCT h.hospcode) as total_units,
            SUM(CASE WHEN UPPER(oppp.sentdata) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
            AND oppp.year_th = ? 
            AND oppp.month_no = ?
        GROUP BY h.amp_code, a.amp_name
        ORDER BY h.amp_code ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        // ... rest of the code
    });
});

// API endpoint for all missing units across the province for OPPP (grouped by district)
app.get('/api/oppp/missing-units/all', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11';

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            h.hospcode,
            h.hospname
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
            AND oppp.year_th = ? 
            AND oppp.month_no = ?
        WHERE UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y'
        ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        // ... rest of the code
    });
});
