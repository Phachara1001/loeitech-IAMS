<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeftRight, Plus, X, Check, Loader2, AlertTriangle, Bell,
  CheckCircle2, Ban, PackageCheck, Clock
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// สิทธิ์การเข้าถึง: ทุก role ยืมได้ (Admin, Staff, User) แต่การอนุมัติ/รับคืน ทำได้เฉพาะ Admin, Staff
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

// กรองเฉพาะครุภัณฑ์ที่มีสถานะ Active เท่านั้นสำหรับให้เลือกยืมใน dropdown
const availableAssetsForBorrow = computed(() => {
  return assets.value.filter(a => a.status === 'Active' || a.status === 'active')
})

/* ---------------- วันที่ปัจจุบัน สำหรับคำนวณใกล้/เกินกำหนด ---------------- */
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

function statusStyle(status) {
  if (status === 'RETURNED' || status === 'คืนแล้ว') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (status === 'BORROWED' || status === 'กำลังยืม') return 'bg-sky-50 text-sky-700 border-sky-100'
  if (status === 'OVERDUE' || status === 'เกินกำหนด') return 'bg-red-50 text-red-700 border-red-100'
  if (status === 'REJECTED' || status === 'ไม่อนุมัติ') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-amber-50 text-amber-700 border-amber-100' // PENDING
}

