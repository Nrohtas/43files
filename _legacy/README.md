# README - วิธีใช้งาน Dashboard

## 🚀 วิธีเริ่มระบบ (เลือก 1 วิธี)

### วิธีที่ 1: ใช้ Batch File (แนะนำ - ง่ายที่สุด)
```cmd
start-dev.bat
```
จะเปิด 2 หน้าต่าง:
- หน้าต่าง Server (ดำ)
- หน้าต่าง Client (Vite)

### วิธีที่ 2: เปิดแยก 2 Terminal
**Terminal 1 - Server:**
```cmd
node --import tsx server/src/index.ts
```
**หมายเหตุ:** หากต้องการแก้ไขการตั้งค่าฐานข้อมูล ให้แก้ไขไฟล์ `server/.env` (สร้างจาก `.env.example`)

**Terminal 2 - Client:**
```cmd
npx vite client
```

### วิธีที่ 3: เปิดใน VS Code
1. เปิด Terminal ใน VS Code (Ctrl + `)
2. Split Terminal (กดปุ่ม + ข้างๆ dropdown)
3. รันคำสั่ง:
   - Terminal 1: `node --import tsx server/src/index.ts`
   - Terminal 2: `npx vite client`

---

## 🌐 เข้าใช้งานระบบ

Server รันที่: **http://localhost:3000**  
Client รันที่: **http://localhost:5173**

### หน้าต่างๆ ที่ใช้งานได้:
- **หน้าแรก**: http://localhost:5173/index.html
- **HDC Dashboard**: http://localhost:5173/hdc/dashboard.html
- **HDC Report**: http://localhost:5173/hdc/report.html
- **OPPP Dashboard**: http://localhost:5173/oppp/dashboard.html
- **OPPP Report**: http://localhost:5173/oppp/report.html
- **Admin Login**: http://localhost:5173/admin/login.html

---

## ⚙️ คำสั่งอื่นๆ

### Build Production
```cmd
npx vite build client
```

### ดู API Documentation
Server endpoints:
- `GET /api/districts` - รายการอำเภอ
- `GET /api/hdc/:district` - ข้อมูล HDC
- `GET /api/oppp/:district` - ข้อมูล OPPP
- `GET /api/years` - ปีที่มีข้อมูล
- `GET /api/months` - เดือนที่มีข้อมูล
- `GET /api/hostypes` - ประเภทสถานพยาบาล

---

## 🔧 แก้ปัญหา

### ปัญหา: npm/npx ใช้ไม่ได้
**สาเหตุ**: PowerShell Execution Policy  
**วิธีแก้**: ใช้ `start-dev.bat` แทน หรือรันด้วย `node` โดยตรง

### ปัญหา: หน้าเว็บ 404
**ตรวจสอบ**: กำลังเข้า URL ที่ถูกต้องหรือไม่  
**URL ที่ใช้**: http://localhost:5173/hdc/dashboard.html (ไม่ใช่ hdc.html)

### ปัญหา: ไม่มีข้อมูล
**ตรวจสอบ**:
1. Server รันอยู่หรือไม่ (port 3000)
2. Database เชื่อมต่อได้หรือไม่
3. เปิด Console ใน Browser ดู error

---

## 📁 โครงสร้างโปรเจค

```
43files/
├── server/              # Server-side (Node.js + Express)
│   ├── src/
│   │   └── index.ts     # Main server file
│   └── scripts/         # Development scripts
├── client/              # Client-side (HTML + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/       # HTML pages
│   │   ├── scripts/     # TypeScript files
│   │   ├── styles/      # CSS files
│   │   └── assets/      # Images, etc.
│   └── dist/            # Build output
├── start-dev.bat        # Quick start script
└── package.json
```

---

## ℹ️ ข้อมูลเพิ่มเติม

- **Documentation**: ดูที่ `docs/` folder (ถ้ามี)
- **Troubleshooting**: ดู troubleshooting.md ใน artifacts
- **Contact**: Digital Health Group, Phitsanulok PHO
