<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wrench, Plus, X, Check, Loader2, AlertTriangle, Image as ImageIcon,
  CheckCircle2, Ban, History, DollarSign, Camera, Search, Clock
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// สิทธิ์การเข้าถึง: ทุก role แจ้งซ่อมได้ (Admin, Staff, User) แต่การประเมิน/อนุมัติทำได้เฉพาะ Admin, Staff
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canManage = computed(() => ['admin', 'staff', 'Admin', 'Staff'].includes(currentRole.value))
const userObj = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
const currentUserName = ref(userObj.name || 'ผู้ใช้ทั่วไป')

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

// Stats: นับสถานะ
const stats = computed(() => ({
  pending:   repairRequests.value.filter(r => r.status === 'PENDING').length,
  repairing: repairRequests.value.filter(r => r.status === 'APPROVED' || r.status === 'REPAIRING').length,
  done:      repairRequests.value.filter(r => r.status === 'COMPLETED').length,
  rejected:  repairRequests.value.filter(r => r.status === 'REJECTED').length,
}))

/* ---------------- Modal: เลือกครุภัณฑ์ ---------------- */
const assetSelectorOpen = ref(false)
const assetSearchQuery = ref('')
const assetCatFilter = ref('ทั้งหมด')

const assetCategories = computed(() => {
  const cats = new Set(assets.value.map(a => a.category).filter(Boolean))
  return ['ทั้งหมด', ...Array.from(cats)]
})

const filteredAssets = computed(() => {
  return assets.value.filter(a => {
    const q = assetSearchQuery.value.toLowerCase()
    const matchQ = a.name.toLowerCase().includes(q) || (a.seq || '').toLowerCase().includes(q)
    const matchCat = assetCatFilter.value === 'ทั้งหมด' || a.category === assetCatFilter.value
    return matchQ && matchCat
  })
})

const selectedAsset = computed(() => assets.value.find(a => a.id === Number(form.value.assetId)) || null)

function openAssetSelector() {
  assetSearchQuery.value = ''
  assetCatFilter.value = 'ทั้งหมด'
  assetSelectorOpen.value = true
}

function pickAsset(asset) {
  form.value.assetId = asset.id.toString()
  assetSelectorOpen.value = false
}

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

/* ---------------- Modal: ประเมิน ---------------- */
const evalModal = ref({ open: false, record: null, remark: '' })

function openEvaluate(req) {
  evalModal.value = { open: true, record: req, remark: '' }
}
function closeEvaluate() {
  evalModal.value.open = false
}

async function approveRepair() {
  const req = evalModal.value.record
  if (!req) return
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'APPROVED',
      approvedBy: currentUserName.value,
      remark: evalModal.value.remark.trim() || 'เห็นควรส่งซ่อม'
    })
    toast.success('อนุมัติสั่งซ่อมครุภัณฑ์เรียบร้อย')
    closeEvaluate()
    await fetchData()
  } catch (err) {
    toast.error('ไม่สามารถอนุมัติได้: ' + err.message)
  }
}

async function markAsDamaged() {
  const req = evalModal.value.record
  if (!req) return
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'REJECTED',
      approvedBy: currentUserName.value,
      remark: evalModal.value.remark.trim() || 'ค่าซ่อมไม่คุ้มค่า เห็นควรทำเรื่องแทงชำรุด/จำหน่ายออก'
    })
    toast.success('ทำเรื่องแทงชำรุดครุภัณฑ์เรียบร้อย')
    closeEvaluate()
    await fetchData()
  } catch (err) {
    toast.error('ล้มเหลว: ' + err.message)
  }
}

/* ---------------- Modal: บันทึกซ่อมเสร็จ ---------------- */
const completeModal = ref({ open: false, record: null, cost: '' })

function openComplete(req) {
  completeModal.value = { open: true, record: req, cost: '' }
}
function closeComplete() {
  completeModal.value.open = false
}

