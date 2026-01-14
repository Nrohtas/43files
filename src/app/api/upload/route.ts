import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        // Check file extension
        const validExtensions = ['.xlsx', '.xls'];
        const ext = path.extname(file.name).toLowerCase();
        if (!validExtensions.includes(ext)) {
            return NextResponse.json({ success: false, message: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to 'fileupload' folder in project root
        const uploadDir = path.join(process.cwd(), 'fileupload');

        // Ensure directory exists (redundant if manually created, but good practice)
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // ignore if exists
        }

        const filePath = path.join(uploadDir, file.name);
        await writeFile(filePath, buffer);

        return NextResponse.json({ success: true, message: `File ${file.name} uploaded successfully` });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
