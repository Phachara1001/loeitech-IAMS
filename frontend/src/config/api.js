// Base URL ของ backend API
// ถ้า backend รันคนละ port ให้ตั้งค่า VITE_API_URL ในไฟล์ .env ของ frontend แทน เช่น:
//   VITE_API_URL=http://localhost:3000/api
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'