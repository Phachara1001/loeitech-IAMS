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
  Loader2,
  Wrench,
  ArrowRightLeft,
  PackageOpen,
  CircleDollarSign,
  Monitor,
  Activity
} from 'lucide-vue-next'

import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const router = useRouter()
const toast = useToast()

const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')
const canSeeDetails = computed(() => ['admin', 'staff'].includes(currentRole.value))
const isAdmin = computed(() => currentRole.value === 'admin')

const isLoading = ref(true)
const overview = ref(null)

function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

function handleUnauthorized(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('tcaims_auth_token')
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
    if (!handleUnauthorized(error)) toast.error('ไม่สามารถโหลดข้อมูลได้')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchOverview)

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

function formatCurrency(val) {
  if (val === null || val === undefined) return '-'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(val)
}

// ==========================================
// ส่วนของครุภัณฑ์ (Assets)
// ==========================================
const assetsData = computed(() => overview.value?.assets || {})

const assetStats = computed(() => [
  {
    title: 'จำนวนครุภัณฑ์รวม',
    value: assetsData.value.total?.toLocaleString() || '-',
    change: 'รายการ',
    icon: Monitor,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100'
  },
  {
    title: 'มูลค่ารวม (โดยประมาณ)',
    value: formatCurrency(assetsData.value.totalValue),
    change: 'บาท',
    icon: CircleDollarSign,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100'
  },
  {
    title: 'รอแจ้งซ่อม',
    value: assetsData.value.pendingRepairs?.toLocaleString() || '-',
    change: 'รายการ',
    icon: Wrench,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-100'
  },
  {
    title: 'รอยืม-คืน',
    value: assetsData.value.pendingBorrows?.toLocaleString() || '-',
    change: 'รายการ',
    icon: ArrowRightLeft,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100'
  }
])

const assetChartData = computed(() => {
  const dist = assetsData.value.statusDistribution || {}
  return {
    labels: ['ใช้งานได้ปกติ', 'ส่งซ่อม', 'ชำรุด', 'แทงจำหน่าย'],
    datasets: [{
      data: [
        dist['Active'] || 0,
        dist['Repaired'] || 0,
        dist['Broken'] || 0,
        dist['Scrapped'] || 0
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
      borderWidth: 0
    }]
  }
})

// ==========================================
// ส่วนของพัสดุ (Consumables)
// ==========================================
const consData = computed(() => overview.value?.consumables || {})

const consStats = computed(() => [
  {
    title: 'รายการพัสดุทั้งหมด',
    value: consData.value.totalItems?.toLocaleString() || '-',
    change: 'รายการ (SKU)',
    icon: PackageOpen,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100'
  },
  {
    title: 'มูลค่าคงคลัง',
    value: formatCurrency(consData.value.totalValue),
    change: 'บาท',
    icon: CircleDollarSign,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-100'
  },
  {
    title: 'ใกล้หมดคลัง (Low Stock)',
    value: consData.value.lowStock?.toLocaleString() || '-',
    change: 'รายการ',
    icon: AlertTriangle,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-100'
  },
  {
    title: 'คำขอเบิกรอดำเนินการ',
    value: consData.value.pendingRequisitions?.toLocaleString() || '-',
    change: 'รายการ',
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100'
  }
])

const fiscalYearBE = computed(() => consData.value.monthlyChart?.fiscalYearBE || '')

const consChartData = computed(() => {
  const monthly = consData.value.monthlyChart?.data || []
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: 'จำนวนคำขอเบิก (ครั้ง)',
        backgroundColor: '#059669',
        borderRadius: 4,
        data: monthly.map((m) => m.count)
      }
    ]
  }
})

// ==========================================
// Options สำหรับกราฟ
// ==========================================
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { font: { family: 'Sarabun' } } }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { font: { family: 'Sarabun' }, precision: 0 } },
    x: { ticks: { font: { family: 'Sarabun' } }, grid: { display: false } }
  }
}

// ==========================================
// กิจกรรมล่าสุด
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

</script>

