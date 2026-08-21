<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-vue-next'

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const router = useRouter()
const toast = useToast()

// สิทธิ์การเข้าถึง: User ทั่วไปเห็นแค่ภาพรวม (การ์ดสรุป + กราฟ) ไม่เห็นตารางกิจกรรมล่าสุดเชิงลึกของฝ่ายอื่น
const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')
const canSeeDetails = computed(() => ['admin', 'staff'].includes(currentRole.value))
const isAdmin = computed(() => currentRole.value === 'admin')

const isLoading = ref(true)
const overview = ref(null) // ข้อมูลดิบทั้งหมดจาก backend

function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

function extractErrorMessage(error) {
  const data = error.response?.data
  if (data?.errors?.length) return data.errors.join(' / ')
  if (data?.message) return data.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

function handleUnauthorized(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('tcaims_auth_token')
    localStorage.removeItem('tcaims_user')
    localStorage.removeItem('tcaims_role')
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
    router.push('/login')
    return true
  }
  return false
}

async function fetchOverview() {
  isLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/dashboard/overview`, { headers: authHeaders() })
    overview.value = response.data.data
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchOverview)

// ==========================================
// การ์ดสรุป 4 ใบ (คำนวณจาก overview.stats ที่ดึงมาจริง)
// หมายเหตุ: เอาข้อความเทรนด์/เปอร์เซ็นต์ที่เคยเป็นตัวเลขสมมุติออก
// เพราะ backend ยังไม่มีการคำนวณเทียบย้อนหลัง ใส่ไว้จะเป็นข้อมูลเท็จ
// ==========================================
const stats = computed(() => {
  const s = overview.value?.stats
  return [
    {
      title: 'ครุภัณฑ์ทั้งหมดในระบบ',
      value: s ? s.totalAssets.toLocaleString() : '-',
      change: 'รวมทุกสถานะ',
      icon: Boxes,
      color: 'text-blue-700',
      bg: 'bg-blue-50'
    },
    {
      title: 'พัสดุสิ้นเปลืองใกล้หมดคลัง',
      value: s ? s.lowStockItems.toLocaleString() : '-',
      change: 'ต้องการการสั่งซื้อเพิ่มเติม',
      icon: AlertTriangle,
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    },
    {
      title: 'ครุภัณฑ์สถานะใช้งานปกติ',
      value: s ? s.activeAssets.toLocaleString() : '-',
      change: 'ครุภัณฑ์พร้อมใช้งาน',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      title: 'คำขอเบิกที่รอดำเนินการ',
      value: s ? s.pendingRequisitions.toLocaleString() : '-',
      change: 'รอการอนุมัติ',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    }
  ]
})

// ==========================================
// ตารางกิจกรรมล่าสุด
// ==========================================
const recentActivities = computed(() => overview.value?.recentActivities || [])

const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'bg-emerald-50 text-emerald-700'
    case 'warning': return 'bg-amber-50 text-amber-700'
    case 'danger': return 'bg-rose-50 text-rose-700'
    case 'info':
    default: return 'bg-blue-50 text-blue-700'
  }
}

// แปลงเวลาจริง (ISO date) เป็นข้อความแบบ "x นาทีที่แล้ว" ภาษาไทย
function formatRelativeTime(dateStr) {
  if (!dateStr) return '-'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'เมื่อสักครู่'
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} วันที่แล้ว`
}

// ==========================================
// กราฟแท่ง: จำนวนคำขอเบิกรายเดือน (ปีงบประมาณปัจจุบัน ดึงจาก backend จริง)
// ==========================================
const fiscalYearBE = computed(() => overview.value?.monthlyRequisitions?.fiscalYearBE || '')

