<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeftRight, Plus, X, Check, Loader2, AlertTriangle, Bell,
  CheckCircle2, Ban, PackageCheck, Clock, ChevronRight
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canManage = computed(() => ['admin', 'staff', 'Admin', 'Staff'].includes(currentRole.value))
const currentUserName = ref(localStorage.getItem('tcaims_name') || 'ผู้ใช้งานระบบ')

const assets = ref([])
const records = ref([])
const isLoading = ref(false)
const loadError = ref('')

async function fetchData() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [assetsData, borrowsData] = await Promise.all([
      inventoryApi.getAssets(),
      inventoryApi.getBorrows()
    ])
    assets.value = assetsData
    records.value = borrowsData
  } catch (err) {
    loadError.value = err.message || 'โหลดข้อมูลล้มเหลว'
    toast.error('ไม่สามารถโหลดข้อมูลการยืม-คืนได้: ' + loadError.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

const availableAssetsForBorrow = computed(() => {
  return assets.value.filter(a => a.status === 'Active' || a.status === 'active')
})

const now = new Date()

function daysUntil(dateStr) {
  if (!dateStr) return 0
  const target = new Date(dateStr)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return diff
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

function statusLabel(status) {
  if (status === 'PENDING') return 'รออนุมัติ'
  if (status === 'BORROWED') return 'กำลังยืม'
  if (status === 'RETURNED') return 'คืนแล้ว'
  if (status === 'REJECTED') return 'ไม่อนุมัติ'
  if (status === 'OVERDUE') return 'เกินกำหนด'
  return status
}

function statusStyle(status) {
  if (status === 'RETURNED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'BORROWED') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (status === 'OVERDUE') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'REJECTED') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const dueSoonOrOverdue = computed(() =>
  records.value.filter((r) => (r.status === 'BORROWED') && r.dueDate)
    .map((r) => ({ ...r, daysLeft: daysUntil(r.dueDate) }))
    .filter((r) => r.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
)

/* ===== Modal: ฟอร์มยืมใหม่ ===== */
const isFormOpen = ref(false)
const isSaving = ref(false)
const formError = ref('')
const form = ref({ assetId: '', purpose: '', dueDate: '' })

function openForm() {
  formError.value = ''
  form.value = { assetId: '', purpose: '', dueDate: '' }
  isFormOpen.value = true
}
function closeForm() { isFormOpen.value = false }

async function saveForm() {
  if (!form.value.assetId || !form.value.purpose.trim() || !form.value.dueDate) {
    formError.value = 'กรุณาเลือกรายการ ระบุวัตถุประสงค์ และกำหนดวันส่งคืนให้ครบถ้วน'
    return
  }
  isSaving.value = true
  formError.value = ''
  try {
    const todayStr = new Date().toISOString().substring(0, 10)
    await inventoryApi.createBorrow({
      assetId: Number(form.value.assetId),
      borrowerName: currentUserName.value,
      borrowerDept: 'งานพัสดุกลาง',
      borrowDate: todayStr,
      dueDate: form.value.dueDate,
      purpose: form.value.purpose.trim()
    })
    toast.success('ยื่นคำขอยืมครุภัณฑ์สำเร็จ!')
    isFormOpen.value = false
    await fetchData()
  } catch (err) {
    formError.value = err.message || 'ส่งคำขอยืมไม่สำเร็จ'
    toast.error('ล้มเหลว: ' + formError.value)
  } finally {
    isSaving.value = false
  }
}

/* ===== Modal: อนุมัติ / ปฏิเสธ ===== */
const approveModal = ref({ open: false, record: null })
const rejectModal = ref({ open: false, record: null, remark: '' })

function openApprove(record) { approveModal.value = { open: true, record } }
function closeApprove() { approveModal.value = { open: false, record: null } }

async function confirmApprove() {
  const record = approveModal.value.record
  if (!record) return
  try {
    await inventoryApi.approveBorrow(record.id, { approvedBy: currentUserName.value })
    toast.success('อนุมัติคำขอยืมครุภัณฑ์เรียบร้อย')
    closeApprove()
    await fetchData()
  } catch (err) {
    toast.error('อนุมัติไม่สำเร็จ: ' + err.message)
  }
}

function openReject(record) { rejectModal.value = { open: true, record, remark: '' } }
function closeReject() { rejectModal.value = { open: false, record: null, remark: '' } }

async function confirmReject() {
  const { record, remark } = rejectModal.value
  if (!record || !remark.trim()) {
    toast.warning('กรุณาระบุเหตุผลในการปฏิเสธ')
    return
  }
  try {
    await inventoryApi.rejectBorrow(record.id, { approvedBy: currentUserName.value, remark: remark.trim() })
    toast.success('ปฏิเสธคำขอยืมเรียบร้อย')
    closeReject()
    await fetchData()
  } catch (err) {
    toast.error('ปฏิเสธการยืมไม่สำเร็จ: ' + err.message)
  }
}

/* ===== Modal: บันทึกรับคืน ===== */
const returnModal = ref({ open: false, record: null, condition: 'ปกติ' })
const conditionOptions = ['ปกติ', 'ชำรุด', 'สูญหาย']

function openReturn(record) { returnModal.value = { open: true, record, condition: 'ปกติ' } }
function closeReturn() { returnModal.value = { open: false, record: null, condition: 'ปกติ' } }

async function confirmReturn() {
  const { record, condition } = returnModal.value
  if (!record) return
  try {
    await inventoryApi.returnBorrow(record.id, {
      returnedTo: currentUserName.value,
      remark: `ส่งคืนครุภัณฑ์ในสภาพ: ${condition}`
    })
    toast.success('บันทึกรับคืนครุภัณฑ์เรียบร้อยแล้ว!')
    closeReturn()
    await fetchData()
  } catch (err) {
    toast.error('บันทึกรับคืนไม่สำเร็จ: ' + err.message)
  }
}
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
    <!-- Header Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>
      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <ArrowLeftRight class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">การยืม-คืนพัสดุและครุภัณฑ์</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">ทำรายการขอยืม ติดตามการอนุมัติ และบันทึกรับคืนพร้อมประเมินสภาพ</p>
        </div>
      </div>
    </div>

    <!-- แจ้งเตือนใกล้/เกินกำหนดส่งคืน -->
    <div v-if="dueSoonOrOverdue.length > 0" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div class="flex items-center gap-2 mb-3">
        <Bell class="w-4 h-4 text-amber-600" />
        <h3 class="text-sm font-bold text-amber-800">รายการที่ใกล้ถึงหรือเลยกำหนดส่งคืน</h3>
      </div>
      <div class="space-y-1.5">
        <div v-for="r in dueSoonOrOverdue" :key="r.id" class="flex items-center justify-between gap-3 text-sm">
          <span class="text-amber-800 truncate">{{ r.asset?.name || 'ครุภัณฑ์' }} <span class="text-amber-600">· {{ r.borrowerName }}</span></span>
          <span class="font-semibold text-amber-700 shrink-0">
            {{ r.daysLeft < 0 ? `เลยกำหนด ${Math.abs(r.daysLeft)} วัน` : r.daysLeft === 0 ? 'ครบกำหนดวันนี้' : `เหลืออีก ${r.daysLeft} วัน` }}
          </span>
        </div>
      </div>
    </div>

    <!-- รายการยืม-คืน -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <!-- Toolbar -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <p class="text-sm text-slate-500">ทั้งหมด <span class="font-bold text-[#065f46]">{{ records.length }}</span> รายการ</p>
        <button type="button" @click="openForm"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
          <Plus class="w-4 h-4" />
          ยืมพัสดุ/ครุภัณฑ์ใหม่
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 text-center text-slate-400 text-sm">กำลังโหลด...</div>

      <!-- List -->
      <div v-else class="divide-y divide-slate-100">
        <div v-if="records.length === 0" class="py-16 text-center text-slate-400 text-sm">ยังไม่มีรายการยืม-คืน</div>

        <div v-for="r in records" :key="r.id" class="px-5 py-4 hover:bg-slate-50 transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <!-- Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-xs font-mono text-slate-400">{{ r.borrowCode || r.id }}</span>
                <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusStyle(r.status)]">
                  {{ statusLabel(r.status) }}
                </span>
              </div>
              <p class="text-sm font-semibold text-slate-800">
                {{ r.asset?.name || 'ครุภัณฑ์' }}
                <span class="text-slate-400 font-normal">({{ r.asset?.seq || '-' }})</span>
              </p>
              <p class="text-xs text-slate-500 mt-0.5">ผู้ยืม: {{ r.borrowerName }} · {{ r.purpose }}</p>
              <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock class="w-3 h-3 shrink-0" />
                กำหนดคืน {{ r.dueDate ? formatThaiDate(r.dueDate) : '-' }}
                <span v-if="r.returnDate"> · คืนแล้ว {{ formatThaiDate(r.returnDate) }}</span>
              </p>
            </div>

            <!-- Actions (Admin/Staff) -->
            <div v-if="canManage" class="flex items-center gap-2 shrink-0">
              <!-- รออนุมัติ: ปุ่มอนุมัติ + ปฏิเสธ -->
              <template v-if="r.status === 'PENDING'">
                <button type="button" @click="openApprove(r)"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer">
                  <CheckCircle2 class="w-4 h-4" />
                  อนุมัติ
                </button>
                <button type="button" @click="openReject(r)"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                  <Ban class="w-4 h-4" />
                  ปฏิเสธ
                </button>
              </template>
              <!-- กำลังยืม/เกินกำหนด: ปุ่มรับคืน -->
              <button v-else-if="r.status === 'BORROWED' || r.status === 'OVERDUE'" type="button" @click="openReturn(r)"
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-all cursor-pointer">
                <PackageCheck class="w-4 h-4" />
                บันทึกรับคืน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================= MODALS ======================= -->

    <!-- Modal: ยืมพัสดุ/ครุภัณฑ์ใหม่ -->
    <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isFormOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" @click.self="closeForm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowLeftRight class="w-5 h-5 text-[#065f46]" />
              </div>
              <h3 class="text-base font-bold text-slate-900">ยืมพัสดุ/ครุภัณฑ์ใหม่</h3>
            </div>
            <button type="button" @click="closeForm" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">รายการที่ต้องการยืม <span class="text-red-500">*</span></label>
              <select v-model="form.assetId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                <option value="" disabled>-- เลือกรายการครุภัณฑ์ --</option>
                <option v-for="a in availableAssetsForBorrow" :key="a.id" :value="a.id">
                  [{{ a.seq }}] {{ a.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">วัตถุประสงค์การยืม <span class="text-red-500">*</span></label>
              <textarea v-model="form.purpose" rows="3" placeholder="เช่น ใช้ประกอบการสอน, ใช้ในกิจกรรม..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"></textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">กำหนดวันส่งคืน <span class="text-red-500">*</span></label>
              <input v-model="form.dueDate" type="date"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
            </div>

            <div v-if="formError" class="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
              <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-600">{{ formError }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center gap-3 px-6 pb-6">
            <button type="button" @click="closeForm"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" :disabled="isSaving" @click="saveForm"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 cursor-pointer">
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              ส่งคำขอยืม
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal: ยืนยันอนุมัติ -->
    <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="approveModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" @click.self="closeApprove">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
          <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">ยืนยันการอนุมัติ</h3>
            <p class="text-sm text-slate-500 mt-1">
              อนุมัติการยืม <strong class="text-slate-700">{{ approveModal.record?.asset?.name }}</strong>
              ให้กับ <strong class="text-slate-700">{{ approveModal.record?.borrowerName }}</strong>
            </p>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="closeApprove"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" @click="confirmApprove"
              class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all cursor-pointer">
              ยืนยันอนุมัติ
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal: ปฏิเสธพร้อมระบุเหตุผล -->
    <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="rejectModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" @click.self="closeReject">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <Ban class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-base font-bold text-slate-900">ปฏิเสธคำขอยืม</h3>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">เหตุผลในการปฏิเสธ <span class="text-red-500">*</span></label>
            <textarea v-model="rejectModal.remark" rows="3" placeholder="ระบุเหตุผล..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="closeReject"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" @click="confirmReject"
              class="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer">
              ยืนยันปฏิเสธ
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal: บันทึกรับคืน -->
    <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="returnModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" @click.self="closeReturn">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
              <PackageCheck class="w-5 h-5 text-sky-600" />
            </div>
            <h3 class="text-base font-bold text-slate-900">บันทึกรับคืนครุภัณฑ์</h3>
          </div>
          <p class="text-sm text-slate-500">
            รับคืน <strong class="text-slate-700">{{ returnModal.record?.asset?.name }}</strong>
            จาก <strong class="text-slate-700">{{ returnModal.record?.borrowerName }}</strong>
          </p>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">สภาพครุภัณฑ์ตอนส่งคืน</label>
            <div class="flex gap-2">
              <button
                v-for="c in conditionOptions"
                :key="c"
                type="button"
                @click="returnModal.condition = c"
                :class="[
                  'flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer',
                  returnModal.condition === c
                    ? c === 'ปกติ' ? 'bg-emerald-600 border-emerald-600 text-white' : c === 'ชำรุด' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-red-500 border-red-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                {{ c }}
              </button>
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" @click="closeReturn"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" @click="confirmReturn"
              class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white text-sm font-bold hover:shadow-lg transition-all cursor-pointer">
              ยืนยันรับคืน
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>