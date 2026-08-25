<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  History,
  ArrowLeft,
  MapPin,
  UserCheck,
  PackageCheck,
  Wrench,
  Calendar,
  FileText,
  X,
  Banknote,
  ArrowRightLeft,
  Sparkles,
  Check,
  Loader2
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'
import axios from 'axios'
import { API_BASE } from '../config/api'

const toast = useToast()

function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

// --- View State ---
const currentView = ref('LIST')

// --- Helper: Format DATETIME เป็นภาษาไทย ---
// ระบุ timeZone: 'Asia/Bangkok' ตรง ๆ เพื่อกันปัญหาโชว์เวลาเพี้ยนตอนเครื่อง/เบราว์เซอร์
// ตั้ง system timezone เป็น UTC หรือ timezone อื่นที่ไม่ใช่ไทย (ไม่งั้นเวลาจะเลื่อนไป ±7 ชม.)
const formatThaiDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// --- User Context ---
const userObj = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
const currentRoleStr = (localStorage.getItem('tcaims_role') || 'user').toLowerCase()
const currentUser = ref({
  id: userObj.id || 101,
  name: userObj.name || 'ผู้ใช้งานระบบ',
  role: currentRoleStr === 'admin' ? 'Admin' : currentRoleStr === 'staff' ? 'Staff' : 'User'
})

// หน่วยงานจริงของผู้ใช้ที่ login อยู่ (ดึงจาก backend เพราะ localStorage ไม่ได้เก็บข้อมูลนี้ไว้)
// ใช้เป็นเกณฑ์ "ครุภัณฑ์ที่ตนรับผิดชอบ" สำหรับ role User
const myDepartment = ref('')
const isProfileLoaded = ref(false)

async function fetchMyProfile() {
  try {
    const response = await axios.get(`${API_BASE}/users/me`, { headers: authHeaders() })
    myDepartment.value = response.data.data?.department?.name || ''
  } catch (err) {
    // ถ้าดึงไม่สำเร็จ ปล่อยว่างไว้ (User จะไม่เห็นรายการใดเลยตามค่า default ที่ปลอดภัยไว้ก่อน)
  } finally {
    isProfileLoaded.value = true
  }
}

// --- Master Asset List Database ---
const assets = ref([])
const isLoading = ref(false)
const isTimelineLoading = ref(false)

async function fetchAssets() {
  isLoading.value = true
  try {
    const data = await inventoryApi.getAssets()
    // Map backend schema to format expected by view
    assets.value = data.map(a => ({
      id: a.id,
      seq: a.seq,
      name: a.name,
      code: a.referenceCode || '-',
      serial: a.serialNumber || '-',
      category: a.category,
      ownerId: a.department,
      ownerName: a.department || 'ไม่ระบุ',
      department: a.department || 'ไม่ระบุ',
      currentLocation: a.location?.name || 'ไม่ระบุสถานที่',
      status: a.status,
      image: a.image
    }))
  } catch (err) {
    toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้: ' + err.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchMyProfile()
  await fetchAssets()
})

// --- Search & Filter State ---
const searchQuery = ref('')
const statusFilter = ref('')

