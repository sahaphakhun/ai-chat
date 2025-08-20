# AI Chat - ระบบสนทนากับ AI ใหม่

ระบบสนทนากับ AI ที่เรียบง่าย เร็ว และเสถียร

## คุณสมบัติ

- 💬 สนทนากับ AI แบบเรียลไทม์
- 🚀 สตรีมข้อความตอบกลับแบบทันที
- 💾 บันทึกการสนทนาอัตโนมัติ
- 🌙 รองรับ Dark/Light mode
- 📱 Responsive design
- ⚡ เร็วและเสถียร

## การติดตั้ง

1. Clone repository
```bash
git clone <repository-url>
cd simple-chat
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า API Key
- เปิดแอปพลิเคชัน
- กดปุ่มตั้งค่า (⚙️)
- ใส่ OpenAI API Key

4. รันแอปพลิเคชัน
```bash
npm run dev
```

## โครงสร้างระบบ

### Core Components
- `ChatContext` - จัดการ state การสนทนา
- `ChatService` - จัดการการสื่อสารกับ OpenAI API
- `StorageService` - จัดการการบันทึกข้อมูล

### UI Components
- `ChatWindow` - หน้าจอหลักสำหรับสนทนา
- `MessageList` - แสดงรายการข้อความ
- `MessageInput` - ช่องกรอกข้อความ
- `SettingsDrawer` - หน้าตั้งค่า

### Data Flow
1. ผู้ใช้พิมพ์ข้อความ → `MessageInput`
2. ส่งข้อความ → `ChatWindow` → `ChatService`
3. สตรีมคำตอบจาก OpenAI → อัปเดต UI แบบเรียลไทม์
4. บันทึกข้อมูล → `StorageService`

## การใช้งาน

1. **เริ่มสนทนา**: พิมพ์ข้อความและกด Enter
2. **หยุดการสตรีม**: กดปุ่ม "หยุด" ขณะ AI กำลังตอบ
3. **เปลี่ยนธีม**: กดปุ่ม 🌙/☀️
4. **ตั้งค่า**: กดปุ่ม ⚙️

## เทคโนโลยีที่ใช้

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **API**: OpenAI Chat Completions API
- **Storage**: LocalStorage

## การพัฒนา

### การเพิ่มฟีเจอร์ใหม่
1. เพิ่ม action ใน `ChatContext`
2. อัปเดต reducer
3. เพิ่ม UI component
4. ทดสอบการทำงาน

### การแก้ไขบั๊ก
1. ตรวจสอบ console logs
2. ดู state ใน React DevTools
3. ทดสอบในสภาพแวดล้อมต่างๆ

## License

MIT License
