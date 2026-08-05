import axios from 'axios'

// Axios instance ที่ใช้ร่วมกันทุกหน้า
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

// Response interceptor — ดักจับ error กลาง
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
    return Promise.reject(new Error(message))
  }
)

export default api
