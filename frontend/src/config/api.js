// Base URL ของ backend API
// - ตอน dev: http://localhost:3000/api
// - ตอน production (Docker): ใช้ /api (relative path) ให้ Nginx proxy ต่อให้
export const API_BASE = import.meta.env.VITE_API_URL || '/api'