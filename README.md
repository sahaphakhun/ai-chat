# OpenAI Chat UI (React + TypeScript + Vite)

คุณสมบัติหลัก:
- จัดการประวัติหลายห้อง เก็บใน localStorage และสลับ IndexedDB อัตโนมัติเมื่อขนาด > 5MB
- ดาวน์โหลด/อัปโหลด .json, ลบห้อง, ลบทั้งหมด
- System Instruction แบบ persist
- ช่อง API Key พร้อมแสดง/ซ่อน และปุ่มทดสอบคีย์ (เรียก GET /v1/models)
- Dropdown โมเดล + ราคาอัตโนมัติจาก `src/constants/modelPricing.ts` และปุ่ม Refresh จาก API
- นับโทเค็นแบบเรียลไทม์ด้วย `gpt-tokenizer` (เทียบเท่า tiktoken)
- คำนวณต้นทุน input/output และรวม
- UI ด้วย Tailwind, รองรับ Dark/Light, เลื่อนอัตโนมัติ, สตรีมมิ่ง SSE, Toast error
- คุณภาพโค้ด: ESLint + Prettier + Husky, Unit tests ด้วย Vitest
- Deployment: Dockerfile + railway.json + docker-compose.yml

## วิธีรัน
```bash
npm install
npm run dev
```

## Build production
```bash
npm run build
npm run preview
```

## ทดสอบ
```bash
npm test
```
