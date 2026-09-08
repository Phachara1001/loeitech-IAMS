import axios from 'axios'

// Axios instance ที่ใช้ร่วมกันทุกหน้า
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

// Request interceptor — แนบ JWT token ให้ทุก request อัตโนมัติ (จำเป็นสำหรับ endpoint ที่ต้องล็อกอิน)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tcaims_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — ดักจับ error กลาง
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // เซสชันหมดอายุ/token ไม่ถูกต้อง — ล้างข้อมูลแล้วเด้งไปหน้า login
    if (error.response?.status === 401) {
      localStorage.removeItem('tcaims_auth_token')
      localStorage.removeItem('tcaims_user')
      localStorage.removeItem('tcaims_role')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
    return Promise.reject(new Error(message))
  }
)

export default api