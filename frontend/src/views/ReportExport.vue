<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, Download, Calendar, Filter, FileSpreadsheet,
  CheckCircle2, Loader2, AlertTriangle, ShieldAlert,
  ClipboardList, Boxes, Truck, Wrench, FileWarning, History, Check
} from 'lucide-vue-next'
import ThaiDatePicker from '../components/ThaiDatePicker.vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'

const toast = useToast()

// สิทธิ์การเข้าถึง: Admin, Staff เท่านั้น
// TODO: เชื่อมกับระบบยืนยันตัวตนจริง เช่น decode role จาก JWT หรือข้อมูลผู้ใช้หลัง login
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canAccess = computed(() => ['admin', 'staff'].includes(currentRole.value))

/* ---------------- ตัวกรองข้อมูล ---------------- */
const fiscalYears = [2570, 2569, 2568, 2567]
const departments = ['ทุกหน่วยงาน', 'งานพัสดุ', 'แผนกช่างไฟฟ้า', 'แผนกช่างยนต์', 'งานบุคคล']
const categories = ['ทุกประเภท', 'พัสดุสิ้นเปลือง', 'ครุภัณฑ์']

const filters = ref({
  fiscalYear: 2569,
  dateFrom: '',
  dateTo: '',
  department: 'ทุกหน่วยงาน',
  category: 'ทุกประเภท'
})

// รายงานที่ backend รองรับจริงในตอนนี้ — อีก 3 รายงานยังเลือกได้ในหน้านี้ แต่จะแจ้งเตือนตอนส่งออกว่ายังไม่รองรับ
const SUPPORTED_REPORT_KEYS = ['asset_register', 'consumable_ledger']

/* ---------------- ประเภทรายงาน ---------------- */
const reportTypes = [
  {
    key: 'consumable_ledger',
    title: 'บัญชีคุมพัสดุสิ้นเปลือง',
    description: 'สรุปยอดรับเข้า-จ่ายออก และคงเหลือของพัสดุสิ้นเปลืองแต่ละรายการ',
    icon: Boxes
  },
  {
    key: 'asset_register',
    title: 'ทะเบียนครุภัณฑ์',
    description: 'รายการครุภัณฑ์ทั้งหมดพร้อมสถานะและหน่วยงานที่รับผิดชอบ',
    icon: ClipboardList
  },
  {
    key: 'asset_distribution',
    title: 'รายงานการจ่ายครุภัณฑ์ให้หน่วยงาน',
    description: 'สรุปการจ่าย/โอนย้ายครุภัณฑ์ไปยังหน่วยงานต่าง ๆ ในช่วงเวลาที่กำหนด',
    icon: Truck
  },
  {
    key: 'movement_history',
    title: 'ประวัติการเคลื่อนไหว/ซ่อมบำรุงครุภัณฑ์',
    description: 'ประวัติการซ่อมแซม เคลื่อนย้าย และตรวจสอบครุภัณฑ์',
    icon: Wrench
  },
  {
    key: 'damaged_assets',
    title: 'รายงานครุภัณฑ์ชำรุดประจำปี',
    description: 'สรุปครุภัณฑ์ที่ชำรุด เสียหาย หรือรอจำหน่ายในปีงบประมาณที่เลือก',
    icon: FileWarning,
    highlight: true
  }
]

const selectedReports = ref([])

function toggleReport(key) {
  const index = selectedReports.value.indexOf(key)
  if (index === -1) selectedReports.value.push(key)
  else selectedReports.value.splice(index, 1)
}

function selectAllReports() {
  selectedReports.value = reportTypes.map((r) => r.key)
}
function clearReports() {
  selectedReports.value = []
}

/* ---------------- รูปแบบไฟล์ ---------------- */
const exportFormat = ref('excel') // 'excel' | 'pdf'

/* ---------------- ประวัติการส่งออก (โหลดจาก backend จริง) ---------------- */
const isExporting = ref(false)
const exportError = ref('')
const showSuccess = ref(false)
const successMessage = ref('')

const exportHistory = ref([])
const isLoadingHistory = ref(true)

async function loadExportHistory() {
  isLoadingHistory.value = true
  try {
    const { data } = await api.get('/api/reports/export-history')
    exportHistory.value = data.data || []
  } catch (err) {
    toast.error(err.message || 'โหลดประวัติการส่งออกไม่สำเร็จ')
  } finally {
    isLoadingHistory.value = false
  }
}