<template>
  <div class="space-y-8">
    <!-- หน้าจอกำลังโหลด -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 class="w-10 h-10 text-emerald-500 animate-spin mb-4" />
      <p class="text-slate-500 animate-pulse font-medium">กำลังประมวลผลข้อมูลแดชบอร์ด...</p>
    </div>

    <template v-else>
      <!-- HEADER -->
      <div
        class="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10 shadow-xl border border-slate-800">
        <!-- Abstract Background Shapes -->
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-emerald-600/20 to-transparent"></div>
        <div
          class="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[100px] pointer-events-none">
        </div>
        <div
          class="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none">
        </div>

        <!-- Subtle Grid Overlay -->
        <div
          class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGc+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTEwIDB2NDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-30 pointer-events-none">
        </div>

        <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div
              class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 shadow-inner shrink-0 relative overflow-hidden group">
              <div
                class="absolute inset-0 bg-gradient-to-tr from-emerald-400/40 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              </div>
              <Activity class="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                ระบบบริหารจัดการครุภัณฑ์และพัสดุ <span
                  class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">แผนกเทคโนโลยีสารสนเทศ</span>
              </h2>
              <p class="text-sm sm:text-base text-slate-300 mt-1.5 font-medium max-w-2xl">
                สรุปข้อมูลภาพรวมการเบิกจ่ายพัสดุ และสถานะการบำรุงรักษาครุภัณฑ์ภายในแผนก</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 1: ASSETS -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Monitor class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">ระบบบริหารครุภัณฑ์</h3>
            <p class="text-xs text-slate-500">Asset Management Overview</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="(stat, idx) in assetStats" :key="idx"
            class="p-5 rounded-2xl border transition-all hover:shadow-md" :class="stat.border">
            <div class="flex items-center gap-3 mb-3">
              <div :class="[stat.bg, stat.color, 'p-2.5 rounded-xl']">
                <component :is="stat.icon" class="w-5 h-5" />
              </div>
              <p class="text-sm font-semibold text-slate-600">{{ stat.title }}</p>
            </div>
            <div class="flex items-baseline gap-2">
              <h4 class="text-2xl font-black text-slate-800">{{ stat.value }}</h4>
              <span class="text-xs font-medium text-slate-400">{{ stat.change }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col items-center">
            <h4 class="font-bold text-slate-700 w-full mb-4">สัดส่วนสถานะครุภัณฑ์</h4>
            <div class="w-full h-48 flex items-center justify-center relative">
              <Doughnut :data="assetChartData" :options="doughnutOptions" />
            </div>
          </div>

          <div class="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div class="px-5 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h4 class="font-bold text-slate-700 flex items-center gap-2">
                <Wrench class="w-4 h-4 text-rose-500" />
                รายการแจ้งซ่อมล่าสุด
              </h4>
              <router-link v-if="canSeeDetails" to="/maintenance-repair"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">ดูทั้งหมด
                <ArrowRight class="w-3 h-3" />
              </router-link>
            </div>
            <div class="flex-1 p-0 overflow-y-auto max-h-56">
              <div v-if="!assetsData.recentRepairs?.length"
                class="h-full flex items-center justify-center text-slate-400 text-sm py-8 italic">
                ไม่มีรายการแจ้งซ่อมล่าสุด
              </div>
              <div v-else class="divide-y divide-slate-100">
                <div v-for="r in assetsData.recentRepairs" :key="r.id"
                  class="px-5 py-3 hover:bg-slate-100/50 transition-colors flex justify-between items-center">
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ r.assetName }}</p>
                    <p class="text-xs text-slate-500">รหัส: {{ r.assetSeq }} • แจ้งโดย: {{ r.requester }}</p>
                  </div>
                  <div class="text-right">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">รอดำเนินการ</span>
                    <p class="text-[10px] text-slate-400 mt-1">{{ formatRelativeTime(r.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: CONSUMABLES -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <PackageOpen class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">ระบบเบิกจ่ายพัสดุสิ้นเปลือง</h3>
            <p class="text-xs text-slate-500">Inventory & Consumables Overview</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="(stat, idx) in consStats" :key="idx" class="p-5 rounded-2xl border transition-all hover:shadow-md"
            :class="stat.border">
            <div class="flex items-center gap-3 mb-3">
              <div :class="[stat.bg, stat.color, 'p-2.5 rounded-xl']">
                <component :is="stat.icon" class="w-5 h-5" />
              </div>
              <p class="text-sm font-semibold text-slate-600">{{ stat.title }}</p>
            </div>
            <div class="flex items-baseline gap-2">
              <h4 class="text-2xl font-black text-slate-800">{{ stat.value }}</h4>
              <span class="text-xs font-medium text-slate-400">{{ stat.change }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div class="lg:col-span-2 bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Activity class="w-4 h-4 text-emerald-600" />
              สถิติคำขอเบิกพัสดุรายเดือน <span class="text-xs font-medium text-slate-400">(ปีงบประมาณ {{ fiscalYearBE
                }})</span>
            </h4>
            <div class="h-64">
              <Bar :data="consChartData" :options="barOptions" />
            </div>
          </div>

          <div class="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div class="px-5 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h4 class="font-bold text-slate-700 flex items-center gap-2">
                <Boxes class="w-4 h-4 text-amber-500" />
                อันดับพัสดุที่มียอดเบิกมากที่สุด
              </h4>
            </div>
            <div class="flex-1 p-0 overflow-y-auto max-h-[17rem]">
              <div v-if="!consData.topItems?.length"
                class="h-full flex items-center justify-center text-slate-400 text-sm py-8 italic">
                ยังไม่มีข้อมูลการเบิกพัสดุ
              </div>
              <div v-else class="divide-y divide-slate-100">
                <div v-for="(item, idx) in consData.topItems" :key="item.id"
                  class="px-5 py-3 hover:bg-slate-100/50 transition-colors flex items-center gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 truncate">{{ item.name }}</p>
                    <p class="text-xs text-slate-500">รหัสพัสดุ : {{ item.sku }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="block text-sm font-black text-emerald-700">{{ item.totalRequested }}</span>
                    <span class="text-[10px] text-slate-400">{{ item.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table -->
      <div v-if="canSeeDetails" class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mt-8">
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
              <tr
                class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
                <th class="px-6 py-3.5">กิจกรรม</th>
                <th class="px-6 py-3.5">รายการ/เป้าหมาย</th>
                <th class="px-6 py-3.5">ผู้ดำเนินการ</th>
                <th class="px-6 py-3.5">เวลา</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="activity in recentActivities" :key="activity.id"
                class="group hover:bg-emerald-50/60 transition-colors">
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

    </template>
  </div>
</template>

<style>
/* ใช้กับกล่องตารางที่เลื่อนภายในตัวเอง (เช่นตอนข้อมูลเยอะ) ให้เลื่อนได้ปกติแต่ไม่โชว์แถบเลื่อน */
.no-scrollbar {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE / Edge เก่า */
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Edge (Chromium) */
}
</style>