<script setup>
import { ref, computed } from 'vue'
import {
  ArrowLeftRight, Plus, X, Check, Loader2, AlertTriangle, Bell,
  CheckCircle2, Ban, PackageCheck, Clock
} from 'lucide-vue-next'

// สิทธิ์การเข้าถึง: ทุก role ยืมได้ (Admin, Staff, User) แต่การอนุมัติ/รับคืน ทำได้เฉพาะ Admin, Staff
// TODO: เชื่อมกับระบบยืนยันตัวตนจริง เช่น decode role จาก JWT หรือข้อมูลผู้ใช้หลัง login
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canManage = computed(() => ['admin', 'staff'].includes(currentRole.value))

const assets = ref([
  { id: 'AST-0071', name: 'โปรเจกเตอร์ Epson EB-X05' },
  { id: 'AST-0088', name: 'กล้องถ่ายภาพ Canon EOS 200D' },
  { id: 'AST-0093', name: 'ลำโพงเคลื่อนที่พร้อมไมโครโฟน' },
  { id: 'AST-0101', name: 'โน้ตบุ๊ก Lenovo ThinkPad' }
])

/* ---------------- วันที่ปัจจุบัน สำหรับคำนวณใกล้/เกินกำหนด ---------------- */
const now = new Date()

function daysUntil(dateStr) {
  const target = new Date(dateStr)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return diff
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

/* ---------------- รายการยืม-คืน (mock ใช้ปี ค.ศ. จริงเพื่อให้คำนวณกำหนดคืนถูกต้อง) ---------------- */
const records = ref([
  {
    id: 'BRW-2569-001',
    assetName: 'โปรเจกเตอร์ Epson EB-X05',
    assetId: 'AST-0071',
    borrower: 'สมชาย ใจดี',
    purpose: 'ใช้ประกอบการสอนวิชาคอมพิวเตอร์ธุรกิจ',
    borrowDate: '2026-07-18',
    dueDate: '2026-07-25',
    returnDate: null,
    condition: null,
    status: 'กำลังยืม'
  },
  {
    id: 'BRW-2569-002',
    assetName: 'กล้องถ่ายภาพ Canon EOS 200D',
    assetId: 'AST-0088',
    borrower: 'สมหญิง รักเรียน',
    purpose: 'บันทึกภาพกิจกรรมวันไหว้ครู',
    borrowDate: '2026-07-10',
    dueDate: '2026-07-15',
    returnDate: null,
    condition: null,
    status: 'กำลังยืม'
  },
  {
    id: 'BRW-2569-003',
    assetName: 'โน้ตบุ๊ก Lenovo ThinkPad',
    assetId: 'AST-0101',
    borrower: 'ครูประจำแผนก',
    purpose: 'ใช้จัดทำเอกสารประกอบการสอน',
    borrowDate: '2026-07-01',
    dueDate: '2026-07-08',
    returnDate: '2026-07-08',
    condition: 'ปกติ',
    status: 'คืนแล้ว'
  },
  {
    id: 'BRW-2569-004',
    assetName: 'ลำโพงเคลื่อนที่พร้อมไมโครโฟน',
    assetId: 'AST-0093',
    borrower: 'สมชาย ใจดี',
    purpose: 'ใช้ในกิจกรรมปฐมนิเทศนักศึกษาใหม่',
    borrowDate: '',
    dueDate: '',
    returnDate: null,
    condition: null,
    status: 'รออนุมัติ'
  }
])

function statusStyle(status) {
  if (status === 'คืนแล้ว') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (status === 'กำลังยืม') return 'bg-sky-50 text-sky-700 border-sky-100'
  if (status === 'เกินกำหนด') return 'bg-red-50 text-red-700 border-red-100'
  if (status === 'ไม่อนุมัติ') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-amber-50 text-amber-700 border-amber-100'
}

// อัปเดตสถานะเป็น "เกินกำหนด" อัตโนมัติถ้ายังไม่คืนและเลยกำหนดแล้ว
records.value.forEach((r) => {
  if (r.status === 'กำลังยืม' && r.dueDate && daysUntil(r.dueDate) < 0) {
    r.status = 'เกินกำหนด'
  }
})

const dueSoonOrOverdue = computed(() =>
  records.value.filter((r) => (r.status === 'กำลังยืม' || r.status === 'เกินกำหนด') && r.dueDate)
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

function saveForm() {
  if (!form.value.assetId || !form.value.purpose.trim() || !form.value.dueDate) {
    formError.value = 'กรุณาเลือกรายการ ระบุวัตถุประสงค์ และกำหนดวันส่งคืนให้ครบถ้วน'
    return
  }
  isSaving.value = true
  formError.value = ''

  // TODO: เชื่อมต่อ API บันทึกคำขอยืมจริงในภายหลัง
  setTimeout(() => {
    const asset = assets.value.find((a) => a.id === form.value.assetId)
    const nextNumber = records.value.length + 1
    records.value.unshift({
      id: `BRW-2569-${String(nextNumber).padStart(3, '0')}`,
      assetName: asset?.name || '',
      assetId: form.value.assetId,
      borrower: 'ผู้ใช้งานปัจจุบัน',
      purpose: form.value.purpose.trim(),
      borrowDate: '',
      dueDate: form.value.dueDate,
      returnDate: null,
      condition: null,
      status: 'รออนุมัติ'
    })
    isSaving.value = false
    isFormOpen.value = false
  }, 600)
}

/* ---------------- อนุมัติการยืม (Admin, Staff) ---------------- */
function approveBorrow(record) {
  record.status = 'กำลังยืม'
  record.borrowDate = new Date().toISOString().slice(0, 10)
}
function rejectBorrow(record) {
  record.status = 'ไม่อนุมัติ'
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

function confirmReturn(record) {
  record.status = 'คืนแล้ว'
  record.returnDate = new Date().toISOString().slice(0, 10)
  record.condition = returnCondition.value
  returningId.value = null
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
          <span class="text-amber-800 truncate">{{ r.assetName }} <span class="text-amber-600">· {{ r.borrower }}</span></span>
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
                <span class="text-xs font-mono text-slate-400">{{ r.id }}</span>
                <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusStyle(r.status)]">{{ r.status }}</span>
              </div>
              <p class="text-sm font-semibold text-slate-800 mt-1.5">{{ r.assetName }} <span class="text-slate-400 font-normal">({{ r.assetId }})</span></p>
              <p class="text-xs text-slate-500 mt-1">ผู้ยืม: {{ r.borrower }} · วัตถุประสงค์: {{ r.purpose }}</p>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 shrink-0" />
                <span v-if="r.borrowDate">ยืมเมื่อ {{ formatThaiDate(r.borrowDate) }} ·</span>
                กำหนดคืน {{ r.dueDate ? formatThaiDate(r.dueDate) : '-' }}
                <span v-if="r.returnDate"> · คืนจริง {{ formatThaiDate(r.returnDate) }} ({{ r.condition }})</span>
              </p>
            </div>

            <div v-if="canManage" class="flex items-center gap-2 shrink-0">
              <template v-if="r.status === 'รออนุมัติ'">
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
                v-else-if="r.status === 'กำลังยืม' || r.status === 'เกินกำหนด'"
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
                <option v-for="a in assets" :key="a.id" :value="a.id">{{ a.name }}</option>
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