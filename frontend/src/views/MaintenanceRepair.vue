<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wrench, Plus, X, Check, Loader2, AlertTriangle, Image as ImageIcon,
  CheckCircle2, Ban, History, DollarSign, Camera
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// สิทธิ์การเข้าถึง: ทุก role แจ้งซ่อมได้ (Admin, Staff, User) แต่การประเมิน/อนุมัติทำได้เฉพาะ Admin, Staff
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canManage = computed(() => ['admin', 'staff', 'Admin', 'Staff'].includes(currentRole.value))
const currentUserName = ref(localStorage.getItem('tcaims_name') || 'ผู้ใช้ทั่วไป')

const tabs = [
  { key: 'new', label: 'แจ้งซ่อมใหม่', icon: Plus, color: 'text-[#065f46]', chip: 'bg-emerald-50 ring-emerald-100' },
  { key: 'list', label: 'รายการแจ้งซ่อม', icon: Wrench, color: 'text-amber-600', chip: 'bg-amber-50 ring-amber-100' },
  { key: 'history', label: 'ประวัติการซ่อม/ค่าใช้จ่าย', icon: History, color: 'text-sky-600', chip: 'bg-sky-50 ring-sky-100' }
]
const activeTab = ref('new')

const assets = ref([])
const repairRequests = ref([])
const isLoading = ref(false)
const loadError = ref('')

async function fetchData() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [assetsData, repairsData] = await Promise.all([
      inventoryApi.getAssets(),
      inventoryApi.getRepairs()
    ])
    assets.value = assetsData
    repairRequests.value = repairsData
  } catch (err) {
    loadError.value = err.message || 'โหลดข้อมูลล้มเหลว'
    toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้: ' + loadError.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// รายการซ่อมแซมที่กำลังรอดำเนินการ (PENDING, APPROVED, REPAIRING)
const activeRepairs = computed(() => {
  return repairRequests.value.filter(r => r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'REPAIRING')
})

// ประวัติซ่อมเสร็จสิ้นแล้ว หรือถูกปฏิเสธ (COMPLETED, REJECTED)
const repairHistory = computed(() => {
  return repairRequests.value.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED')
})

// คำนวณยอดรวมค่าใช้จ่ายการซ่อมแซมทั้งหมด
const totalRepairCost = computed(() => {
  return repairHistory.value.reduce((sum, r) => sum + (r.repairCost || 0), 0)
})

/* ---------------- ฟอร์มแจ้งซ่อม ---------------- */
const form = ref({ assetId: '', detail: '', urgency: 'NORMAL', photoPreview: null })
const fileInputRef = ref(null)
const formError = ref('')
const isSubmitting = ref(false)
const showSubmitSuccess = ref(false)

function triggerFileInput() {
  fileInputRef.value?.click()
}
function handlePhotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    formError.value = 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
    return
  }
  formError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => { form.value.photoPreview = e.target.result }
  reader.readAsDataURL(file)
}

async function submitRepairRequest() {
  if (!form.value.assetId || !form.value.detail.trim()) {
    formError.value = 'กรุณาเลือกครุภัณฑ์และระบุอาการชำรุดให้ครบถ้วน'
    return
  }
  isSubmitting.value = true
  formError.value = ''

  try {
    const payload = {
      assetId: Number(form.value.assetId),
      reporterName: currentUserName.value,
      description: form.value.detail.trim(),
      urgency: form.value.urgency
    }

    await inventoryApi.createRepair(payload)
    toast.success('ยื่นเรื่องแจ้งซ่อมครุภัณฑ์สำเร็จ!')
    form.value = { assetId: '', detail: '', urgency: 'NORMAL', photoPreview: null }
    showSubmitSuccess.value = true
    activeTab.value = 'list'
    await fetchData()
    setTimeout(() => { showSubmitSuccess.value = false }, 3000)
  } catch (err) {
    formError.value = err.message || 'ส่งคำขอแจ้งซ่อมไม่สำเร็จ'
    toast.error('เกิดข้อผิดพลาด: ' + formError.value)
  } finally {
    isSubmitting.value = false
  }
}

