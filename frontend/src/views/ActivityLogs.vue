<script setup>
import { ref, computed } from 'vue'
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
  FileCode2
} from 'lucide-vue-next'

// --- Mock User & Role ---
const currentUser = ref({ name: 'สมชาย ใจดี (Admin)', role: 'Admin' })
const isAdmin = computed(() => currentUser.value.role === 'Admin')

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

// --- Original Table Data ---
const activityLogs = ref([
  {
    id: 1,
    user_name: 'สมชาย ใจดี (Admin)',
    action_type: 'UPDATE',
    action_th: 'แก้ไขข้อมูล',
    table_name: 'items',
    ip_address: '192.168.1.45',
    created_at: '2026-07-21 13:40:12',
    old_value: { item_code: 'IT-001', item_name: 'กระดาษ A4 80gsm', stock_qty: 15, unit: 'รีม' },
    new_value: { item_code: 'IT-001', item_name: 'กระดาษ A4 80gsm', stock_qty: 50, unit: 'รีม' }
  },
  {
    id: 2,
    user_name: 'วิภาดา พัสดุ (Staff)',
    action_type: 'INSERT',
    action_th: 'เพิ่มข้อมูล',
    table_name: 'assets',
    ip_address: '192.168.1.88',
    created_at: '2026-07-21 11:15:05',
    old_value: null,
    new_value: { asset_code: 'DUR-69-004', asset_name: 'เครื่องคอมพิวเตอร์ All-in-One', department_id: 2, status: 'Active' }
  },
  {
    id: 3,
    user_name: 'สมชาย ใจดี (Admin)',
    action_type: 'DELETE',
    action_th: 'ลบข้อมูล',
    table_name: 'users',
    ip_address: '192.168.1.45',
    created_at: '2026-07-20 16:30:00',
    old_value: { id: 9, username: 'temp_user', role: 'User', status: 'Inactive' },
    new_value: null
  },
  {
    id: 4,
    user_name: 'ประสิทธิ์ งานช่าง (Staff)',
    action_type: 'UPDATE',
    action_th: 'แก้ไขข้อมูล',
    table_name: 'assets',
    ip_address: '192.168.1.102',
    created_at: '2026-07-20 09:20:44',
    old_value: { asset_code: 'DUR-68-012', status: 'Active' },
    new_value: { asset_code: 'DUR-68-012', status: 'Repair' }
  },
  {
    id: 5,
    user_name: 'วิภาดา พัสดุ (Staff)',
    action_type: 'INSERT',
    action_th: 'เพิ่มข้อมูล',
    table_name: 'stock_transactions',
    ip_address: '192.168.1.88',
    created_at: '2026-07-19 14:05:10',
    old_value: null,
    new_value: { transaction_type: 'IN', item_id: 1, quantity: 35, created_by: 2 }
  }
])

