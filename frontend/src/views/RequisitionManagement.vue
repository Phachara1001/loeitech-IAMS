<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Package,
  UserCheck,
  AlertCircle,
  TrendingDown,
  History,
  Calendar,
  Loader2
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// ==========================================
// 1. USER & ROLE CONTEXT
// ==========================================
const userObj = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
const currentUser = ref({
  id: userObj.id || 'USR-001',
  name: userObj.name || 'ผู้ตรวจสอบพัสดุ',
  role: localStorage.getItem('tcaims_role') || 'Admin' // 'Admin' | 'Staff' | 'User'
})

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
    hour12: false
  })
}

// ==========================================
// 2. REAL DATABASE CONNECTION
// ==========================================
const inventoryStock = ref([])
const requisitions = ref([])
const isLoading = ref(false)
const loadError = ref('')

async function fetchData() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [itemsData, reqsData] = await Promise.all([
      inventoryApi.getItems(),
      inventoryApi.getRequisitions()
    ])
    inventoryStock.value = itemsData
    requisitions.value = reqsData
  } catch (err) {
    loadError.value = err.message || 'ไม่สามารถดึงข้อมูลจากระบบได้'
    toast.error('โหลดข้อมูลล้มเหลว: ' + loadError.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// ==========================================
// 3. SEARCH & FILTER LOGIC
// ==========================================
const searchQuery = ref('')
const statusFilter = ref('')

const filteredRequisitions = computed(() => {
  return requisitions.value.filter(req => {
    // RBAC Control: User เห็นเฉพาะของตัวเอง | Staff/Admin เห็นทั้งหมด
    if (currentUser.value.role === 'User' && req.requesterId && req.requesterId !== currentUser.value.id) {
      return false
    }

    const reqCodeStr = req.reqCode || `REQ-${req.id}`
    const requesterNameStr = req.requesterName || 'ไม่ระบุชื่อ'
    const departmentStr = req.department || 'สำนักงาน'

    const matchesSearch = reqCodeStr.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      requesterNameStr.includes(searchQuery.value) ||
      departmentStr.includes(searchQuery.value) ||
      (req.reason && req.reason.includes(searchQuery.value))

    const matchesStatus = statusFilter.value === '' || req.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// ==========================================
// 4. APPROVAL & REJECT ACTIONS
// ==========================================
const isDetailModalOpen = ref(false)
const selectedReq = ref(null)
const isActionLoading = ref(false)

const openDetailModal = (req) => {
  selectedReq.value = req
  isDetailModalOpen.value = true
}

// อนุมัติการเบิก -> หัก สต็อก (ผ่าน Backend transaction)
const handleApprove = async (req) => {
  if (currentUser.value.role === 'User') return

  if (confirm(`ยืนยันการอนุมัติใบขอเบิกเลขที่ ${req.reqCode || req.id} ?\nระบบจะทำการหักยอดพัสดุในคลังอัตโนมัติ`)) {
    isActionLoading.value = true
    try {
      await inventoryApi.approveRequisition(req.id, {
        approvedBy: currentUser.value.name,
        remark: 'อนุมัติจ่ายพัสดุเรียบร้อย'
      })
      toast.success('อนุมัติและหักยอดสต็อกเรียบร้อยแล้ว!')
      isDetailModalOpen.value = false
      await fetchData() // อัปเดตตารางและจำนวนสต๊อกใหม่
    } catch (err) {
      toast.error('ไม่สามารถอนุมัติได้: ' + err.message)
    } finally {
      isActionLoading.value = false
    }
  }
}

// ปฏิเสธการเบิก
const handleReject = async (req) => {
  if (currentUser.value.role === 'User') return

  const reasonText = prompt(`กรุณาระบุเหตุผลในการปฏิเสธใบเบิก ${req.reqCode || req.id}:`)
  if (reasonText !== null && reasonText.trim() !== '') {
    isActionLoading.value = true
    try {
      await inventoryApi.rejectRequisition(req.id, {
        approvedBy: currentUser.value.name,
        remark: reasonText.trim()
      })
      toast.success('ปฏิเสธคำขอเบิกพัสดุเรียบร้อยแล้ว')
      isDetailModalOpen.value = false
      await fetchData()
    } catch (err) {
      toast.error('ปฏิเสธไม่สำเร็จ: ' + err.message)
    } finally {
      isActionLoading.value = false
    }
  }
}

// ==========================================
// 5. NEW REQUISITION FORM (Create Modal)
// ==========================================
const isNewModalOpen = ref(false)
const newReq = ref({
  reason: '',
  items: [
    { itemId: '', qty: 1 }
  ]
})

const addFormItem = () => {
  newReq.value.items.push({ itemId: '', qty: 1 })
}

const removeFormItem = (index) => {
  if (newReq.value.items.length > 1) {
    newReq.value.items.splice(index, 1)
  }
}

const handleCreateRequisition = async () => {
  if (!newReq.value.reason) {
    toast.warning('กรุณาระบุเหตุผลการขอเบิก')
    return
  }

  const hasEmptyItem = newReq.value.items.some(i => !i.itemId)
  if (hasEmptyItem) {
    toast.warning('กรุณาเลือกรายการพัสดุให้ครบถ้วน')
    return
  }

  isActionLoading.value = true
  try {
    const payload = {
      reason: newReq.value.reason.trim(),
      items: newReq.value.items.map(i => ({
        id: Number(i.itemId),
        qty: Number(i.qty)
      }))
    }

    const result = await inventoryApi.createRequisition(payload)
    const code = result.data?.reqCode || 'REQ-SUCCESS'
    toast.success(`ส่งคำขอเบิกเลขที่ ${code} เรียบร้อยแล้ว!`)
    isNewModalOpen.value = false
    newReq.value = { reason: '', items: [{ itemId: '', qty: 1 }] }
    await fetchData()
  } catch (err) {
    toast.error('ไม่สามารถส่งคำขอเบิกได้: ' + err.message)
  } finally {
    isActionLoading.value = false
  }
}

// ==========================================
// HELPER BADGES
// ==========================================
const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED': return { text: 'อนุมัติแล้ว', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
    case 'REJECTED': return { text: 'ปฏิเสธการเบิก', class: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
    default: return { text: 'รอตรวจสอบ', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock }
  }
}
</script>

<template>
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-slate-100 text-slate-800 space-y-6">

    <!-- Global Top Header Bar (เหมือน AssetTimeline) -->
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
            <FileText class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">ระบบบริหารคำขอเบิกพัสดุ (Requisition Management)</h1>
            <p class="text-emerald-100/80 text-sm sm:text-base mt-1">จัดการใบขอเบิกพัสดุสิ้นเปลือง อนุมัติ และตัดสต็อกอัตโนมัติ</p>
          </div>
        </div>

        <!-- Dev Role Switcher Button -->
        <div class="flex items-center gap-2 bg-black/20 border border-white/10 p-2 rounded-xl backdrop-blur-md shrink-0">
          <span class="text-xs sm:text-sm text-emerald-100/80 font-medium px-2">สิทธิ์สลับหน้าทดสอบ:</span>
          <button 
            @click="currentUser.role = 'Admin'" 
            :class="['px-3 py-1.5 text-xs rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Admin' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Admin
          </button>
          <button 
            @click="currentUser.role = 'Staff'" 
            :class="['px-3 py-1.5 text-xs rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Staff' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Staff
          </button>
          <button 
            @click="currentUser.role = 'User'" 
            :class="['px-3 py-1.5 text-xs rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'User' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            User (ผู้ขอเบิก)
          </button>
        </div>
      </div>
    </div>

    <!-- Action Header & Banner -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">
          {{ currentUser.role === 'User' ? 'รายการคำขอเบิกของฉัน' : 'รายการคำขอเบิกพัสดุทั้งหมด' }}
        </h2>
        <p class="text-slate-500 mt-0.5">
          {{ currentUser.role === 'User' ? 'ติดตามสถานะการอนุมัติคำขอเบิกพัสดุของคุณ' : 'ตรวจสอบและอนุมัติใบขอเบิกเพื่อตัดยอดสต็อกพัสดุ' }}
        </p>
      </div>
      <div>
        <button 
          @click="isNewModalOpen = true"
          class="px-5 py-3 bg-emerald-800 text-white hover:bg-emerald-700 rounded-2xl font-extrabold flex items-center transition-all shadow-md cursor-pointer"
        >
          <Plus class="w-5 h-5 mr-2 stroke-[3]" />
          สร้างใบขอเบิกพัสดุใหม่
        </button>
      </div>
    </div>

    <!-- Main Table Card Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
      
      <!-- Filter Toolbar -->
      <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ค้นหาเลขใบเบิก, ชื่อผู้ขอ, แผนก..."
            class="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" 
          />
        </div>

        <div class="flex items-center space-x-3">
          <div class="relative">
            <select 
              v-model="statusFilter"
              class="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="PENDING">รอตรวจสอบ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ปฏิเสธการเบิก</option>
            </select>
            <Filter class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Requisitions Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th class="px-6 py-4">เลขที่ใบเบิก</th>
              <th class="px-6 py-4">ผู้ขอเบิก / แผนก</th>
              <th class="px-6 py-4">วันที่ส่งคำขอ</th>
              <th class="px-6 py-4 text-center">จำนวนรายการ</th>
              <th class="px-6 py-4">สถานะ</th>
              <th class="px-6 py-4 text-center">การจัดการ / อนุมัติ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 font-medium">
            <tr v-for="req in filteredRequisitions" :key="req.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-slate-900">
                {{ req.reqCode || 'REQ-' + req.id }}
              </td>
              <td class="px-6 py-4">
                <div class="font-extrabold text-slate-900 text-base">{{ req.requesterName || 'ผู้เบิกทั่วไป' }}</div>
                <div class="text-xs text-slate-500">{{ req.department || 'หน่วยงานกลาง' }}</div>
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium">
                <div class="flex items-center gap-1.5">
                  <Calendar class="w-4 h-4 text-slate-400" />
                  <span>{{ formatThaiDateTime(req.createdAt) }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs">
                  {{ req.items.length }} รายการ
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="['px-3 py-1 text-xs font-extrabold rounded-full border inline-flex items-center gap-1.5', getStatusBadge(req.status).class]">
                  <component :is="getStatusBadge(req.status).icon" class="w-3.5 h-3.5" />
                  {{ getStatusBadge(req.status).text }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                  <!-- ปุ่มกดดูรายละเอียด -->
                  <button 
                    @click="openDetailModal(req)"
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center transition-all cursor-pointer border border-slate-200"
                  >
                    <Eye class="w-3.5 h-3.5 mr-1" />
                    รายละเอียด
                  </button>

                  <!-- ปุ่ม อนุมัติ / ปฏิเสธ (แสดงเฉพาะ Staff / Admin เมื่อสถานะเป็น PENDING) -->
                  <template v-if="(currentUser.role === 'Admin' || currentUser.role === 'Staff') && req.status === 'PENDING'">
                    <button 
                      @click="handleApprove(req)"
                      class="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center transition-all cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5 mr-1" />
                      อนุมัติ
                    </button>
                    <button 
                      @click="handleReject(req)"
                      class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-extrabold text-xs flex items-center transition-all cursor-pointer border border-rose-200"
                    >
                      <XCircle class="w-3.5 h-3.5 mr-1" />
                      ปฏิเสธ
                    </button>
                  </template>
                </div>
              </td>
            </tr>

            <tr v-if="filteredRequisitions.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">
                ไม่พบใบขอเบิกพัสดุที่ตรงกับการค้นหา
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- =========================================
         MODAL 1: VIEW DETAILS & APPROVAL MODAL
         ========================================= -->
    <div v-if="isDetailModalOpen && selectedReq" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span class="text-xs font-mono font-bold text-slate-400">REQUISITION DETAIL</span>
            <h3 class="font-extrabold text-slate-900 text-2xl flex items-center gap-2">
              ใบขอเบิกเลขที่ {{ selectedReq.reqCode || 'REQ-' + selectedReq.id }}
            </h3>
          </div>
          <button @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors cursor-pointer">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="p-8 overflow-y-auto space-y-6 text-base">
          
          <!-- Requester Banner -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span class="text-xs text-slate-400 font-bold block">ผู้ขอเบิก</span>
              <strong class="text-slate-900 text-lg">{{ selectedReq.requesterName || 'ผู้เบิกทั่วไป' }}</strong>
              <span class="text-xs text-slate-500 block">{{ selectedReq.department || 'หน่วยงานกลาง' }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-400 font-bold block">วันที่ขอเบิก</span>
              <div class="flex items-center gap-1.5 text-slate-900 font-medium mt-0.5">
                <Calendar class="w-4 h-4 text-slate-400" />
                <span>{{ formatThaiDateTime(selectedReq.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-extrabold text-slate-500 mb-1">เหตุผลการขอเบิก:</label>
            <p class="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              {{ selectedReq.reason }}
            </p>
          </div>

          <!-- Items Table -->
          <div>
            <label class="block text-sm font-extrabold text-slate-500 mb-2">รายการพัสดุที่ขอเบิก:</label>
            <div class="border border-slate-200 rounded-2xl overflow-hidden">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th class="px-4 py-3">ชื่อพัสดุ</th>
                    <th class="px-4 py-3 text-center">จำนวนขอเบิก</th>
                    <th class="px-4 py-3 text-center">คงเหลือในสต็อก</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 font-medium">
                  <tr v-for="item in selectedReq.items" :key="item.id">
                    <td class="px-4 py-3 text-slate-900 font-bold">
                      {{ item.item?.name || 'พัสดุทั่วไป' }}
                    </td>
                    <td class="px-4 py-3 text-center font-bold text-emerald-800">
                      {{ item.requestedQty }} {{ item.item?.unit || 'หน่วย' }}
                    </td>
                    <td class="px-4 py-3 text-center font-mono">
                      <span :class="[(inventoryStock.find(s => s.id === item.itemId)?.quantity || 0) < item.requestedQty ? 'text-rose-600 font-extrabold' : 'text-slate-600']">
                        {{ inventoryStock.find(s => s.id === item.itemId)?.quantity || 0 }} {{ item.item?.unit || 'หน่วย' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Status & Approver Details -->
          <div v-if="selectedReq.status !== 'PENDING'" class="p-4 rounded-2xl border space-y-2" :class="selectedReq.status === 'APPROVED' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'">
            <div class="flex items-center gap-2 font-extrabold" :class="selectedReq.status === 'APPROVED' ? 'text-emerald-800' : 'text-rose-800'">
              <UserCheck class="w-5 h-5" />
              <span>ผู้ดำเนินการ: {{ selectedReq.approvedBy }}</span>
            </div>
            <div class="text-xs text-slate-500 flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>เมื่อวันที่: {{ formatThaiDateTime(selectedReq.approvedAt) }}</span>
            </div>
            <div v-if="selectedReq.remark" class="text-sm text-rose-700 font-bold pt-1">
              เหตุผลการปฏิเสธ: {{ selectedReq.remark }}
            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <template v-if="(currentUser.role === 'Admin' || currentUser.role === 'Staff') && selectedReq.status === 'PENDING'">
            <button 
              @click="handleReject(selectedReq)"
              class="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl transition-all border border-rose-200 cursor-pointer"
            >
              ปฏิเสธคำขอ
            </button>
            <button 
              @click="handleApprove(selectedReq)"
              class="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>อนุมัติ & ตัดสต็อก</span>
            </button>
          </template>
          <button 
            v-else
            @click="isDetailModalOpen = false" 
            class="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>


    <!-- =========================================
         MODAL 2: CREATE NEW REQUISITION MODAL
         ========================================= -->
    <div v-if="isNewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/80">
          <h3 class="font-extrabold text-slate-900 text-2xl flex items-center gap-3">
            <Plus class="w-8 h-8 text-emerald-800 stroke-[3]" />
            สร้างใบขอเบิกพัสดุสิ้นเปลือง
          </h3>
          <button @click="isNewModalOpen = false" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors cursor-pointer">
            <X class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="handleCreateRequisition" class="p-8 overflow-y-auto space-y-6 text-base">
          
          <div>
            <label class="block font-extrabold text-slate-900 mb-2">วัตถุประสงค์ / เหตุผลการขอเบิก:</label>
            <textarea 
              v-model="newReq.reason" 
              rows="2" 
              required
              placeholder="ระบุวัตถุประสงค์ในการนำพัสดุไปใช้งาน..."
              class="w-full border-2 border-slate-300 rounded-xl p-3.5 text-slate-900 font-medium focus:border-emerald-600 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="font-extrabold text-slate-900">เลือกรายการพัสดุที่ต้องการเบิก:</label>
              <button 
                type="button" 
                @click="addFormItem"
                class="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + เพิ่มรายการ
              </button>
            </div>

            <div class="space-y-3">
              <div v-for="(item, idx) in newReq.items" :key="idx" class="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <select 
                  v-model="item.itemId" 
                  required
                  class="flex-1 border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-800 bg-white focus:outline-none"
                >
                  <option value="" disabled>-- เลือกรายการพัสดุ --</option>
                  <option v-for="stock in inventoryStock" :key="stock.id" :value="stock.id">
                    {{ stock.name }} (คงเหลือ: {{ stock.quantity }} {{ stock.unit || 'หน่วย' }})
                  </option>
                </select>

                <input 
                  v-model="item.qty" 
                  type="number" 
                  min="1" 
                  required
                  class="w-24 border border-slate-300 rounded-lg p-2 text-sm text-center font-bold text-slate-800 bg-white"
                />

                <button 
                  type="button" 
                  @click="removeFormItem(idx)"
                  class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="ลบรายการ"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button 
              type="button" 
              @click="isNewModalOpen = false" 
              class="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              class="px-8 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-colors"
            >
              ส่งใบขอเบิก
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>