const filteredAssets = computed(() => {
  return assets.value.filter(asset => {
    // User เห็นเฉพาะครุภัณฑ์ของหน่วยงานตัวเอง (ใช้เป็นตัวแทน "ที่ตนรับผิดชอบ" เพราะระบบยังผูกความรับผิดชอบระดับหน่วยงาน ไม่ใช่รายบุคคล)
    if (currentUser.value.role === 'User') {
      if (!myDepartment.value) return false // ยังไม่รู้หน่วยงานของผู้ใช้ ไม่แสดงอะไรไว้ก่อน (ปลอดภัยไว้ก่อน)
      if (asset.department !== myDepartment.value) return false
    }

    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      asset.seq.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = statusFilter.value === '' || asset.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

const selectedAssetId = ref(null)
const timelineLogs = ref([])

const currentAsset = computed(() => {
  return assets.value.find(a => a.id === selectedAssetId.value) || null
})

const viewAssetTimeline = async (asset) => {
  selectedAssetId.value = asset.id
  currentView.value = 'TIMELINE'
  
  isTimelineLoading.value = true
  try {
    const data = await inventoryApi.getAssetTimeline(asset.id)
    // data = { assetStatus, timeline }
    timelineLogs.value = data.timeline

    // อัปเดตสถานะ asset ในรายการทันที แบบ real-time จากฐานข้อมูล
    const idx = assets.value.findIndex(a => a.id === asset.id)
    if (idx !== -1 && data.assetStatus) {
      assets.value[idx].status = data.assetStatus
    }
  } catch (err) {
    toast.error('ไม่สามารถดึงข้อมูลไทม์ไลน์ได้: ' + err.message)
  } finally {
    isTimelineLoading.value = false
  }
}

const activeTimeline = computed(() => {
  return timelineLogs.value
})

const repairStats = computed(() => {
  const repairs = activeTimeline.value.filter(l => l.type === 'REPAIR' || l.type === 'MAINTENANCE')
  const totalCost = repairs.reduce((sum, item) => sum + item.cost, 0)
  const moveCount = activeTimeline.value.filter(l => l.type === 'MOVE').length
  return { repairCount: repairs.length, moveCount, totalCost }
})

const getStatusBadge = (status) => {
  switch (status) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Repaired': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Broken': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Scrapped': return 'bg-slate-100 text-slate-800 border-slate-300'
    default: return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'Active': return 'ใช้งานปกติ'
    case 'Repaired': return 'ส่งซ่อม'
    case 'Broken': return 'ชำรุด'
    case 'Scrapped': return 'แทงจำหน่าย'
    default: return status
  }
}

const getTypeBadge = (type) => {
  switch (type) {
    case 'RECEIVE':
      return { label: 'ตรวจรับเข้า', class: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: PackageCheck }
    case 'MOVE':
      return { label: 'ย้ายสถานที่ / เปลี่ยนผู้ดูแล', class: 'bg-blue-100 text-blue-800 border-blue-300', icon: MapPin }
    case 'REPAIR':
      return { label: 'ส่งซ่อมแซม', class: 'bg-rose-100 text-rose-800 border-rose-300', icon: Wrench }
    case 'MAINTENANCE':
      return { label: 'บำรุงรักษา', class: 'bg-amber-100 text-amber-800 border-amber-300', icon: History }
    default:
      return { label: 'บันทึกกิจกรรม', class: 'bg-slate-100 text-slate-800 border-slate-300', icon: FileText }
  }
}

const isLogModalOpen = ref(false)
const newLog = ref({
  type: 'MOVE',
  title: '',
  location: '',
  responsiblePerson: '',
  details: '',
  cost: 0
})

const handleAddLog = () => {
  if (!newLog.value.title) return
  
  const now = new Date()
  const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  timelineLogs.value.push({
    id: Date.now(),
    assetId: selectedAssetId.value,
    type: newLog.value.type,
    title: newLog.value.title,
    date: formattedNow,
    operator: currentUser.value.name,
    details: newLog.value.details,
    location: newLog.value.location || currentAsset.value?.currentLocation,
    responsiblePerson: newLog.value.responsiblePerson || currentAsset.value?.ownerName,
    cost: Number(newLog.value.cost) || 0
  })

  if (newLog.value.type === 'MOVE' && newLog.value.location && currentAsset.value) {
    currentAsset.value.currentLocation = newLog.value.location
    if (newLog.value.responsiblePerson) {
      currentAsset.value.ownerName = newLog.value.responsiblePerson
    }
  }

  isLogModalOpen.value = false
  newLog.value = { type: 'MOVE', title: '', location: '', responsiblePerson: '', details: '', cost: 0 }
}
</script>

<template>
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-slate-100 text-slate-800 space-y-6">

    <!-- Global Top Header Bar -->
    <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl">
      <!-- Background Mesh Gradient -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]"></div>
        <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]"></div>
        <div class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]"></div>
      </div>

      <div class="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md">
            <History class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">ระบบบริหารและติดตามครุภัณฑ์</h1>
            <p class="text-emerald-100/80 text-sm sm:text-base mt-1">จัดการทะเบียนครุภัณฑ์ และติดตามไทม์ไลน์ประวัติการใช้งานอย่างแม่นยำ</p>
          </div>
        </div>

      </div>
    </div>

    <!-- VIEW 1: ASSET LIST VIEW -->
    <div v-if="currentView === 'LIST'" class="space-y-6">

      <!-- Main Data Table Container -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <!-- Search & Filter Toolbar -->
        <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
          <div class="relative w-full sm:w-80">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="ค้นหาชื่อ, เลขลำดับ, ทะเบียน..."
              class="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" 
            />
          </div>

          <div class="flex items-center space-x-3">
            <div class="relative">
              <select 
                v-model="statusFilter"
                class="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">ทุกสถานะ</option>
                <option value="Active">ใช้งานปกติ</option>
                <option value="Repaired">ส่งซ่อม</option>
                <option value="Broken">ชำรุด</option>
                <option value="Scrapped">แทงจำหน่าย</option>
              </select>
              <Filter class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th class="px-6 py-4 text-center">รูปภาพ</th>
                <th class="px-6 py-4">เลขลำดับครุภัณฑ์</th>
                <th class="px-6 py-4">ชื่อพัสดุ / เลขพัสดุหลัก</th>
                <th class="px-6 py-4">เลขทะเบียน / Serial</th>
                <th class="px-6 py-4">สถานที่ / แผนก</th>
                <th class="px-6 py-4">ผู้ดูแล</th>
                <th class="px-6 py-4">สถานะ</th>
                <th class="px-6 py-4 text-center">ดูประวัติ / จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-medium">
              <tr v-for="asset in filteredAssets" :key="asset.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 text-center">
                  <div class="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-100 mx-auto">
                    <img v-if="asset.image" :src="asset.image" class="w-full h-full object-cover" />
                    <ImageIcon v-else class="w-5 h-5 text-slate-400" />
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="font-bold text-slate-800">{{ asset.seq }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="font-extrabold text-slate-900 text-base">{{ asset.name }}</div>
                </td>
                <td class="px-6 py-4 text-slate-600 font-mono">{{ asset.serial }}</td>
                <td class="px-6 py-4 text-slate-700">
                  <div class="font-bold">{{ asset.currentLocation }}</div>
                </td>
                <td class="px-6 py-4 text-slate-700">{{ asset.ownerName }}</td>
                <td class="px-6 py-4">
                  <span :class="['px-3 py-1 text-xs font-bold rounded-full border inline-block', getStatusBadge(asset.status)]">
                    {{ getStatusText(asset.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <button 
                      @click="viewAssetTimeline(asset)"
                      class="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white rounded-xl font-bold text-xs flex items-center transition-all cursor-pointer border border-emerald-200 shadow-sm"
                      title="ดูประวัติไทม์ไลน์"
                    >
                      <History class="w-4 h-4 mr-1.5" />
                      ดูไทม์ไลน์
                    </button>

                    <button v-if="currentUser.role !== 'User'" class="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" title="แก้ไข">
                      <Edit class="w-4 h-4" />
                    </button>
                    <button v-if="currentUser.role === 'Admin'" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredAssets.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                  ไม่พบรายการครุภัณฑ์ที่ตรงกับการค้นหา
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- VIEW 2: TIMELINE VIEW -->
    <div v-else-if="currentView === 'TIMELINE'" class="space-y-6">
      
      <!-- Back Button Bar -->
      <div class="flex items-center justify-between">
        <button 
          @click="currentView = 'LIST'"
          class="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold rounded-2xl border border-slate-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft class="w-5 h-5 text-emerald-800 stroke-[3]" />
          <span>กลับหน้าตารางรายการครุภัณฑ์</span>
        </button>

        <div v-if="currentUser.role === 'Admin' || currentUser.role === 'Staff'">
          <button 
            @click="isLogModalOpen = true"
            class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Plus class="w-5 h-5 stroke-[3]" />
            <span>บันทึกกิจกรรม / ส่งซ่อม</span>
          </button>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isTimelineLoading" class="bg-white p-16 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400">
        <Loader2 class="w-12 h-12 mx-auto mb-3 animate-spin text-emerald-800" />
        <p class="text-lg font-medium">กำลังโหลดประวัติกิจกรรมและไทม์ไลน์ครุภัณฑ์...</p>
      </div>

      <template v-else>
        <!-- Asset Summary Banner -->
        <div v-if="currentAsset" class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-slate-400 font-mono">ID: {{ currentAsset.id }}</span>
                <span :class="['px-2.5 py-0.5 text-xs font-extrabold rounded-full border', getStatusBadge(currentAsset.status)]">
                  {{ getStatusText(currentAsset.status) }}
                </span>
              </div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900">{{ currentAsset.name }}</h2>
            </div>
            <div class="text-slate-500 font-medium text-sm">
              หมวดหมู่: <strong class="text-slate-800">{{ currentAsset.category }}</strong>
            </div>
          </div>

          <!-- Summary Grid Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span class="text-slate-500 font-medium text-sm block">รหัสซีเรียล / Serial Number</span>
              <span class="font-mono font-bold text-slate-900 text-lg md:text-xl">{{ currentAsset.serial }}</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span class="text-slate-500 font-medium text-sm block">สถานที่ติดตั้งปัจจุบัน</span>
              <span class="font-bold text-slate-900 text-lg flex items-center gap-1.5 mt-0.5">
                <MapPin class="w-5 h-5 text-rose-500 shrink-0" />
                {{ currentAsset.currentLocation }}
              </span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span class="text-slate-500 font-medium text-sm block">ผู้ดูแลรับผิดชอบ</span>
              <span class="font-bold text-slate-900 text-lg flex items-center gap-1.5 mt-0.5">
                <UserCheck class="w-5 h-5 text-blue-500 shrink-0" />
                {{ currentAsset.ownerName }}
              </span>
            </div>
            <div class="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
              <span class="text-emerald-800 font-medium text-sm block">ยอดซ่อมบำรุงสะสมรวม</span>
              <span class="font-extrabold text-emerald-800 text-2xl">฿{{ repairStats.totalCost.toLocaleString() }} บาท</span>
            </div>
          </div>
        </div>

        <!-- Timeline Logs List -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
          <h3 class="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2.5">
            <Calendar class="w-6 h-6 text-emerald-800" />
            ประวัติและลำดับเหตุการณ์ย้อนหลัง (Timeline)
          </h3>

          <div v-if="activeTimeline.length > 0" class="relative border-l-4 border-slate-200 ml-4 md:ml-8 space-y-8">
            
            <div v-for="item in activeTimeline" :key="item.id" class="relative pl-8 md:pl-10">
              <!-- Timeline Icon -->
              <div :class="['absolute -left-[22px] top-0 w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-sm', getTypeBadge(item.type).class]">
                <component :is="getTypeBadge(item.type).icon" class="w-5 h-5" />
              </div>

              <!-- Event Card -->
              <div class="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all space-y-4">
                
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div class="flex items-center gap-3 flex-wrap">
                    <span :class="['px-3 py-1 rounded-lg text-sm font-bold border', getTypeBadge(item.type).class]">
                      {{ getTypeBadge(item.type).label }}
                    </span>
                    <h4 class="font-extrabold text-slate-900 text-lg md:text-xl">{{ item.title }}</h4>
                  </div>
                  <!-- Thai Formatted DATETIME -->
                  <span class="text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Calendar class="w-4 h-4 text-slate-400" />
                    {{ formatThaiDateTime(item.date) }}
                  </span>
                </div>

                <p class="text-slate-800 text-base md:text-lg leading-relaxed font-medium">
                  {{ item.details }}
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-base pt-2 bg-white p-4 rounded-xl border border-slate-200/60">
                  <div class="flex items-center gap-1.5">
                    <MapPin class="w-4 h-4 text-slate-400 shrink-0" />
                    <span>สถานที่: <strong class="text-slate-900">{{ item.location }}</strong></span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UserCheck class="w-4 h-4 text-slate-400 shrink-0" />
                    <span>ผู้ดูแล: <strong class="text-slate-900">{{ item.responsiblePerson }}</strong></span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Banknote class="w-4 h-4 text-slate-400 shrink-0" />
                    <span>ค่าใช้จ่าย: 
                      <strong :class="item.cost > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-800'">
                        {{ item.cost > 0 ? '฿' + item.cost.toLocaleString() + ' บาท' : 'ไม่มี' }}
                      </strong>
                    </span>
                  </div>
                </div>

                <div class="text-sm text-slate-400 text-right italic font-medium">
                  บันทึกข้อมูลโดย: {{ item.operator }}
                </div>

              </div>
            </div>

          </div>

          <div v-else class="py-12 text-center text-slate-400">
            <History class="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p class="text-lg font-medium">ไม่พบประวัติกิจกรรมของครุภัณฑ์ชิ้นนี้</p>
          </div>
        </div>
      </template>

    </div>

    <!-- MODAL: เพิ่มบันทึกกิจกรรมไทม์ไลน์ -->
    <div v-if="isLogModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/80">
          <h3 class="font-extrabold text-slate-900 text-2xl flex items-center gap-3">
            <Plus class="w-8 h-8 text-emerald-800 stroke-[3]" />
            บันทึกประวัติกิจกรรมครุภัณฑ์
          </h3>
          <button @click="isLogModalOpen = false" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors cursor-pointer">
            <X class="w-8 h-8" />
          </button>
        </div>

        <form @submit.prevent="handleAddLog" class="p-8 overflow-y-auto space-y-6 text-base md:text-lg">
          
          <div>
            <label class="block font-extrabold text-slate-900 mb-2">1. เลือกประเภทกิจกรรม:</label>
            <select 
              v-model="newLog.type" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-bold focus:border-emerald-600 bg-white cursor-pointer"
            >
              <option value="MOVE">ย้ายสถานที่ / เปลี่ยนผู้ดูแล</option>
              <option value="REPAIR">ส่งซ่อมแซม (กรณีเครื่องชำรุด)</option>
              <option value="MAINTENANCE">ทำความสะอาด / บำรุงรักษาประจำปี</option>
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">2. ชื่อกิจกรรม / อาการชำรุด:</label>
            <input 
              v-model="newLog.title" 
              type="text" 
              required
              placeholder="เช่น ย้ายไปห้อง 501 หรือ เปิดเครื่องไม่ติด" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-extrabold text-slate-900 mb-2">สถานที่ใหม่ (ถ้ามี):</label>
              <input 
                v-model="newLog.location" 
                type="text" 
                :placeholder="currentAsset?.currentLocation" 
                class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
              />
            </div>

            <div>
              <label class="block font-extrabold text-slate-900 mb-2">ผู้ดูแลใหม่ (ถ้ามี):</label>
              <input 
                v-model="newLog.responsiblePerson" 
                type="text" 
                :placeholder="currentAsset?.ownerName" 
                class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">3. ค่าใช้จ่ายในการซ่อม (บาท):</label>
            <input 
              v-model="newLog.cost" 
              type="number" 
              min="0"
              placeholder="0 (ถ้าไม่มีให้ใส่ 0)" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-bold focus:border-emerald-600"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">4. รายละเอียดเพิ่มเติม / หมายเหตุ:</label>
            <textarea 
              v-model="newLog.details" 
              rows="3" 
              placeholder="พิมพ์รายละเอียดเพิ่มเติมตรงนี้..."
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
            ></textarea>
          </div>

          <div class="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-200">
            <button 
              type="button" 
              @click="isLogModalOpen = false" 
              class="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-lg cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              class="px-8 py-4 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-lg shadow-md cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
            >
              <Check class="w-5 h-5 stroke-[3]" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>