const getActionBadgeClass = (action) => {
  switch (action) {
    case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const filteredLogs = computed(() => {
  return activityLogs.value.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.ip_address.includes(searchQuery.value)
    
    const matchesAction = selectedAction.value === 'ALL' || log.action_type === selectedAction.value
    const matchesTable = selectedTable.value === 'ALL' || log.table_name === selectedTable.value

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
    
    <!-- UI Components -->
    <div class="relative z-10 space-y-6">

      <!-- Access Denied State -->
      <div v-if="!isAdmin" class="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div class="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-1">ไม่มีสิทธิ์เข้าถึงข้อมูล</h2>
        <p class="text-slate-500 text-sm mb-6">
          หน้านี้อนุญาตให้เฉพาะผู้ดูแลระบบ (Admin) เข้าถึงเพื่อตรวจสอบประวัติการใช้งานระบบเท่านั้น
        </p>
        <button 
          @click="currentUser.role = 'Admin'" 
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          สลับสิทธิ์เป็น Admin (เพื่อทดสอบ)
        </button>
      </div>

      <!-- Main Activity Log UI -->
      <template v-else>
        
        <!-- Header Banner -->
        <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-md">
          <div class="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
                <History class="w-8 h-8" />
              </div>
              <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-white">ประวัติการใช้งานระบบ (Activity Logs)</h1>
                <p class="text-emerald-100/80 text-sm sm:text-base mt-1">ตรวจสอบและติดตามการทำรายการข้อมูลย้อนหลังทั้งหมดในระบบ</p>
              </div>
            </div>

            <!-- Dev Role Switcher Button -->
            <div class="flex items-center gap-3 bg-black/20 border border-white/10 p-2.5 rounded-xl shrink-0">
              <span class="text-xs sm:text-sm text-emerald-100/80 font-medium">สิทธิ์ปัจจุบัน: <strong class="text-white">{{ currentUser.role }}</strong></span>
              <button 
                @click="currentUser.role = 'Staff'" 
                class="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg font-semibold transition cursor-pointer"
              >
                สลับเป็น Staff
              </button>
            </div>
          </div>
        </div>

        <!-- Search Bar & Filters -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <!-- Search Box -->
          <div class="relative w-full md:w-80">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="ค้นหาชื่อผู้ใช้, ตาราง หรือ IP..."
              class="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <!-- Filters -->
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
              </select>
            </div>

            <div class="w-full sm:w-auto">
              <select 
                v-model="selectedTable"
                class="w-full sm:w-auto text-sm font-medium bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">ตารางทั้งหมด</option>
                <option value="items">items</option>
                <option value="assets">assets</option>
                <option value="stock_transactions">stock_transactions</option>
                <option value="users">users</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th class="py-4 px-6">วัน-เวลา</th>
                  <th class="py-4 px-6">ผู้ทำการรายการ</th>
                  <th class="py-4 px-6 text-center">ประเภทคำสั่ง</th>
                  <th class="py-4 px-6 text-center">ตารางที่เกี่ยวข้อง</th>
                  <th class="py-4 px-6 text-center">IP ADDRESS</th>
                  <th class="py-4 px-6 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 font-medium">
                
                <tr 
                  v-for="log in filteredLogs" 
                  :key="log.id"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <!-- Timestamp Format ภาษาไทย -->
                  <td class="py-4 px-6 text-slate-600 font-sans">
                    <div class="flex items-center gap-2">
                      <Clock class="w-4 h-4 text-slate-400" />
                      <span>{{ formatThaiDateTime(log.created_at) }}</span>
                    </div>
                  </td>

                  <!-- User -->
                  <td class="py-4 px-6 font-extrabold text-slate-900 text-base">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        <User class="w-4 h-4" />
                      </div>
                      <span>{{ log.user_name }}</span>
                    </div>
                  </td>

                  <!-- Action Badge -->
                  <td class="py-4 px-6 text-center">
                    <div class="flex justify-center">
                      <span 
                        :class="[
                          'inline-flex items-center justify-center min-w-[120px] px-3.5 py-1.5 text-xs font-extrabold rounded-full border',
                          getActionBadgeClass(log.action_type)
                        ]"
                      >
                        {{ log.action_th }}
                      </span>
                    </div>
                  </td>

                  <!-- Table Badge -->
                  <td class="py-4 px-6">
                    <div class="flex justify-center">
                      <span class="inline-flex items-center gap-2 min-w-[130px] px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-mono font-bold justify-center">
                        <Database class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{{ log.table_name }}</span>
                      </span>
                    </div>
                  </td>

                  <!-- IP Address -->
                  <td class="py-4 px-6 text-slate-600 font-mono text-xs text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <Network class="w-3.5 h-3.5 text-slate-400" />
                      <span>{{ log.ip_address }}</span>
                    </div>
                  </td>

                  <!-- Detail Button -->
                  <td class="py-4 px-6 text-center">
                    <button 
                      @click="openJsonModal(log)"
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      <span>เปรียบเทียบค่า (JSON)</span>
                    </button>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="filteredLogs.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400 font-medium">
                    <History class="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p class="text-sm">ไม่พบข้อมูลประวัติการใช้งานที่ตรงตามเงื่อนไข</p>
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
        
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-3 text-slate-900 font-extrabold text-xl">
            <FileCode2 class="w-6 h-6 text-emerald-600" />
            <h3>รายละเอียดการเปลี่ยนแปลงข้อมูล (Log ID: #{{ selectedLogData?.id }})</h3>
          </div>
          <button 
            @click="closeModal" 
            class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="p-8 overflow-y-auto space-y-6 text-base">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">ผู้ทำรายการ:</span>
              <span class="font-extrabold text-slate-900 text-sm">{{ selectedLogData?.user_name }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">คำสั่ง:</span>
              <span class="font-extrabold text-slate-900 text-sm">{{ selectedLogData?.action_th }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">ตาราง:</span>
              <span class="font-extrabold text-slate-900 font-mono text-sm">{{ selectedLogData?.table_name }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block mb-0.5">เวลา:</span>
              <span class="font-extrabold text-slate-900 text-sm">{{ formatThaiDateTime(selectedLogData?.created_at) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <span class="text-xs font-extrabold text-rose-600 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                ค่าเดิม (Old Value)
              </span>
              <div class="bg-slate-900 text-rose-300 font-mono text-xs p-4 rounded-2xl overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.old_value">{{ JSON.stringify(selectedLogData.old_value, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลเดิม -
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                ค่าใหม่ (New Value)
              </span>
              <div class="bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-2xl overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.new_value">{{ JSON.stringify(selectedLogData.new_value, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลใหม่ -
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            @click="closeModal" 
            class="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>

  </div>
</template>