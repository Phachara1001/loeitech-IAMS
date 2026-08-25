<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  History,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  Database,
  Clock,
  User,
  Network,
  X,
  FileCode2,
  Loader2,
  LogIn
} from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const router = useRouter()
const toast = useToast()

// สิทธิ์การเข้าถึง: หน้านี้ใช้ได้เฉพาะ Admin เท่านั้น (เชื่อมกับระบบ login จริง)
const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')
const isAdmin = computed(() => currentRole.value === 'admin')

// --- Helper: Format DATETIME เป็นภาษาไทย ---
const formatThaiDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// --- Filters & States ---
const searchQuery = ref('')
const selectedAction = ref('ALL')
const selectedTable = ref('ALL')

// --- ข้อมูลจริงจาก backend ---
const activityLogs = ref([])
const isLoading = ref(true)

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
  if (error.response?.status === 403) {
    toast.error('คุณไม่มีสิทธิ์ดูข้อมูลนี้')
    return true
  }
  return false
}

async function fetchLogs() {
  isLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/activity-logs`, { headers: authHeaders() })
    activityLogs.value = response.data.data
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) fetchLogs()
})

// --- ป้ายกำกับ/สีของแต่ละประเภทคำสั่ง ---
const ACTION_LABEL = {
  INSERT: 'เพิ่มข้อมูล',
  UPDATE: 'แก้ไขข้อมูล',
  DELETE: 'ลบข้อมูล',
  LOGIN: 'เข้าสู่ระบบ'
}

const getActionBadgeClass = (action) => {
  switch (action) {
    case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'LOGIN': return 'bg-violet-50 text-violet-700 border-violet-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

// ตารางที่เกี่ยวข้อง (entityType) ตามที่ backend บันทึกจริง
const ENTITY_TYPE_OPTIONS = [
  { value: 'ASSET', label: 'ครุภัณฑ์' },
  { value: 'ITEM', label: 'พัสดุสิ้นเปลือง' },
  { value: 'REQUISITION', label: 'คำขอเบิกพัสดุ' },
  { value: 'BORROW_TRANSACTION', label: 'ยืม-คืนพัสดุ/ครุภัณฑ์' },
  { value: 'REPAIR_REQUEST', label: 'แจ้งซ่อม/บำรุงรักษา' },
  { value: 'DEPARTMENT', label: 'หน่วยงาน/ฝ่าย' },
  { value: 'LOCATION', label: 'อาคาร/ห้อง' },
  { value: 'USER', label: 'ผู้ใช้งาน' }
]
const entityTypeLabel = (type) => ENTITY_TYPE_OPTIONS.find((t) => t.value === type)?.label || type

const filteredLogs = computed(() => {
  return activityLogs.value.filter((log) => {
    const matchesSearch =
      (log.userName || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (log.entityType || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (log.ipAddress || '').includes(searchQuery.value) ||
      (log.details || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesAction = selectedAction.value === 'ALL' || log.action === selectedAction.value
    const matchesTable = selectedTable.value === 'ALL' || log.entityType === selectedTable.value

    return matchesSearch && matchesAction && matchesTable
  })
})

const isModalOpen = ref(false)
const selectedLogData = ref(null)

const openJsonModal = (log) => {
  selectedLogData.value = log
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedLogData.value = null
}
</script>

<template>
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-white text-slate-800 space-y-6">

    <div class="relative z-10 space-y-6">

      <!-- Access Denied State -->
      <div v-if="!isAdmin" class="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div class="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert class="w-7 h-7" />
        </div>
        <h2 class="text-lg font-bold text-slate-900 mb-1">ไม่มีสิทธิ์เข้าถึงข้อมูล</h2>
        <p class="text-slate-500 text-sm">
          หน้านี้อนุญาตให้เฉพาะผู้ดูแลระบบ (Admin) เข้าถึงเพื่อตรวจสอบประวัติการใช้งานระบบเท่านั้น
        </p>
      </div>

      <!-- Main Activity Log UI -->
      <template v-else>

        <!-- Header Banner -->
        <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-md">
          <div class="relative z-10 p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
                <History class="w-7 h-7" />
              </div>
              <div>
                <h1 class="text-xl sm:text-2xl font-bold text-white">ประวัติการใช้งานระบบ (Activity Logs)</h1>
                <p class="text-emerald-100/80 text-sm mt-1">ตรวจสอบและติดตามการทำรายการข้อมูลย้อนหลังทั้งหมดในระบบ</p>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-black/20 border border-white/10 px-4 py-2.5 rounded-xl shrink-0">
              <Loader2 v-if="isLoading" class="w-4 h-4 text-emerald-300 animate-spin" />
              <span class="text-xs text-emerald-100/80">ทั้งหมด <strong class="text-white">{{ activityLogs.length }}</strong> รายการ</span>
            </div>
          </div>
        </div>

        <!-- Search Bar & Filters -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

          <div class="relative w-full md:w-80">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้, รายละเอียด หรือ IP..."
              class="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Filter class="w-4 h-4 text-slate-400 shrink-0" />
              <select
                v-model="selectedAction"
                class="w-full sm:w-auto text-sm font-medium bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">ประเภทคำสั่งทั้งหมด</option>
                <option value="INSERT">เพิ่มข้อมูล (INSERT)</option>
                <option value="UPDATE">แก้ไขข้อมูล (UPDATE)</option>
                <option value="DELETE">ลบข้อมูล (DELETE)</option>
                <option value="LOGIN">เข้าสู่ระบบ (LOGIN)</option>
              </select>
            </div>

            <div class="w-full sm:w-auto">
              <select
                v-model="selectedTable"
                class="w-full sm:w-auto text-sm font-medium bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">ตารางทั้งหมด</option>
                <option v-for="t in ENTITY_TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th class="py-3.5 px-6">วัน-เวลา</th>
                  <th class="py-3.5 px-6">ผู้ทำการรายการ</th>
                  <th class="py-3.5 px-6 text-center">ประเภทคำสั่ง</th>
                  <th class="py-3.5 px-6 text-center">ตารางที่เกี่ยวข้อง</th>
                  <th class="py-3.5 px-6 text-center">IP ADDRESS</th>
                  <th class="py-3.5 px-6 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 font-medium">

                <tr
                  v-for="log in filteredLogs"
                  :key="log.id"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <td class="py-3.5 px-6 text-slate-600 text-xs">
                    <div class="flex items-center gap-2">
                      <Clock class="w-3.5 h-3.5 text-slate-400" />
                      <span>{{ formatThaiDateTime(log.createdAt) }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-6 font-bold text-slate-900 text-sm">
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        <User class="w-3.5 h-3.5" />
                      </div>
                      <span>{{ log.userName }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-6 text-center">
                    <div class="flex justify-center">
                      <span
                        :class="[
                          'inline-flex items-center justify-center min-w-[110px] px-3 py-1 text-xs font-bold rounded-full border',
                          getActionBadgeClass(log.action)
                        ]"
                      >
                        {{ ACTION_LABEL[log.action] || log.action }}
                      </span>
                    </div>
                  </td>

                  <td class="py-3.5 px-6">
                    <div class="flex justify-center">
                      <span class="inline-flex items-center gap-1.5 min-w-[110px] px-3 py-1 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-mono font-bold justify-center">
                        <Database class="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{{ entityTypeLabel(log.entityType) }}</span>
                      </span>
                    </div>
                  </td>

                  <td class="py-3.5 px-6 text-slate-600 font-mono text-xs text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <Network class="w-3.5 h-3.5 text-slate-400" />
                      <span>{{ log.ipAddress || '-' }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-6 text-center">
                    <button
                      v-if="log.oldValue || log.newValue"
                      @click="openJsonModal(log)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      <span>เปรียบเทียบค่า (JSON)</span>
                    </button>
                    <span v-else class="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <LogIn v-if="log.action === 'LOGIN'" class="w-3.5 h-3.5" />
                      {{ log.details || '-' }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!isLoading && filteredLogs.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400 font-medium">
                    <History class="w-7 h-7 mx-auto mb-2 opacity-40" />
                    <p class="text-sm">ไม่พบข้อมูลประวัติการใช้งานที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>

                <tr v-if="isLoading">
                  <td colspan="6" class="py-12 text-center text-slate-400 font-medium">
                    <Loader2 class="w-6 h-6 mx-auto mb-2 animate-spin text-[#065f46]" />
                    <p class="text-sm">กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

      </template>

    </div>

    <!-- Modal Inspection -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

        <div class="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
            <FileCode2 class="w-5 h-5 text-emerald-600" />
            <h3>รายละเอียดการเปลี่ยนแปลงข้อมูล (Log ID: #{{ selectedLogData?.id }})</h3>
          </div>
          <button
            @click="closeModal"
            class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-7 overflow-y-auto space-y-5 text-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">ผู้ทำรายการ:</span>
              <span class="font-bold text-slate-900 text-sm">{{ selectedLogData?.userName }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">คำสั่ง:</span>
              <span class="font-bold text-slate-900 text-sm">{{ ACTION_LABEL[selectedLogData?.action] || selectedLogData?.action }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">ตาราง:</span>
              <span class="font-bold text-slate-900 font-mono text-sm">{{ entityTypeLabel(selectedLogData?.entityType) }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">เวลา:</span>
              <span class="font-bold text-slate-900 text-sm">{{ formatThaiDateTime(selectedLogData?.createdAt) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <span class="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                ค่าเดิม (Old Value)
              </span>
              <div class="bg-slate-900 text-rose-300 font-mono text-xs p-4 rounded-2xl overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.oldValue">{{ JSON.stringify(selectedLogData.oldValue, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลเดิม -
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                ค่าใหม่ (New Value)
              </span>
              <div class="bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-2xl overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.newValue">{{ JSON.stringify(selectedLogData.newValue, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลใหม่ -
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-7 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            @click="closeModal"
            class="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>

  </div>
</template>