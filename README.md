# 43files Dashboard - HDC Data Submission Tracking

Dashboard application for tracking 43 HDC file submissions from healthcare facilities in Phitsanulok province.

## Project Structure

- **backend/** - Node.js/TypeScript server with Express and MySQL
- **frontend/** - HTML/CSS/TypeScript frontend application

## Technologies

- **Backend**: Node.js, Express, TypeScript, MySQL
- **Frontend**: HTML5, CSS3, TypeScript, Phosphor Icons
- **Database**: MySQL (43files database)

## Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure database connection in `backend/server.ts`:
   ```typescript
   host: 'localhost',
   user: 'root',
   password: 'root',
   database: '43files',
   port: 3306
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Database Structure

### Tables
- `ampur` - District information (9 districts in Phitsanulok)
- `hospital` - Hospital/health facility records (132 facilities)
- `hostype` - Hospital type/affiliation categories
- `hdc` - Monthly HDC submission tracking data

### Districts (อำเภอ)
1. เมืองพิษณุโลก (6501)
2. นครไทย (6502)
3. ชาติตระการ (6503)
4. บางระกำ (6504)
5. บางกระทุ่ม (6505)
6. พรหมพิราม (6506)
7. วัดโบสถ์ (6507)
8. วังทอง (6508)
9. เนินมะปราง (6509)

## Features

- District-based healthcare facility listing
- Monthly submission status tracking (October 2024 - September 2025)
- Filter by hospital affiliation type (สังกัด)
- Real-time statistics dashboard
- Responsive design

## API Endpoints

- `GET /api/districts` - Get list of all districts
- `GET /api/hdc/:district` - Get HDC data for specific district
- `GET /api/hostypes` - Get list of hospital types/affiliations
- `GET /api/districts/summary` - Get summary statistics

## Development

Run backend server:
```bash
npx tsx backend/server.ts
```

The application will be available at `http://localhost:3000`

## License

Private - Phitsanulok Provincial Health Office

## Contact

สำนักงานสาธารณสุขจังหวัดพิษณุโลก