async function handleExport() {
  exportError.value = ''

  if (selectedReports.value.length === 0) {
    exportError.value = 'กรุณาเลือกรายงานอย่างน้อย 1 รายการก่อนส่งออก'
    return
  }

  const unsupported = selectedReports.value.filter((k) => !SUPPORTED_REPORT_KEYS.includes(k))
  if (exportFormat.value === 'pdf') {
    exportError.value = 'การส่งออกเป็น PDF ยังไม่รองรับในตอนนี้ กรุณาเลือกส่งออกเป็น Excel ไปก่อน'
    return
  }
  if (unsupported.length === selectedReports.value.length) {
    exportError.value = 'รายงานที่เลือกทั้งหมดยังไม่รองรับการส่งออก กรุณาเลือก "บัญชีคุมพัสดุสิ้นเปลือง" หรือ "ทะเบียนครุภัณฑ์"'
    return
  }

  isExporting.value = true

  try {
    const response = await api.post(
      '/api/reports/export',
      {
        reportKeys: selectedReports.value,
        format: exportFormat.value,
        filters: {
          department: filters.value.department,
          category: filters.value.category,
          dateFrom: filters.value.dateFrom || undefined,
          dateTo: filters.value.dateTo || undefined
        }
      },
      { responseType: 'blob' }
    )

    // สั่งดาวน์โหลดไฟล์จริงที่ browser
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `report-${Date.now()}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)

    successMessage.value = unsupported.length > 0
      ? `ส่งออกสำเร็จ (ยกเว้นรายงานที่ยังไม่รองรับ: ${unsupported.length} รายการ)`
      : 'ส่งออกรายงานเรียบร้อยแล้ว ระบบได้บันทึกลงในประวัติการส่งออกด้านล่าง'
    toast.success('ส่งออกรายงานเรียบร้อยแล้ว')
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)

    await loadExportHistory()
  } catch (err) {
    // response เป็น blob ตอน error ด้วย ต้องอ่านข้อความ error ออกมาจาก blob เอง
    let message = err.message || 'ส่งออกรายงานไม่สำเร็จ'
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const parsed = JSON.parse(text)
        message = parsed.message || message
      } catch (_) { /* เก็บ message เดิมไว้ถ้า parse ไม่ได้ */ }
    }
    exportError.value = message
    toast.error(message)
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadExportHistory()
})
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <FileSpreadsheet class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">ออกรายงานและส่งออกข้อมูล</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">จัดทำรายงานสรุปประจำปีงบประมาณและส่งออกเป็นไฟล์ Excel หรือ PDF</p>
        </div>
      </div>
    </div>

    <!-- กันสิทธิ์: Admin, Staff เท่านั้น -->
    <div v-if="!canAccess" class="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center text-center">
      <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <ShieldAlert class="w-7 h-7 text-red-500" />
      </div>
      <h2 class="text-lg font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p class="text-sm text-slate-500 mt-1.5 max-w-sm">
        หน้าออกรายงานและส่งออกข้อมูลใช้ได้เฉพาะผู้ใช้งานระดับ "ผู้ดูแลระบบ" และ "เจ้าหน้าที่" เท่านั้น
      </p>
    </div>

    <template v-else>
      <!-- แจ้งเตือนส่งออกสำเร็จ -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showSuccess" class="mb-6 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-700">
          <CheckCircle2 class="w-5 h-5 shrink-0" />
          <p class="text-sm font-medium">{{ successMessage }}</p>
        </div>
      </Transition>

      <!-- ตัวกรองข้อมูล -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
            <Filter class="w-4 h-4 text-[#065f46]" />
          </div>
          <h3 class="text-lg font-bold text-slate-900">ตัวกรองข้อมูลรายงาน</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">ปีงบประมาณ</label>
            <select v-model="filters.fiscalYear" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
              <option v-for="y in fiscalYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">หน่วยงาน/ฝ่าย</label>
            <select v-model="filters.department" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">ประเภทข้อมูล</label>
            <select v-model="filters.category" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">ตั้งแต่วันที่</label>
                <ThaiDatePicker v-model="filters.dateFrom" type="date" inputClass="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition bg-white" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">ถึงวันที่</label>
                <ThaiDatePicker v-model="filters.dateTo" type="date" inputClass="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition bg-white" />
              </div>
            </div>
        </div>
      </div>

      <!-- พิมพ์เอกสารด่วน -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
            <FileText class="w-4 h-4 text-[#065f46]" />
          </div>
          <h3 class="text-lg font-bold text-slate-900">พิมพ์เอกสารด่วน (Print)</h3>
        </div>
        <div class="flex flex-col sm:flex-row flex-wrap gap-4">
          <router-link to="/print-asset-movement" class="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold transition-colors">
            <ClipboardList class="w-5 h-5" />
            พิมพ์รายงานประวัติการเคลื่อนไหวของครุภัณฑ์
          </router-link>
          <router-link to="/print-item-movement" class="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-semibold transition-colors">
            <Boxes class="w-5 h-5" />
            พิมพ์รายงานประวัติการเคลื่อนไหวของพัสดุ
          </router-link>
        </div>
      </div>

      <!-- เลือกรายงานที่จะส่งออก -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <ClipboardList class="w-4 h-4 text-[#065f46]" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">เลือกรายงานที่ต้องการส่งออก</h3>
          </div>
          <div class="flex items-center gap-3 text-xs font-bold">
            <button type="button" @click="selectAllReports" class="text-[#065f46] hover:underline">เลือกทั้งหมด</button>
            <span class="text-slate-300">|</span>
            <button type="button" @click="clearReports" class="text-slate-400 hover:underline">ล้างการเลือก</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="report in reportTypes"
            :key="report.key"
            type="button"
            @click="toggleReport(report.key)"
            :class="[
              'flex items-start gap-3 text-left p-4 rounded-xl border-2 transition-all shadow-sm',
              selectedReports.includes(report.key)
                ? 'border-[#065f46] bg-emerald-50/60 shadow-md ring-2 ring-emerald-100'
                : 'border-slate-200 hover:border-emerald-200 hover:shadow-md'
            ]"
          >
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                report.highlight ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              ]"
            >
              <component :is="report.icon" class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-slate-800">{{ report.title }}</p>
                <span v-if="report.highlight" class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full shrink-0">
                  ประจำปี
                </span>
                <span v-if="!SUPPORTED_REPORT_KEYS.includes(report.key)" class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                  เร็วๆ นี้
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ report.description }}</p>
            </div>
            <div
              :class="[
                'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                selectedReports.includes(report.key) ? 'bg-[#065f46] border-[#065f46]' : 'border-slate-300'
              ]"
            >
              <Check v-if="selectedReports.includes(report.key)" class="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      </div>

      <!-- รูปแบบไฟล์ + ปุ่มส่งออก -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p class="text-sm font-medium text-slate-700 mb-2">รูปแบบไฟล์ที่ต้องการส่งออก</p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="exportFormat = 'excel'"
                :class="[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                  exportFormat === 'excel' ? 'border-[#065f46] bg-emerald-50 text-[#065f46] shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:shadow-sm'
                ]"
              >
                <FileSpreadsheet class="w-4 h-4" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                @click="toast.info('รูปแบบ PDF ยังไม่พร้อมใช้งานในตอนนี้ กำลังพัฒนาอยู่')"
                title="ยังไม่รองรับ กำลังพัฒนา"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 cursor-not-allowed"
              >
                <FileText class="w-4 h-4" />
                PDF (.pdf)
                <span class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">เร็วๆ นี้</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            :disabled="isExporting"
            @click="handleExport"
            class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-6 py-3 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 shrink-0"
          >
            <Loader2 v-if="isExporting" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ isExporting ? 'กำลังส่งออก...' : `ส่งออกรายงาน (${selectedReports.length})` }}
          </button>
        </div>

        <div v-if="exportError" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 mt-4">
          <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p class="text-sm text-red-600">{{ exportError }}</p>
        </div>
      </div>

      <!-- ประวัติการส่งออก -->
      <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/40 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow p-6">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center ring-1 ring-emerald-200 shadow-sm">
            <History class="w-4 h-4 text-[#065f46]" />
          </div>
          <h3 class="text-lg font-bold text-slate-900">ประวัติการส่งออกล่าสุด</h3>
        </div>

        <div v-if="isLoadingHistory" class="py-10 flex flex-col items-center justify-center text-emerald-700/60">
          <Loader2 class="w-5 h-5 animate-spin mb-2" />
          <p class="text-sm">กำลังโหลดประวัติการส่งออก...</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="record in exportHistory"
            :key="record.id"
            class="flex items-center justify-between gap-4 py-3.5 px-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0', record.format === 'Excel' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600']">
                <FileSpreadsheet v-if="record.format === 'Excel'" class="w-4 h-4" />
                <FileText v-else class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ record.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ record.date }} · โดย {{ record.by }}</p>
              </div>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200">
              {{ record.format }}
            </span>
          </div>

          <div v-if="exportHistory.length === 0" class="py-10 text-center text-emerald-700/60 text-sm bg-white/60 rounded-xl">
            ยังไม่มีประวัติการส่งออกข้อมูล
          </div>
        </div>
      </div>
    </template>
  </div>
</template>