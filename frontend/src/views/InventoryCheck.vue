<script setup>
import { ref, computed } from 'vue'
import {
  ClipboardCheck, ShieldAlert, PlayCircle, Download, Loader2,
  CheckCircle2, AlertTriangle, PackageX, HelpCircle, Search
} from 'lucide-vue-next'

// สิทธิ์การเข้าถึง: Admin, Staff เท่านั้น
// TODO: เชื่อมกับระบบยืนยันตัวตนจริง เช่น decode role จาก JWT หรือข้อมูลผู้ใช้หลัง login
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canAccess = computed(() => ['admin', 'staff'].includes(currentRole.value))

const fiscalYears = [2570, 2569, 2568, 2567]
const activeRoundYear = ref(null) // ปีงบประมาณของรอบที่เปิดอยู่ (null = ยังไม่เปิดรอบ)
const selectedYear = ref(2569)

const conditionOptions = [
  { value: 'ยังไม่ตรวจ', style: 'bg-slate-50 text-slate-500 border-slate-200', icon: HelpCircle },
  { value: 'ปกติ', style: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  { value: 'ชำรุด', style: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertTriangle },
  { value: 'เสื่อมสภาพ', style: 'bg-orange-50 text-orange-700 border-orange-100', icon: AlertTriangle },
  { value: 'สูญหาย', style: 'bg-red-50 text-red-700 border-red-100', icon: PackageX }
]
function conditionMeta(value) {
  return conditionOptions.find((c) => c.value === value) || conditionOptions[0]
}

/* ---------------- รายการพัสดุ/ครุภัณฑ์สำหรับตรวจนับ (mock) ---------------- */
const checklistItems = ref([
  { id: 'AST-0001', name: 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ Acer Veriton', location: 'อาคาร 1 ห้อง 201', checked: 'ปกติ' },
  { id: 'AST-0011', name: 'เครื่องปรับอากาศ Daikin 18000 BTU', location: 'อาคาร 3 สำนักงานงานพัสดุ', checked: 'ปกติ' },
  { id: 'AST-0032', name: 'เครื่องพิมพ์ Laser HP LaserJet P1102', location: 'อาคาร 1 ห้อง 101', checked: 'ชำรุด' },
  { id: 'AST-0044', name: 'ตู้เอกสารเหล็ก 4 ลิ้นชัก', location: 'อาคาร 3 ห้องเก็บพัสดุ', checked: 'ยังไม่ตรวจ' },
  { id: 'AST-0058', name: 'เก้าอี้สำนักงานผู้บริหาร', location: 'อาคาร 3 สำนักงานงานพัสดุ', checked: 'ยังไม่ตรวจ' },
  { id: 'AST-0071', name: 'โปรเจกเตอร์ Epson EB-X05', location: 'อาคาร 1 ห้อง 201', checked: 'ยังไม่ตรวจ' },
  { id: 'AST-0090', name: 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex', location: 'อาคาร 3 ห้องปฏิบัติการ', checked: 'ยังไม่ตรวจ' }
])

const searchQuery = ref('')
const filteredItems = computed(() =>
  checklistItems.value.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const progress = computed(() => {
  const total = checklistItems.value.length
  const done = checklistItems.value.filter((i) => i.checked !== 'ยังไม่ตรวจ').length
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
})

function updateCondition(item, value) {
  // TODO: เชื่อมต่อ API บันทึกผลตรวจนับจริงในภายหลัง
  item.checked = value
}

/* ---------------- เปิดรอบตรวจสอบ ---------------- */
const isStarting = ref(false)
function startRound() {
  isStarting.value = true
  setTimeout(() => {
    activeRoundYear.value = selectedYear.value
    checklistItems.value.forEach((i) => (i.checked = 'ยังไม่ตรวจ'))
    isStarting.value = false
  }, 600)
}

/* ---------------- Export รายงานสรุป ---------------- */
const isExporting = ref(false)
const showSuccess = ref(false)
function exportReport() {
  isExporting.value = true
  // TODO: เชื่อมต่อ API สร้างไฟล์รายงานสรุปตามฟอร์มราชการจริงในภายหลัง
  setTimeout(() => {
    isExporting.value = false
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  }, 1000)
}
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <ClipboardCheck class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">ตรวจสอบพัสดุประจำปี</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">เปิดรอบตรวจสอบพัสดุ/ครุภัณฑ์ประจำปีงบประมาณ สำหรับคณะกรรมการตรวจรับ</p>
        </div>
      </div>
    </div>

    <!-- กันสิทธิ์: Admin, Staff เท่านั้น -->
    <div v-if="!canAccess" class="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center text-center">
      <div class="w-14 h-14 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
        <ShieldAlert class="w-7 h-7 text-red-500" />
      </div>
      <h2 class="text-lg font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p class="text-sm text-slate-500 mt-1.5 max-w-sm">
        หน้าตรวจสอบพัสดุประจำปีใช้ได้เฉพาะผู้ใช้งานระดับ "ผู้ดูแลระบบ" และ "เจ้าหน้าที่" เท่านั้น
      </p>
    </div>

    <template v-else>
      <!-- แจ้งเตือนส่งออกสำเร็จ -->
      <Transition
        enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showSuccess" class="mb-6 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-700">
          <CheckCircle2 class="w-5 h-5 shrink-0" />
          <p class="text-sm font-medium">ส่งออกรายงานสรุปผลการตรวจสอบพัสดุประจำปีเรียบร้อยแล้ว</p>
        </div>
      </Transition>

      <!-- แถบเปิดรอบตรวจสอบ -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div class="flex items-end gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">ปีงบประมาณ</label>
              <select v-model="selectedYear" class="px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                <option v-for="y in fiscalYears" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div v-if="activeRoundYear" class="text-sm text-emerald-700 flex items-center gap-1.5 pb-2.5">
              <CheckCircle2 class="w-4 h-4" />
              เปิดรอบตรวจสอบปีงบประมาณ {{ activeRoundYear }} อยู่
            </div>
          </div>

          <button
            type="button"
            :disabled="isStarting"
            @click="startRound"
            class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 shrink-0"
          >
            <Loader2 v-if="isStarting" class="w-4 h-4 animate-spin" />
            <PlayCircle v-else class="w-4 h-4" />
            {{ activeRoundYear ? 'เปิดรอบตรวจสอบใหม่' : 'เปิดรอบตรวจสอบ' }}
          </button>
        </div>

        <!-- ความคืบหน้า -->
        <div v-if="activeRoundYear" class="mt-5">
          <div class="flex items-center justify-between text-sm mb-1.5">
            <span class="text-slate-600">ความคืบหน้าการตรวจนับ</span>
            <span class="font-semibold text-slate-800">{{ progress.done }} / {{ progress.total }} รายการ ({{ progress.percent }}%)</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-[#065f46] rounded-full transition-all" :style="{ width: progress.percent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- ตารางตรวจนับ -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-emerald-50 bg-emerald-50/20">
          <div class="relative sm:w-72">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อหรือรหัสรายการ..."
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
            />
          </div>
        </div>

        <div class="overflow-x-auto max-h-[55vh] overflow-y-auto no-scrollbar">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รหัส</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อรายการ</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ตำแหน่งที่ตั้ง</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">สถานะจากการตรวจนับจริง</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in filteredItems" :key="item.id" class="group hover:bg-emerald-50/60 transition-colors">
                <td class="px-4 py-3 text-slate-500 font-mono text-xs border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ item.id }}</td>
                <td class="px-4 py-3 text-slate-800 font-medium">{{ item.name }}</td>
                <td class="px-4 py-3 text-slate-500">{{ item.location }}</td>
                <td class="px-4 py-3">
                  <select
                    :value="item.checked"
                    :disabled="!activeRoundYear"
                    @change="updateCondition(item, $event.target.value)"
                    :class="['rounded-full border text-xs font-semibold pl-3 pr-7 py-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-shadow', conditionMeta(item.checked).style]"
                  >
                    <option v-for="c in conditionOptions" :key="c.value" :value="c.value">{{ c.value }}</option>
                  </select>
                </td>
              </tr>
              <tr v-if="filteredItems.length === 0">
                <td colspan="4" class="px-4 py-12 text-center text-slate-400">ไม่พบรายการที่ตรงกับการค้นหา</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="!activeRoundYear" class="px-4 py-3 border-t border-emerald-50 bg-amber-50/40 text-xs text-amber-600 flex items-center gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
          กรุณาเปิดรอบตรวจสอบก่อน จึงจะสามารถอัปเดตสถานะจากการตรวจนับจริงได้
        </p>
      </div>

      <!-- Export รายงานสรุป -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
            <ClipboardCheck class="w-5 h-5" />
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800">รายงานสรุปผลการตรวจสอบพัสดุประจำปี</p>
            <p class="text-xs text-slate-500 mt-0.5">จัดทำตามฟอร์มราชการ สำหรับนำเสนอหัวหน้าหน่วยงาน</p>
          </div>
        </div>
        <button
          type="button"
          :disabled="isExporting"
          @click="exportReport"
          class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 shrink-0"
        >
          <Loader2 v-if="isExporting" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          {{ isExporting ? 'กำลังส่งออก...' : 'Export รายงานสรุป' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style>
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>