const chartData = computed(() => {
  const monthly = overview.value?.monthlyRequisitions?.data || []
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: 'จำนวนคำขอเบิก (ครั้ง)',
        backgroundColor: '#047857', // Emerald 700
        borderRadius: 4,
        data: monthly.map((m) => m.count)
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      titleFont: { family: 'Sarabun' },
      bodyFont: { family: 'Sarabun' }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { font: { family: 'Sarabun' }, precision: 0 },
      grid: { borderDash: [4, 4] }
    },
    x: {
      ticks: { font: { family: 'Sarabun' } },
      grid: { display: false }
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <Boxes class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-white">ภาพรวมระบบ (Dashboard)</h2>
          <p class="text-sm text-emerald-100/80 mt-0.5">สรุปข้อมูลภาพรวมพัสดุ ครุภัณฑ์ และปริมาณการเบิกจ่าย</p>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div v-for="(stat, index) in stats" :key="index"
        class="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-start space-x-4 transition-all hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5">
        <div :class="[stat.bg, stat.color, 'p-3 rounded-xl flex-shrink-0 ring-1 ring-black/5']">
          <component :is="stat.icon" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
          <h3 class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</h3>
          <p class="text-xs text-slate-400 mt-1">{{ stat.change }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
        <div class="px-6 py-5 border-b border-emerald-50 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <Boxes class="w-4 h-4 text-[#065f46]" />
            </div>
            <h3 class="font-bold text-slate-800 text-lg">
              สถิติการเบิกจ่ายพัสดุ<span v-if="fiscalYearBE"> (ปีงบประมาณ {{ fiscalYearBE }})</span>
            </h3>
          </div>
          <Loader2 v-if="isLoading" class="w-4 h-4 text-[#065f46] animate-spin" />
        </div>
        <div class="p-6 h-80">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
        <div class="px-6 py-5 border-b border-emerald-50">
          <h3 class="font-bold text-slate-800 text-lg">เมนูด่วน</h3>
        </div>
        <div class="p-6 space-y-3">
          <router-link to="/inventory-receive"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <Boxes class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              รับเข้าพัสดุ
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>

          <router-link to="/asset-distribution"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <AlertTriangle class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              แจ้งซ่อม/ชำรุด
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>

          <router-link to="/requisition-management"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <CheckCircle2 class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              อนุมัติเบิกจ่าย
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Recent Activity Table (Admin, Staff เท่านั้น - User เห็นแค่ภาพรวมด้านบน) -->
    <div v-if="canSeeDetails" class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      <div class="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-[#065f46] to-[#047857]">
        <h3 class="font-bold text-white text-lg">ประวัติกิจกรรมล่าสุดในระบบ</h3>
        <router-link v-if="isAdmin" to="/activity-logs"
          class="text-sm text-[#065f46] font-bold hover:shadow-md flex items-center bg-white px-3.5 py-1.5 rounded-lg shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all">
          ดูทั้งหมด
          <ArrowRight class="w-4 h-4 ml-1" />
        </router-link>
      </div>
      <div class="overflow-x-auto max-h-[55vh] overflow-y-auto no-scrollbar">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="sticky top-0 z-10">
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
              <th class="px-6 py-3.5">กิจกรรม</th>
              <th class="px-6 py-3.5">รายการ/เป้าหมาย</th>
              <th class="px-6 py-3.5">ผู้ดำเนินการ</th>
              <th class="px-6 py-3.5">เวลา</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="activity in recentActivities" :key="activity.id" class="group hover:bg-emerald-50/60 transition-colors">
              <td class="px-6 py-4 border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">
                <div class="flex items-center">
                  <div class="w-2.5 h-2.5 rounded-full mr-3" :class="getStatusColor(activity.status).split(' ')[0]">
                  </div>
                  <span class="font-medium text-slate-800">{{ activity.action }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ activity.item }}</td>
              <td class="px-6 py-4 text-slate-600">{{ activity.user }}</td>
              <td class="px-6 py-4 text-slate-500">{{ formatRelativeTime(activity.createdAt) }}</td>
            </tr>
            <tr v-if="!isLoading && recentActivities.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">ยังไม่มีกิจกรรมในระบบ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style>
/* ใช้กับกล่องตารางที่เลื่อนภายในตัวเอง (เช่นตอนข้อมูลเยอะ) ให้เลื่อนได้ปกติแต่ไม่โชว์แถบเลื่อน */
.no-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE / Edge เก่า */
}
.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge (Chromium) */
}
</style>