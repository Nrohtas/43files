# โครงสร้าง URL ใหม่

## URL ที่ใช้งาน

### HDC Dashboard
- **URL**: http://localhost:5173/
- **ไฟล์**: `client/index.html`

### HDC Report (รายเดือน)
- **URL**: http://localhost:5173/report
- **ไฟล์**: `client/report/index.html`

### OPPP Dashboard
- **URL**: http://localhost:5173/oppp
- **ไฟล์**: `client/oppp/index.html`

### OPPP Report (รายเดือน)
- **URL**: http://localhost:5173/oppp/report
- **ไฟล์**: `client/oppp/report/index.html`

### Admin Login
- **URL**: http://localhost:5173/admin
- **ไฟล์**: `client/admin/index.html`

---

## โครงสร้างโฟลเดอร์

```
client/
├── index.html          → / (HDC Dashboard)
├── report/
│   └── index.html      → /report (HDC Report)
├── oppp/
│   ├── index.html      → /oppp (OPPP Dashboard)
│   └── report/
│       └── index.html  → /oppp/report (OPPP Report)
├── admin/
│   └── index.html      → /admin (Admin Login)
└── src/
    ├── pages/          (ไฟล์ต้นฉบับ - ไม่ถูกใช้โดยตรง)
    ├── scripts/        (TypeScript files)
    ├── styles/         (CSS files)
    └── assets/         (Images, etc.)
```

---

## การเริ่มใช้งาน

```cmd
start-dev.bat
```

จากนั้นเปิด: **http://localhost:5173/**

ทุก URL สั้นและสะอาดแล้ว ไม่มี `/src/pages/` ในที่ใดๆ!