function statusStyle(status) {
  if (status === 'COMPLETED' || status === 'ซ่อมเสร็จแล้ว') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (status === 'APPROVED' || status === 'REPAIRING' || status === 'อนุมัติส่งซ่อม') return 'bg-sky-50 text-sky-700 border-sky-100'
  if (status === 'REJECTED' || status === 'แทงชำรุด') return 'bg-red-50 text-red-700 border-red-100'
  return 'bg-amber-50 text-amber-700 border-amber-100' // PENDING (รอประเมิน)
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

/* ---------------- ประเมิน/อนุมัติ (Admin, Staff) ---------------- */
const evaluatingId = ref(null)
const evalDecision = ref('')

function openEvaluate(req) {
  evaluatingId.value = req.id
  evalDecision.value = ''
}
function closeEvaluate() {
  evaluatingId.value = null
}

async function approveRepair(req) {
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'APPROVED',
      approvedBy: currentUserName.value,
      remark: evalDecision.value.trim() || 'เห็นควรส่งซ่อม'
    })
    toast.success('อนุมัติสั่งซ่อมครุภัณฑ์เรียบร้อย')
    evaluatingId.value = null
    await fetchData()
  } catch (err) {
    toast.error('ไม่สามารถอนุมัติได้: ' + err.message)
  }
}

async function markAsDamaged(req) {
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'REJECTED',
      approvedBy: currentUserName.value,
      remark: evalDecision.value.trim() || 'ค่าซ่อมไม่คุ้มค่า เห็นควรทำเรื่องแทงชำรุด/จำหน่ายออก'
    })
    toast.success('ปฏิเสธการซ่อม/ทำเรื่องแทงชำรุดครุภัณฑ์แล้ว')
    evaluatingId.value = null
    await fetchData()
  } catch (err) {
    toast.error('ล้มเหลว: ' + err.message)
  }
}

const completingId = ref(null)
const completeCost = ref('')

function openComplete(req) {
  completingId.value = req.id
  completeCost.value = ''
}
function closeComplete() {
  completingId.value = null
}