async function completeRepair() {
  const req = completeModal.value.record
  if (!req) return
  if (!completeModal.value.cost) {
    toast.warning('กรุณาระบุค่าใช้จ่ายการซ่อมจริง')
    return
  }
  try {
    await inventoryApi.updateRepairStatus(req.id, {
      status: 'COMPLETED',
      approvedBy: currentUserName.value,
      repairCost: Number(completeModal.value.cost) || 0,
      remark: 'ดำเนินการซ่อมแซมครุภัณฑ์เสร็จสิ้นเรียบร้อย'
    })
    toast.success('บันทึกปิดงานซ่อมแซมสำเร็จ!')
    closeComplete()
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

    <!-- ===== Summary Cards ===== -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Clock class="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p class="text-2xl font-black text-slate-900 leading-none">{{ stats.pending }}</p>
          <p class="text-xs text-slate-500 mt-0.5">รอประเมิน</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
          <Wrench class="w-5 h-5 text-sky-500" />
        </div>
        <div>
          <p class="text-2xl font-black text-slate-900 leading-none">{{ stats.repairing }}</p>
          <p class="text-xs text-slate-500 mt-0.5">กำลังซ่อม</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p class="text-2xl font-black text-slate-900 leading-none">{{ stats.done }}</p>
          <p class="text-xs text-slate-500 mt-0.5">ซ่อมเสร็จ</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
          <DollarSign class="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <p class="text-lg font-black text-slate-900 leading-none">{{ totalRepairCost.toLocaleString() }}</p>
          <p class="text-xs text-slate-500 mt-0.5">ค่าซ่อมรวม (บาท)</p>
        </div>
      </div>
    </div>

    <!-- แท็บ -->
    <div class="flex items-center gap-2 bg-white rounded-2xl border border-emerald-100 shadow-sm p-2 mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer',
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
        <span>{{ tab.label }}</span>
        <!-- แสดงยอดรวมจำนวนในแต่ละแท็บ -->
        <span v-if="tab.key === 'list' && activeRepairs.length > 0"
          :class="['text-xs px-2 py-0.5 rounded-full font-bold', activeTab === tab.key ? 'bg-white text-[#065f46]' : 'bg-amber-100 text-amber-800']">
          {{ activeRepairs.length }}
        </span>
        <span v-if="tab.key === 'history' && repairHistory.length > 0"
          :class="['text-xs px-2 py-0.5 rounded-full font-bold', activeTab === tab.key ? 'bg-white text-[#047857]' : 'bg-sky-100 text-sky-800']">
          {{ repairHistory.length }}
        </span>
      </button>
    </div>

    <!-- ===== แท็บ: แจ้งซ่อมใหม่ (ทุก role) ===== -->
    <div v-if="activeTab === 'new'" class="flex justify-center">
    <div class="bg-white rounded-2xl border border-[#047857] shadow-sm hover:shadow-md transition-shadow p-6 w-full max-w-xl">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">ครุภัณฑ์ที่ต้องการแจ้งซ่อม</label>
          <!-- ปุ่มเปิด Modal เลือกครุภัณฑ์ -->
          <button type="button" @click="openAssetSelector"
            class="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer"
            :class="selectedAsset ? 'border-[#047857] bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'">
            <div v-if="selectedAsset" class="text-left min-w-0">
              <p class="text-sm font-bold text-[#065f46] truncate">{{ selectedAsset.name }}</p>
              <p class="text-xs text-slate-500">เลขครุภัณฑ์: {{ selectedAsset.seq || '-' }}</p>
            </div>
            <span v-else class="text-sm text-slate-400">-- คลิกเพื่อค้นหาและเลือกครุภัณฑ์ --</span>
            <span class="ml-3 shrink-0 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">{{ selectedAsset ? 'เปลี่ยน' : 'ค้นหา' }}</span>
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">ระดับความเร่งด่วน</label>
          <div class="grid grid-cols-3 gap-2">
            <button v-for="opt in [
              { v: 'NORMAL',   l: 'ปกติ',      active: 'bg-slate-700 border-slate-700 text-white' },
              { v: 'URGENT',   l: 'ด่วน',       active: 'bg-orange-500 border-orange-500 text-white' },
              { v: 'CRITICAL', l: 'ด่วนที่สุด', active: 'bg-red-500 border-red-500 text-white' }
            ]" :key="opt.v" type="button" @click="form.urgency = opt.v"
              :class="[
                'py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer',
                form.urgency === opt.v ? opt.active : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              ]">
              {{ opt.l }}
            </button>
          </div>
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
    </div>

    <!-- ===== แท็บ: รายการแจ้งซ่อม ===== -->
    <div v-else-if="activeTab === 'list'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-500">
          ทั้งหมด <span class="font-bold text-slate-900">{{ activeRepairs.length }}</span> รายการ
        </p>
        <button type="button" @click="activeTab = 'new'"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#065f46] text-white hover:bg-[#047857] shadow-sm hover:shadow-md transition-all cursor-pointer">
          <Plus class="w-4 h-4" />
          แจ้งซ่อมใหม่
        </button>
      </div>

      <div class="divide-y divide-slate-100">
        <div v-for="req in activeRepairs" :key="req.id" class="p-6 hover:bg-slate-50/50 transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-xs font-mono text-slate-400 font-semibold">{{ req.repairCode }}</span>
                <span :class="['px-2 py-0.5 rounded-full text-[11px] font-bold border', statusStyle(req.status)]">
                  {{ req.status === 'PENDING' ? 'รอประเมิน' : req.status === 'APPROVED' ? 'อนุมัติส่งซ่อม' : req.status === 'REPAIRING' ? 'กำลังซ่อม' : req.status }}
                </span>
                <span v-if="req.urgency !== 'NORMAL'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  {{ req.urgency === 'URGENT' ? 'ด่วน' : 'ด่วนที่สุด' }}
                </span>
              </div>
              <h4 class="text-base font-bold text-slate-800">
                {{ req.asset?.name || 'ครุภัณฑ์' }} <span class="text-slate-400 font-normal">({{ req.asset?.seq || '-' }})</span>
              </h4>
              <p class="text-xs text-slate-500 mt-1">ผู้แจ้ง: <span class="font-semibold">{{ req.reporterName }}</span></p>
              <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Clock class="w-3.5 h-3.5" />
                <span>วันที่แจ้ง: {{ formatThaiDate(req.createdAt) }}</span>
              </div>
              <p v-if="req.description" class="text-xs text-slate-500 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <span class="font-semibold text-slate-600">อาการชำรุด:</span> {{ req.description }}
              </p>
              <p v-if="req.remark" class="text-xs text-slate-500 mt-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                <span class="font-semibold text-amber-700">หมายเหตุ:</span> {{ req.remark }}
              </p>
            </div>

            <div v-if="canManage" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <template v-if="req.status === 'PENDING'">
                <button type="button" @click="openEvaluate(req)"
                  class="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm">
                  <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                  ประเมิน/อนุมัติ
                </button>
              </template>
              <template v-else-if="req.status === 'APPROVED' || req.status === 'REPAIRING'">
                <button type="button" @click="openComplete(req)"
                  class="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition-all cursor-pointer shadow-sm">
                  <Check class="w-4 h-4" />
                  บันทึกซ่อมเสร็จ
                </button>
              </template>
            </div>
          </div>
        </div>

        <div v-if="activeRepairs.length === 0" class="py-16 text-center text-slate-400 text-sm">
          <Wrench class="w-12 h-12 mx-auto mb-3 text-slate-200" />
          ไม่มีรายการแจ้งซ่อมที่รอดำเนินการ
        </div>
      </div>
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

  <!-- ====== Modal: เลือกครุภัณฑ์ ====== -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="assetSelectorOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      @click.self="assetSelectorOpen = false">
      <div class="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-slate-900">ค้นหาและเลือกครุภัณฑ์</h3>
              <p class="text-xs text-slate-500 mt-0.5">คลิกที่การ์ดเพื่อเลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม</p>
            </div>
            <button type="button" @click="assetSelectorOpen = false"
              class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>
          <!-- Search -->
          <div class="relative mb-3">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input v-model="assetSearchQuery" type="text" placeholder="ค้นหาชื่อครุภัณฑ์ หรือเลขครุภัณฑ์..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#065f46]/10 transition" />
          </div>
          <!-- Category Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button v-for="cat in assetCategories" :key="cat" type="button" @click="assetCatFilter = cat"
              :class="[
                'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                assetCatFilter === cat ? 'bg-[#065f46] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]">
              {{ cat }}
            </button>
          </div>
        </div>
        <!-- Cards Grid -->
        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="filteredAssets.length === 0" class="py-12 text-center text-slate-400">
            <Wrench class="w-12 h-12 mx-auto mb-2 text-slate-200" />
            <p class="text-sm">ไม่พบครุภัณฑ์ที่ค้นหา</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="asset in filteredAssets" :key="asset.id"
              @click="pickAsset(asset)"
              class="bg-white rounded-xl border-2 border-slate-200 hover:border-[#047857] hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3 group">
              <div class="flex items-start justify-between">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-[#065f46] flex items-center justify-center transition-colors shrink-0">
                  <Wrench class="w-5 h-5 text-[#065f46] group-hover:text-white transition-colors" />
                </div>
                <span :class="['text-xs font-bold px-2 py-0.5 rounded-full', asset.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700']">
                  {{ asset.status === 'Active' ? 'พร้อมใช้' : 'ชำรุด' }}
                </span>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-slate-900 group-hover:text-[#065f46] transition-colors line-clamp-2">{{ asset.name }}</h4>
                <p class="text-xs text-slate-400 mt-0.5">{{ asset.seq || '-' }} · {{ asset.category || 'ไม่ระบุ' }}</p>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs text-slate-400">{{ asset.location?.name || 'ไม่ระบุสถานที่' }}</span>
                <span class="text-xs font-bold text-[#065f46] bg-emerald-50 group-hover:bg-[#065f46] group-hover:text-white px-3 py-1 rounded-lg transition-all">
                  เลือก
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
          <button type="button" @click="assetSelectorOpen = false"
            class="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ====== Modal: ประเมินคำขอซ่อม ====== -->
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="evalModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      @click.self="closeEvaluate">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <CheckCircle2 class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">ประเมินคำขอซ่อม</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ evalModal.record?.asset?.name }}</p>
            </div>
          </div>
        </div>
        <!-- Body -->
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 line-clamp-3">
            {{ evalModal.record?.description }}
          </p>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">ความเห็น / เหตุผล (ถ้ามี)</label>
            <textarea v-model="evalModal.remark" rows="2"
              placeholder="เช่น ควรส่งซ่อม / ค่าซ่อมไม่คุ้มค่า..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
            ></textarea>
          </div>
          <div class="flex flex-col gap-2">
            <button type="button" @click="approveRepair"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all cursor-pointer">
              <CheckCircle2 class="w-4 h-4" />
              อนุมัติส่งซ่อม
            </button>
            <button type="button" @click="markAsDamaged"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer">
              <Ban class="w-4 h-4" />
              ทำเรื่องแทงชำรุด
            </button>
            <button type="button" @click="closeEvaluate"
              class="w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ====== Modal: บันทึกซ่อมเสร็จ ====== -->
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="completeModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      @click.self="closeComplete">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Check class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">บันทึกซ่อมเสร็จแล้ว</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ completeModal.record?.asset?.name }}</p>
            </div>
          </div>
        </div>
        <!-- Body -->
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">
              ค่าใช้จ่ายในการซ่อม (บาท) <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">฿</span>
              <input v-model="completeModal.cost" type="number" min="0" placeholder="0.00"
                class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
            </div>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="closeComplete"
              class="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" @click="completeRepair"
              class="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white text-sm font-bold hover:shadow-lg transition-all cursor-pointer">
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

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