// ตรวจสอบกำหนดคืนและแจ้งเตือน
const dueSoonOrOverdue = computed(() =>
  records.value.filter((r) => (r.status === 'BORROWED') && r.dueDate)
    .map((r) => ({ ...r, daysLeft: daysUntil(r.dueDate) }))
    .filter((r) => r.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
)

/* ---------------- ฟอร์มยืมใหม่ ---------------- */
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
    const payload = {
      assetId: Number(form.value.assetId),
      borrowerName: currentUserName.value,
      borrowerDept: 'งานพัสดุกลาง',
      borrowDate: todayStr,
      dueDate: form.value.dueDate,
      purpose: form.value.purpose.trim()
    }

    await inventoryApi.createBorrow(payload)
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

/* ---------------- อนุมัติการยืม (Admin, Staff) ---------------- */
async function approveBorrow(record) {
  if (confirm(`ยืนยันการอนุมัติใบยืมเลขที่ ${record.borrowCode || record.id} ?`)) {
    try {
      await inventoryApi.approveBorrow(record.id, {
        approvedBy: currentUserName.value
      })
      toast.success('อนุมัติคำขอยืมครุภัณฑ์เรียบร้อย')
      await fetchData()
    } catch (err) {
      toast.error('อนุมัติไม่สำเร็จ: ' + err.message)
    }
  }
}

async function rejectBorrow(record) {
  const remark = prompt(`ระบุเหตุผลในการปฏิเสธการยืมครุภัณฑ์:`)
  if (remark !== null && remark.trim() !== '') {
    try {
      await inventoryApi.rejectBorrow(record.id, {
        approvedBy: currentUserName.value,
        remark: remark.trim()
      })
      toast.success('ปฏิเสธคำขอยืมพัสดุครุภัณฑ์เรียบร้อย')
      await fetchData()
    } catch (err) {
      toast.error('ปฏิเสธการยืมไม่สำเร็จ: ' + err.message)
    }
  }
}

/* ---------------- บันทึกรับคืน (Admin, Staff) ---------------- */
const returningId = ref(null)
const returnCondition = ref('ปกติ')
const conditionOptions = ['ปกติ', 'ชำรุด', 'สูญหาย']

function openReturn(record) {
  returningId.value = record.id
  returnCondition.value = 'ปกติ'
}
function closeReturn() { returningId.value = null }

async function confirmReturn(record) {
  try {
    await inventoryApi.returnBorrow(record.id, {
      returnedTo: currentUserName.value,
      remark: `ส่งคืนครุภัณฑ์ในสภาพ: ${returnCondition.value}`
    })
    toast.success('บันทึกรับคืนครุภัณฑ์เรียบร้อยแล้ว!')
    returningId.value = null
    await fetchData()
  } catch (err) {
    toast.error('บันทึกรับคืนไม่สำเร็จ: ' + err.message)
  }
}
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
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
    <div v-if="dueSoonOrOverdue.length > 0" class="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
      <div class="flex items-center gap-2 mb-3">
        <Bell class="w-4.5 h-4.5 text-amber-600" />
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

    <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-emerald-50 bg-emerald-50/20">
        <p class="text-sm text-slate-500">ทั้งหมด <span class="font-bold text-[#065f46]">{{ records.length }}</span> รายการ</p>
        <button
          type="button"
          @click="openForm"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Plus class="w-4 h-4" />
          ยืมพัสดุ/ครุภัณฑ์ใหม่
        </button>
      </div>

      <div class="divide-y divide-slate-100">
        <div v-for="r in records" :key="r.id" class="p-5 hover:bg-emerald-50/40 transition-colors border-l-4 border-transparent hover:border-[#065f46]">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-mono text-slate-400">{{ r.borrowCode || r.id }}</span>
                <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusStyle(r.status)]">
                  {{ r.status === 'PENDING' ? 'รออนุมัติ' : r.status === 'BORROWED' ? 'กำลังยืม' : r.status === 'RETURNED' ? 'คืนแล้ว' : r.status === 'REJECTED' ? 'ไม่อนุมัติ' : r.status }}
                </span>
              </div>
              <p class="text-sm font-semibold text-slate-800 mt-1.5">{{ r.asset?.name || 'ครุภัณฑ์' }} <span class="text-slate-400 font-normal">({{ r.asset?.seq || '-' }})</span></p>
              <p class="text-xs text-slate-500 mt-1">ผู้ยืม: {{ r.borrowerName }} · แผนก: {{ r.borrowerDept }} · วัตถุประสงค์: {{ r.purpose }}</p>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 shrink-0" />
                <span v-if="r.borrowDate">ยืมเมื่อ {{ formatThaiDate(r.borrowDate) }} ·</span>
                กำหนดคืน {{ r.dueDate ? formatThaiDate(r.dueDate) : '-' }}
                <span v-if="r.returnDate"> · คืนจริง {{ formatThaiDate(r.returnDate) }} ({{ r.remark || 'สภาพปกติ' }})</span>
              </p>
            </div>

            <div v-if="canManage" class="flex items-center gap-2 shrink-0">
              <template v-if="r.status === 'PENDING'">
                <button type="button" @click="approveBorrow(r)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-sm transition-all">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  อนุมัติ
                </button>
                <button type="button" @click="rejectBorrow(r)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-sm transition-all">
                  <Ban class="w-3.5 h-3.5" />
                  ไม่อนุมัติ
                </button>
              </template>
              <button
                v-else-if="r.status === 'BORROWED' || r.status === 'OVERDUE'"
                type="button"
                @click="openReturn(r)"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all"
              >
                <PackageCheck class="w-3.5 h-3.5" />
                บันทึกรับคืน
              </button>
            </div>
          </div>

          <!-- แผงบันทึกรับคืน (inline) -->
          <div v-if="returningId === r.id" class="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">ประเมินสภาพตอนส่งคืน</label>
            <select v-model="returnCondition" class="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
              <option v-for="c in conditionOptions" :key="c" :value="c">{{ c }}</option>
            </select>
            <div class="flex items-center gap-2 mt-3">
              <button type="button" @click="confirmReturn(r)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-sm hover:shadow-md transition-all">
                <Check class="w-3.5 h-3.5" />
                ยืนยันรับคืน
              </button>
              <button type="button" @click="closeReturn" class="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</button>
            </div>
          </div>
        </div>

        <div v-if="records.length === 0" class="py-16 text-center text-slate-400 text-sm">ยังไม่มีรายการยืม-คืน</div>
      </div>
    </div>

    <!-- Modal ฟอร์มยืมใหม่ -->
    <Transition
      enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div v-if="isFormOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4" @click.self="closeForm">
        <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-900/5 w-full max-w-md relative overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-[#065f46] via-emerald-400 to-[#065f46]"></div>
          <div class="p-6">
          <button type="button" @click="closeForm" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all" aria-label="ปิด">
            <X class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
              <ArrowLeftRight class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">ยืมพัสดุ/ครุภัณฑ์ใหม่</h3>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">รายการที่ต้องการยืม</label>
              <select v-model="form.assetId" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                <option value="" disabled>-- เลือกรายการ --</option>
                <option v-for="a in availableAssetsForBorrow" :key="a.id" :value="a.id">
                  [{{ a.seq }}] {{ a.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">วัตถุประสงค์การยืม</label>
              <textarea v-model="form.purpose" rows="3" placeholder="เช่น ใช้ประกอบการสอน, ใช้ในกิจกรรม..." class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">กำหนดวันส่งคืน</label>
              <input v-model="form.dueDate" type="date" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
            </div>

            <div v-if="formError" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
              <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-600">{{ formError }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button type="button" @click="closeForm" class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">ยกเลิก</button>
            <button type="button" :disabled="isSaving" @click="saveForm" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-[#065f46] to-[#047857] text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0">
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              ส่งคำขอยืม
            </button>
          </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>