async function completeRepair(req) {
  if (!completeCost.value) {
    toast.warning('กรุณาระบุค่าใช้จ่ายการซ่อมจริง')
    return
  }
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'COMPLETED',
      approvedBy: currentUserName.value,
      repairCost: Number(completeCost.value) || 0,
      remark: 'ดำเนินการซ่อมแซมครุภัณฑ์เสร็จสิ้นเรียบร้อย'
    })
    toast.success('บันทึกปิดงานซ่อมแซมสำเร็จ!')
    completingId.value = null
    await fetchData()
  } catch (err) {
    toast.error('บันทึกปิดงานล้มเหลว: ' + err.message)
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
          <Wrench class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">แจ้งซ่อมและประวัติการบำรุงรักษา</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">แจ้งซ่อมครุภัณฑ์ ประเมินความคุ้มค่า และติดตามประวัติ/ค่าใช้จ่ายการซ่อม</p>
        </div>
      </div>
    </div>

    <!-- แจ้งเตือนส่งคำขอสำเร็จ -->
    <Transition
      enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showSubmitSuccess" class="mb-6 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-700">
        <CheckCircle2 class="w-5 h-5 shrink-0" />
        <p class="text-sm font-medium">ส่งคำขอแจ้งซ่อมเรียบร้อยแล้ว รอการประเมินจากเจ้าหน้าที่พัสดุ</p>
      </div>
    </Transition>

    <!-- แท็บ -->
    <div class="flex items-center gap-2 bg-white rounded-2xl border border-emerald-100 shadow-sm p-2 mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0',
          activeTab === tab.key
            ? 'bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        ]"
      >
        <span
          :class="[
            'w-6 h-6 rounded-lg flex items-center justify-center ring-1 shrink-0',
            activeTab === tab.key ? 'bg-white/15 ring-white/20' : `${tab.chip} ring-1`
          ]"
        >
          <component :is="tab.icon" :class="['w-3.5 h-3.5', activeTab === tab.key ? 'text-white' : tab.color]" />
        </span>
        {{ tab.label }}
      </button>
    </div>

    <!-- ===== แท็บ: แจ้งซ่อมใหม่ (ทุก role) ===== -->
    <div v-if="activeTab === 'new'" class="bg-white rounded-2xl border border-[#047857] shadow-sm hover:shadow-md transition-shadow p-6 max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">เลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม</label>
          <select v-model="form.assetId" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
            <option value="" disabled>-- เลือกครุภัณฑ์ --</option>
            <option v-for="a in assets" :key="a.id" :value="a.id">
              [{{ a.seq || '-' }}] {{ a.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">ระดับความเร่งด่วน</label>
          <select v-model="form.urgency" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
            <option value="NORMAL">ปกติ (NORMAL)</option>
            <option value="URGENT">ด่วน (URGENT)</option>
            <option value="CRITICAL">ด่วนที่สุด (CRITICAL)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">อาการชำรุด</label>
          <textarea
            v-model="form.detail"
            rows="4"
            placeholder="อธิบายอาการชำรุดที่พบ เช่น เปิดไม่ติด, มีเสียงดังผิดปกติ..."
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">แนบรูปภาพอาการชำรุด (ถ้ามี)</label>
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 rounded-xl border-2 border-dashed border-emerald-200 flex items-center justify-center overflow-hidden bg-emerald-50/30 shrink-0">
              <img v-if="form.photoPreview" :src="form.photoPreview" alt="ตัวอย่างรูปอาการชำรุด" class="w-full h-full object-cover" />
              <ImageIcon v-else class="w-8 h-8 text-emerald-200" />
            </div>
            <button type="button" @click="triggerFileInput" class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#065f46] text-[#065f46] text-sm font-semibold hover:bg-emerald-50 hover:shadow-md transition-all">
              <Camera class="w-4 h-4" />
              เลือกรูปภาพ
            </button>
            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handlePhotoChange" />
          </div>
        </div>

        <div v-if="formError" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
          <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p class="text-sm text-red-600">{{ formError }}</p>
        </div>

        <button
          type="button"
          :disabled="isSubmitting"
          @click="submitRepairRequest"
          class="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white py-3 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Wrench v-else class="w-4 h-4" />
          {{ isSubmitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอแจ้งซ่อม' }}
        </button>
      </div>
    </div>

    <!-- ===== แท็บ: รายการแจ้งซ่อม ===== -->
    <div v-else-if="activeTab === 'list'" class="bg-white rounded-2xl border border-emerald-100 shadow-sm divide-y divide-slate-100">
      <div v-for="req in activeRepairs" :key="req.id" class="p-5 hover:bg-emerald-50/40 transition-colors border-l-4 border-transparent hover:border-[#065f46]">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="flex gap-3 min-w-0">
            <div class="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
              <ImageIcon class="w-5 h-5 text-slate-300" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-mono text-slate-400">{{ req.repairCode }}</span>
                <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusStyle(req.status)]">
                  {{ req.status === 'PENDING' ? 'รอประเมิน' : req.status === 'APPROVED' ? 'อนุมัติส่งซ่อม' : req.status === 'REPAIRING' ? 'กำลังซ่อม' : req.status }}
                </span>
                <span v-if="req.urgency !== 'NORMAL'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  {{ req.urgency === 'URGENT' ? 'ด่วน' : 'ด่วนที่สุด' }}
                </span>
              </div>
              <p class="text-sm font-semibold text-slate-800 mt-1.5">{{ req.asset?.name || 'ครุภัณฑ์' }} <span class="text-slate-400 font-normal">({{ req.asset?.seq || '-' }})</span></p>
              <p class="text-xs text-slate-500 mt-1">{{ req.description }}</p>
              <p class="text-xs text-slate-400 mt-1">แจ้งโดย {{ req.reporterName }} · {{ formatThaiDate(req.createdAt) }}</p>
              <p v-if="req.remark" class="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span class="font-semibold text-slate-600">ความเห็น/เหตุผล:</span> {{ req.remark }}
              </p>
            </div>
          </div>

          <div v-if="canManage" class="flex items-center gap-2 shrink-0">
            <button v-if="req.status === 'PENDING'" type="button" @click="openEvaluate(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-sm transition-all">
              <CheckCircle2 class="w-3.5 h-3.5" />
              ประเมิน
            </button>
            <button v-else-if="req.status === 'APPROVED' || req.status === 'REPAIRING'" type="button" @click="openComplete(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all">
              <Check class="w-3.5 h-3.5" />
              บันทึกซ่อมเสร็จ
            </button>
          </div>
        </div>

        <!-- แผงประเมิน (inline) -->
        <div v-if="evaluatingId === req.id" class="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">ความเห็นการประเมิน</label>
          <textarea v-model="evalDecision" rows="2" placeholder="ระบุเหตุผล เช่น ความคุ้มค่าของการซ่อมเทียบกับราคาซื้อใหม่..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"></textarea>
          <div class="flex items-center gap-2 mt-3">
            <button type="button" @click="approveRepair(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white shadow-sm hover:bg-sky-700 hover:shadow-md transition-all">
              <CheckCircle2 class="w-3.5 h-3.5" />
              อนุมัติส่งซ่อม
            </button>
            <button type="button" @click="markAsDamaged(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md transition-all">
              <Ban class="w-3.5 h-3.5" />
              ทำเรื่องแทงชำรุด
            </button>
            <button type="button" @click="closeEvaluate" class="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</button>
          </div>
        </div>

        <!-- แผงบันทึกซ่อมเสร็จ (inline) -->
        <div v-if="completingId === req.id" class="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">ค่าใช้จ่ายในการซ่อม (บาท)</label>
          <input v-model="completeCost" type="number" min="0" placeholder="0" class="w-40 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
          <div class="flex items-center gap-2 mt-3">
            <button type="button" @click="completeRepair(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-sm hover:shadow-md transition-all">
              <Check class="w-3.5 h-3.5" />
              บันทึก
            </button>
            <button type="button" @click="closeComplete" class="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</button>
          </div>
        </div>
      </div>

      <div v-if="activeRepairs.length === 0" class="py-16 text-center text-slate-400 text-sm">ยังไม่มีรายการแจ้งซ่อมที่อยู่ระหว่างดำเนินการ</div>
    </div>

    <!-- ===== แท็บ: ประวัติการซ่อม/ค่าใช้จ่าย ===== -->
    <div v-else class="space-y-6">
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3 max-w-xs">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100">
          <DollarSign class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-bold text-slate-900">{{ totalRepairCost.toLocaleString() }} บาท</p>
          <p class="text-sm text-slate-500">ค่าใช้จ่ายซ่อมบำรุงสะสม</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto max-h-[55vh] overflow-y-auto no-scrollbar">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รหัส</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ครุภัณฑ์</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รายละเอียดการซ่อม</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">วันที่ซ่อมเสร็จ</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">ค่าใช้จ่าย</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="h in repairHistory" :key="h.id" class="group hover:bg-emerald-50/60 transition-colors">
                <td class="px-4 py-3 text-slate-500 font-mono text-xs border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ h.repairCode }}</td>
                <td class="px-4 py-3 text-slate-800 font-medium">
                  {{ h.asset?.name || 'ครุภัณฑ์' }} <span class="text-slate-400 font-normal">({{ h.asset?.seq || '-' }})</span>
                </td>
                <td class="px-4 py-3 text-slate-500">
                  {{ h.description }}
                  <p v-if="h.remark" class="text-xs text-slate-400 mt-1">หมายเหตุ: {{ h.remark }}</p>
                </td>
                <td class="px-4 py-3 text-slate-500">{{ formatThaiDate(h.finishDate || h.updatedAt) }}</td>
                <td class="px-4 py-3 text-right text-slate-800 font-semibold">{{ h.repairCost.toLocaleString() }} บาท</td>
              </tr>
              <tr v-if="repairHistory.length === 0">
                <td colspan="5" class="px-4 py-12 text-center text-slate-400">ยังไม่มีประวัติการซ่อม</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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