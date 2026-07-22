<script setup>
import { ref, computed } from 'vue'
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
  TrendingDown
} from 'lucide-vue-next'

// ==========================================
// 1. USER & ROLE CONTEXT
// ==========================================
// สามารถลองคลิกสลับ Role ด้านบนสุดของหน้าจอเพื่อทดสอบระบบได้ครับ
const currentUser = ref({
  id: 'USR-001',
  name: 'นายสมชาย ใจดี',
  role: 'User' // 'Admin' | 'Staff' | 'User'
})

// ==========================================
// 2. MOCK DATABASE (Simulated PostgreSQL Stock)
// ==========================================
const inventoryStock = ref([
  { id: 'SKU-001', name: 'กระดาษ A4 80 GSM (รีม)', category: 'วัสดุสำนักงาน', qty: 150, unit: 'รีม' },
  { id: 'SKU-002', name: 'ปากกาลูกลื่น น้ำเงิน 0.5mm', category: 'วัสดุสำนักงาน', qty: 320, unit: 'ด้าม' },
  { id: 'SKU-003', name: 'หมึกพิมพ์ HP Laser Toner 85A', category: 'วัสดุคอมพิวเตอร์', qty: 8, unit: 'กล่อง' },
  { id: 'SKU-004', name: 'ถุงมือยางอนามัย Size L', category: 'วัสดุการทดลอง', qty: 45, unit: 'กล่อง' }
])

// Mock รายการใบขอเบิกพัสดุ (Requisition Orders)
const requisitions = ref([
  {
    id: 'REQ-2026-001',
    requesterId: 'USR-001',
    requesterName: 'นายสมชาย ใจดี',
    department: 'เทคโนโลยีสารสนเทศ',
    requestDate: '2026-07-20 09:30',
    reason: 'ใช้ในการจัดเตรียมเอกสารประเมินคุณภาพการศึกษาประจำปี',
    status: 'PENDING', // PENDING | APPROVED | REJECTED
    items: [
      { skuId: 'SKU-001', name: 'กระดาษ A4 80 GSM (รีม)', qty: 5, unit: 'รีม' },
      { skuId: 'SKU-002', name: 'ปากกาลูกลื่น น้ำเงิน 0.5mm', qty: 10, unit: 'ด้าม' }
    ],
    approvedBy: null,
    approvedDate: null,
    rejectReason: null
  },
  {
    id: 'REQ-2026-002',
    requesterId: 'USR-002',
    requesterName: 'นางสาววิภาดา พัสดุ',
    department: 'งานการเงินและบัญชี',
    requestDate: '2026-07-19 14:15',
    reason: 'เบิกเปลี่ยนตลับหมึกเครื่องพิมพ์ส่วนกลางที่หมด',
    status: 'APPROVED',
    items: [
      { skuId: 'SKU-003', name: 'หมึกพิมพ์ HP Laser Toner 85A', qty: 2, unit: 'กล่อง' }
    ],
    approvedBy: 'นายผู้ดูแล ระบบ (Staff)',
    approvedDate: '2026-07-19 15:00',
    rejectReason: null
  },
  {
    id: 'REQ-2026-003',
    requesterId: 'USR-001',
    requesterName: 'นายสมชาย ใจดี',
    department: 'เทคโนโลยีสารสนเทศ',
    requestDate: '2026-07-15 11:00',
    reason: 'เบิกใช้สอนภาคปฏิบัติห้องแล็บ 4',
    status: 'REJECTED',
    items: [
      { skuId: 'SKU-004', name: 'ถุงมือยางอนามัย Size L', qty: 50, unit: 'กล่อง' }
    ],
    approvedBy: 'หัวหน้างาน พัสดุ (Admin)',
    approvedDate: '2026-07-15 13:20',
    rejectReason: 'จำนวนคงเหลือในคลังไม่เพียงพอ (คงเหลือ 45 กล่อง)'
  }
])

// ==========================================
// 3. SEARCH & FILTER LOGIC
// ==========================================
const searchQuery = ref('')
const statusFilter = ref('')

const filteredRequisitions = computed(() => {
  return requisitions.value.filter(req => {
    // RBAC Control: User เห็นเฉพาะของตัวเอง | Staff/Admin เห็นทั้งหมด
    if (currentUser.value.role === 'User' && req.requesterId !== currentUser.value.id) {
      return false
    }

    const matchesSearch = req.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.requesterName.includes(searchQuery.value) ||
      req.department.includes(searchQuery.value)

    const matchesStatus = statusFilter.value === '' || req.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// ==========================================
// 4. APPROVAL & REJECT ACTIONS (PostgreSQL Sync)
// ==========================================
const isDetailModalOpen = ref(false)
const selectedReq = ref(null)

const openDetailModal = (req) => {
  selectedReq.value = req
  isDetailModalOpen.value = true
}

// อนุมัติการเบิก -> หัก สต็อก PostgreSQL
const handleApprove = (req) => {
  if (currentUser.value.role === 'User') return

  if (confirm(`ยืนยันการอนุมัติใบขอเบิกเลขที่ ${req.id} ?\nระบบจะทำการหักยอดพัสดุในคลังอัตโนมัติ`)) {
    // 1. ตรวจสอบว่าสต็อกเพียงพอหรือไม่
    let isStockSufficient = true
    let errorMsg = ''

    req.items.forEach(item => {
      const stockItem = inventoryStock.value.find(s => s.id === item.skuId)
      if (!stockItem || stockItem.qty < item.qty) {
        isStockSufficient = false
        errorMsg += `\n- ${item.name} (ขอเบิก ${item.qty} ${item.unit} / คงเหลือในคลัง ${stockItem ? stockItem.qty : 0} ${item.unit})`
      }
    })

    if (!isStockSufficient) {
      alert(`❌ ไม่สามารถอนุมัติได้ เนื่องจากสต็อกไม่เพียงพอ:${errorMsg}`)
      return
    }

    // 2. หักจำนวนพัสดุในสต็อก (Simulate UPDATE inventory SET qty = qty - req_qty)
    req.items.forEach(item => {
      const stockItem = inventoryStock.value.find(s => s.id === item.skuId)
      if (stockItem) {
        stockItem.qty -= item.qty
      }
    })

    // 3. อัปเดตสถานะใบเบิก
    req.status = 'APPROVED'
    req.approvedBy = `${currentUser.value.name} (${currentUser.value.role})`
    req.approvedDate = new Date().toISOString().replace('T', ' ').substring(0, 16)

    alert(`✅ อนุมัติคำขอเบิก ${req.id} เรียบร้อยแล้ว! ระบบตัดยอดสต็อกและลงประวัติการจ่ายเรียบร้อย`)
    isDetailModalOpen.value = false
  }
}

// ปฏิเสธการเบิก
const handleReject = (req) => {
  if (currentUser.value.role === 'User') return

  const reason = prompt(`กรุณาระบุเหตุผลในการปฏิเสธใบเบิก ${req.id}:`)
  if (reason !== null && reason.trim() !== '') {
    req.status = 'REJECTED'
    req.approvedBy = `${currentUser.value.name} (${currentUser.value.role})`
    req.approvedDate = new Date().toISOString().replace('T', ' ').substring(0, 16)
    req.rejectReason = reason

    alert(`❌ ปฏิเสธคำขอเบิก ${req.id} เรียบร้อยแล้ว`)
    isDetailModalOpen.value = false
  }
}

// ==========================================
// 5. NEW REQUISITION FORM (Create Modal)
// ==========================================
const isNewModalOpen = ref(false)
const newReq = ref({
  reason: '',
  items: [
    { skuId: '', qty: 1 }
  ]
})

const addFormItem = () => {
  newReq.value.items.push({ skuId: '', qty: 1 })
}

const removeFormItem = (index) => {
  if (newReq.value.items.length > 1) {
    newReq.value.items.splice(index, 1)
  }
}

const handleCreateRequisition = () => {
  if (!newReq.value.reason) {
    alert('กรุณาระบุเหตุผลการขอเบิก')
    return
  }

  // Map SKU items
  const formattedItems = newReq.value.items.map(i => {
    const stockItem = inventoryStock.value.find(s => s.id === i.skuId)
    return {
      skuId: i.skuId,
      name: stockItem ? stockItem.name : 'พัสดุทั่วไป',
      qty: Number(i.qty),
      unit: stockItem ? stockItem.unit : 'หน่วย'
    }
  })

  const newId = `REQ-2026-00${requisitions.value.length + 1}`
  requisitions.value.unshift({
    id: newId,
    requesterId: currentUser.value.id,
    requesterName: currentUser.value.name,
    department: 'เทคโนโลยีสารสนเทศ',
    requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    reason: newReq.value.reason,
    status: 'PENDING',
    items: formattedItems,
    approvedBy: null,
    approvedDate: null,
    rejectReason: null
  })

  alert(`🎉 ส่งใบขอเบิกเลขที่ ${newId} เรียบร้อยแล้ว! รอเจ้าหน้าที่พัสดุตรวจสอบ`)
  isNewModalOpen.value = false
  newReq.value = { reason: '', items: [{ skuId: '', qty: 1 }] }
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

    <!-- Global Top Header & Role Switcher Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
          <FileText class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900">ระบบบริหารคำขอเบิกพัสดุ (Requisition Management)</h1>
          <p class="text-base text-slate-500 font-medium mt-0.5">จัดการใบขอเบิกพัสดุสิ้นเปลือง อนุมัติ และตัดสต็อกอัตโนมัติ</p>
        </div>
      </div>

      <!-- Demo Role Selector Switcher -->
      <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <span class="text-xs md:text-sm text-slate-500 font-bold px-2">ทดสอบสิทธิ์ผู้ใช้:</span>
        <button 
          @click="currentUser.role = 'Admin'" 
          :class="['px-3.5 py-1.5 text-xs md:text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'Admin' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          Admin
        </button>
        <button 
          @click="currentUser.role = 'Staff'" 
          :class="['px-3.5 py-1.5 text-xs md:text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'Staff' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          Staff
        </button>
        <button 
          @click="currentUser.role = 'User'" 
          :class="['px-3.5 py-1.5 text-xs md:text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'User' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          User (ผู้ขอเบิก)
        </button>
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
                {{ req.id }}
              </td>
              <td class="px-6 py-4">
                <div class="font-extrabold text-slate-900 text-base">{{ req.requesterName }}</div>
                <div class="text-xs text-slate-500">{{ req.department }}</div>
              </td>
              <td class="px-6 py-4 text-slate-600 font-mono">
                📅 {{ req.requestDate }}
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
              ใบขอเบิกเลขที่ {{ selectedReq.id }}
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
              <strong class="text-slate-900 text-lg">{{ selectedReq.requesterName }}</strong>
              <span class="text-xs text-slate-500 block">{{ selectedReq.department }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-400 font-bold block">วันที่ขอเบิก</span>
              <strong class="text-slate-900 font-mono">{{ selectedReq.requestDate }}</strong>
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
                  <tr v-for="item in selectedReq.items" :key="item.skuId">
                    <td class="px-4 py-3 text-slate-900 font-bold">
                      {{ item.name }}
                    </td>
                    <td class="px-4 py-3 text-center font-bold text-emerald-800">
                      {{ item.qty }} {{ item.unit }}
                    </td>
                    <td class="px-4 py-3 text-center font-mono">
                      <span :class="[(inventoryStock.find(s => s.id === item.skuId)?.qty || 0) < item.qty ? 'text-rose-600 font-extrabold' : 'text-slate-600']">
                        {{ inventoryStock.find(s => s.id === item.skuId)?.qty || 0 }} {{ item.unit }}
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
            <div class="text-xs text-slate-500 font-mono">
              เมื่อวันที่: {{ selectedReq.approvedDate }}
            </div>
            <div v-if="selectedReq.rejectReason" class="text-sm text-rose-700 font-bold pt-1">
              เหตุผลที่ปฏิเสธ: {{ selectedReq.rejectReason }}
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
              class="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
            >
              ✓ อนุมัติ & ตัดสต็อก
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
                  v-model="item.skuId" 
                  required
                  class="flex-1 border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-800 bg-white focus:outline-none"
                >
                  <option value="" disabled>-- เลือกรายการพัสดุ --</option>
                  <option v-for="stock in inventoryStock" :key="stock.id" :value="stock.id">
                    {{ stock.name }} (คงเหลือ: {{ stock.qty }} {{ stock.unit }})
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