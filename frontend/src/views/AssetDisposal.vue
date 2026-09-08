<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Recycle, Plus, X, Check, Loader2, AlertTriangle, ShieldAlert,
  Search, ClipboardList, Gavel, PackageX, Ban, CheckCircle2,
  PackageSearch, PackageOpen, Wrench
} from 'lucide-vue-next'
import ThaiDatePicker from '../components/ThaiDatePicker.vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'

const toast = useToast()

// สิทธิ์การเข้าถึง: Admin, Staff เท่านั้น
// TODO: เชื่อมกับระบบยืนยันตัวตนจริง เช่น decode role จาก JWT หรือข้อมูลผู้ใช้หลัง login
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canAccess = computed(() => ['admin', 'staff'].includes(currentRole.value))

/* ---------------- ข้อมูลรายการที่รอจำหน่าย (โหลดจาก backend จริง) ---------------- */
const eligibleAssets = ref([])
const isLoadingAssets = ref(false)

async function loadEligibleAssets() {
  isLoadingAssets.value = true
  try {
    const { data } = await api.get('/api/disposal-requests/eligible-assets')
    eligibleAssets.value = (data.data || []).map((a) => ({
      id: a.id,
      name: a.name,
      seq: a.seq,
      category: a.category,
      condition: a.status === 'Broken' ? 'ชำรุด' : 'กำลังซ่อม',
      unit: a.location ? `${a.location.building || ''} ${a.location.name}`.trim() : a.department,
      distributions: a.distributions,
      department: a.department
    }))
  } catch (err) {
    toast.error(err.message || 'โหลดรายการครุภัณฑ์ที่มีสิทธิ์จำหน่ายไม่สำเร็จ')
  } finally {
    isLoadingAssets.value = false
  }
}

const disposalMethods = ['ขายทอดตลาด', 'บริจาค', 'โอน', 'แปรสภาพ', 'ทำลาย']

/* ---------------- คำขอจำหน่าย (โหลดจาก backend จริง) ---------------- */
const requests = ref([])
const isLoadingRequests = ref(true)
const loadError = ref('')

async function loadRequests() {
  isLoadingRequests.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/api/disposal-requests', {
      params: searchQuery.value ? { search: searchQuery.value } : {}
    })
    requests.value = (data.data || []).map((r) => ({
      id: r.disposalCode,
      dbId: r.id,
      assetName: r.asset?.name || '',
      assetId: r.asset?.seq || '',
      method: r.method,
      meetingDate: r.meetingDate?.slice(0, 10),
      committee: r.committee,
      resolution: r.resolution,
      status: statusFromApi(r.status)
    }))
  } catch (err) {
    loadError.value = 'ไม่สามารถโหลดรายการคำขอจำหน่ายได้ กรุณาลองใหม่อีกครั้ง'
    toast.error(err.message || 'โหลดคำขอจำหน่ายไม่สำเร็จ')
  } finally {
    isLoadingRequests.value = false
  }
}

function statusFromApi(status) {
  const map = { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', DISPOSED: 'จำหน่ายแล้ว' }
  return map[status] || status
}

function statusStyle(status) {
  if (status === 'จำหน่ายแล้ว') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (status === 'อนุมัติแล้ว') return 'bg-sky-50 text-sky-700 border-sky-100'
  if (status === 'ไม่อนุมัติ') return 'bg-red-50 text-red-700 border-red-100'
  return 'bg-amber-50 text-amber-700 border-amber-100'
}

const searchQuery = ref('')
const filteredRequests = computed(() => requests.value) // กรองที่ backend แล้ว (ผ่าน search param)

let searchDebounce = null
function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(loadRequests, 350)
}

/* ---------------- ฟอร์มสร้างคำขอจำหน่ายใหม่ ---------------- */
const isFormOpen = ref(false)
const isSaving = ref(false)
const formError = ref('')
const form = ref({ assetId: '', method: disposalMethods[0], meetingDate: '', committee: '', resolution: '' })

function openForm() {
  formError.value = ''
  form.value = { assetId: '', method: disposalMethods[0], meetingDate: '', committee: '', resolution: '' }
  isFormOpen.value = true
}
function closeForm() {
  isFormOpen.value = false
}

// --- Modal Selection Logic for Asset ---
const isAssetSelectorOpen = ref(false)
const searchAssetQuery = ref('')
const assetCatFilter = ref('ทั้งหมด')

const assetCategories = computed(() => {
  const cats = new Set(eligibleAssets.value.map(a => a.category).filter(Boolean))
  return ['ทั้งหมด', ...Array.from(cats)]
})

const filteredAssetsForSelector = computed(() => {
  let result = eligibleAssets.value
  
  if (assetCatFilter.value !== 'ทั้งหมด') {
    result = result.filter(a => a.category === assetCatFilter.value)
  }
  
  if (searchAssetQuery.value) {
    const q = searchAssetQuery.value.toLowerCase()
    result = result.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) || 
      (item.seq && item.seq.toLowerCase().includes(q))
    )
  }
  
  return result
})

const selectedFormAsset = computed(() => {
  return eligibleAssets.value.find(a => a.id === Number(form.value.assetId)) || null
})

function selectAsset(asset) {
  form.value.assetId = asset.id.toString()
  isAssetSelectorOpen.value = false
  searchAssetQuery.value = ''
}

function getAssetLocation(asset) {
  if (asset.distributions && asset.distributions.length > 0) {
    const dist = asset.distributions[0];
    const parts = [];
    if (dist.department) parts.push(dist.department);
    else if (asset.department) parts.push(asset.department);

    if (dist.building || dist.room) {
      let loc = '';
      if (dist.building) loc += `อาคาร ${dist.building}`;
      if (dist.room) loc += (loc ? ' ' : '') + `ห้อง ${dist.room}`;
      parts.push(`(${loc})`);
    }

    if (parts.length > 0) return parts.join(' ');
  }
  if (asset.unit) return asset.unit;
  return asset.department || 'ส่วนกลาง';
}

async function saveForm() {
  if (!form.value.assetId || !form.value.meetingDate || !form.value.committee.trim() || !form.value.resolution.trim()) {
    formError.value = 'กรุณากรอกข้อมูลให้ครบถ้วน โดยเฉพาะรายการ วันที่ประชุม รายชื่อกรรมการ และมติที่ประชุม'
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    await api.post('/api/disposal-requests', {
      assetId: form.value.assetId,
      method: form.value.method,
      meetingDate: new Date(form.value.meetingDate).toISOString(),
      committee: form.value.committee.trim(),
      resolution: form.value.resolution.trim()
    })
    toast.success('สร้างคำขอจำหน่ายสำเร็จ')
    isFormOpen.value = false
    await Promise.all([loadRequests(), loadEligibleAssets()])
  } catch (err) {
    formError.value = err.message || 'สร้างคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
  } finally {
    isSaving.value = false
  }
}

/* ---------------- อนุมัติ / จำหน่ายแล้ว ---------------- */
async function approveRequest(req) {
  try {
    await api.patch(`/api/disposal-requests/${req.dbId}/approve`)
    toast.success('อนุมัติคำขอสำเร็จ')
    await loadRequests()
  } catch (err) {
    toast.error(err.message || 'อนุมัติคำขอไม่สำเร็จ')
  }
}
async function rejectRequest(req) {
  try {
    await api.patch(`/api/disposal-requests/${req.dbId}/reject`)
    toast.success('บันทึกการไม่อนุมัติแล้ว')
    await loadRequests()
  } catch (err) {
    toast.error(err.message || 'บันทึกไม่สำเร็จ')
  }
}
async function markDisposed(req) {
  try {
    await api.patch(`/api/disposal-requests/${req.dbId}/dispose`)
    toast.success('บันทึกจำหน่ายแล้ว — ตัดยอดออกจากบัญชีคุมคลังเรียบร้อย')
    await loadRequests()
  } catch (err) {
    toast.error(err.message || 'บันทึกไม่สำเร็จ')
  }
}

onMounted(() => {
  loadRequests()
  loadEligibleAssets()
})
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <Recycle class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">จำหน่ายพัสดุและครุภัณฑ์</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">สร้างคำขอจำหน่ายรายการที่ชำรุด เสื่อมสภาพ หรือสูญหาย พร้อมบันทึกมติคณะกรรมการ</p>
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
        หน้าจำหน่ายพัสดุและครุภัณฑ์ใช้ได้เฉพาะผู้ใช้งานระดับ "ผู้ดูแลระบบ" และ "เจ้าหน้าที่" เท่านั้น
      </p>
    </div>

    <template v-else>
      <div v-if="isLoadingRequests" class="w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 class="w-8 h-8 animate-spin mb-3 text-[#065f46]" />
        <p class="text-sm">กำลังโหลดคำขอจำหน่าย...</p>
      </div>

      <div v-else-if="loadError" class="w-full flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle class="w-8 h-8 text-red-400 mb-3" />
        <p class="text-sm text-slate-600 font-medium mb-3">{{ loadError }}</p>
        <button @click="loadRequests" class="px-4 py-2 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white text-sm font-semibold transition">ลองใหม่อีกครั้ง</button>
      </div>

      <div v-else class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-emerald-50 bg-emerald-50/20">
          <div class="relative sm:w-72">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              type="text"
              placeholder="ค้นหาชื่อรายการหรือเลขที่คำขอ..."
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
            />
          </div>
          <button
            type="button"
            @click="openForm"
            class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
          >
            <Plus class="w-4 h-4" />
            สร้างคำขอจำหน่ายใหม่
          </button>
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="req in filteredRequests" :key="req.id" class="group p-5 hover:bg-emerald-50/40 transition-colors border-l-4 border-transparent hover:border-[#065f46]">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono text-slate-400">{{ req.id }}</span>
                  <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusStyle(req.status)]">{{ req.status }}</span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">{{ req.method }}</span>
                </div>
                <p class="text-sm font-semibold text-slate-800 mt-1.5">{{ req.assetName }} <span class="text-slate-400 font-normal">({{ req.assetId }})</span></p>
                <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Gavel class="w-3.5 h-3.5 shrink-0" />
                  วันที่ประชุม {{ req.meetingDate }} · กรรมการ: {{ req.committee }}
                </p>
                <p class="text-xs text-slate-500 mt-1">{{ req.resolution }}</p>
              </div>

              <div v-if="canAccess" class="flex items-center gap-2 shrink-0">
                <template v-if="req.status === 'รออนุมัติ'">
                  <button type="button" @click="approveRequest(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-sm transition-all">
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    อนุมัติ
                  </button>
                  <button type="button" @click="rejectRequest(req)" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-sm transition-all">
                    <Ban class="w-3.5 h-3.5" />
                    ไม่อนุมัติ
                  </button>
                </template>
                <button
                  v-else-if="req.status === 'อนุมัติแล้ว'"
                  type="button"
                  @click="markDisposed(req)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all"
                >
                  <PackageX class="w-3.5 h-3.5" />
                  บันทึกจำหน่ายแล้ว
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredRequests.length === 0" class="py-16 text-center text-slate-400 text-sm">
            ไม่พบคำขอจำหน่ายที่ตรงกับเงื่อนไขการค้นหา
          </div>
        </div>
      </div>
    </template>

    <!-- Modal สร้างคำขอจำหน่ายใหม่ -->
    <Transition
      enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div v-if="isFormOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[1px]" @click.self="closeForm">
        <div class="min-h-screen flex items-center justify-center py-8 px-4" @click.self="closeForm">
          <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-900/5 w-full max-w-lg relative overflow-visible my-auto">
          <div class="h-1.5 bg-gradient-to-r from-[#065f46] via-emerald-400 to-[#065f46] sticky top-0"></div>
          <div class="p-6">
          <button type="button" @click="closeForm" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all" aria-label="ปิด">
            <X class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
              <Recycle class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">สร้างคำขอจำหน่ายใหม่</h3>
          </div>
          <p class="text-xs text-slate-400 mb-5 ml-[52px]">เลือกจากรายการที่ตรวจพบว่าชำรุด เสื่อมสภาพ หรือสูญหายจากผลตรวจสอบประจำปี</p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">รายการที่ต้องการจำหน่าย</label>
              <button type="button" @click.stop.prevent="isAssetSelectorOpen = true" :disabled="isLoadingAssets"
                class="w-full flex items-center justify-between text-left bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                <div v-if="selectedFormAsset" class="text-slate-900 font-bold truncate flex-1">
                  [{{ selectedFormAsset.seq || '-' }}] {{ selectedFormAsset.name }}
                </div>
                <div v-else class="text-slate-400 font-medium truncate flex-1">{{ isLoadingAssets ? 'กำลังโหลดรายการ...' : '-- คลิกเพื่อค้นหาและเลือกครุภัณฑ์ --' }}</div>
                <span class="ml-3 shrink-0 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{{ selectedFormAsset ? 'เปลี่ยน' : 'ค้นหา' }}</span>
              </button>
              <p v-if="!isLoadingAssets && eligibleAssets.length === 0" class="text-xs text-amber-600 mt-1.5">ไม่มีครุภัณฑ์ที่มีสิทธิ์จำหน่ายได้ในขณะนี้ (ต้องมีสถานะ "ชำรุด" หรือ "กำลังซ่อม")</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">วิธีการจำหน่าย</label>
              <select v-model="form.method" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                <option v-for="m in disposalMethods" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">วันที่ประชุมคณะกรรมการ</label>
              <ThaiDatePicker v-model="form.meetingDate" type="datetime-local" inputClass="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition bg-white" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">รายชื่อคณะกรรมการ</label>
              <input v-model="form.committee" type="text" placeholder="คั่นด้วยจุลภาค เช่น นายสมชาย ใจดี, นางสาวสมหญิง รักเรียน" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">มติที่ประชุม</label>
              <textarea v-model="form.resolution" rows="3" placeholder="สรุปมติและเหตุผลในการจำหน่าย..." class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"></textarea>
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
              บันทึกคำขอ
            </button>
          </div>
        </div>
        </div>
      </div>
      </div>
    </Transition>

    <!-- Modal: เลือกพัสดุ (สำหรับจำหน่าย) -->
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isAssetSelectorOpen" class="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" style="z-index: 9999;" @click.self="isAssetSelectorOpen = false">
        <div class="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-slate-900">ค้นหาและเลือกครุภัณฑ์เพื่อจำหน่าย</h3>
                <p class="text-xs text-slate-500 mt-0.5">เฉพาะครุภัณฑ์ที่มีสถานะ "ชำรุด" หรือ "กำลังซ่อม" เท่านั้น</p>
              </div>
              <button type="button" @click="isAssetSelectorOpen = false" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
                <X class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Search -->
            <div class="relative mb-3">
              <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" v-model="searchAssetQuery" placeholder="ค้นหาชื่อครุภัณฑ์ หรือเลขครุภัณฑ์..."
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
          <div class="flex-1 overflow-y-auto p-5 bg-slate-50/50">
            <div v-if="filteredAssetsForSelector.length === 0" class="py-12 text-center text-slate-400">
              <Wrench class="w-12 h-12 mx-auto mb-2 text-slate-200" />
              <p class="text-sm">ไม่พบรายการครุภัณฑ์ที่ค้นหา</p>
            </div>
            
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="asset in filteredAssetsForSelector" :key="asset.id" @click="selectAsset(asset)" type="button"
                class="bg-white rounded-xl border-2 border-slate-200 hover:border-[#047857] hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3 group text-left">
                <div class="flex items-start justify-between">
                  <div class="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-[#065f46] flex items-center justify-center transition-colors shrink-0">
                    <Recycle class="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                  </div>
                  <span :class="[
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    asset.condition === 'ชำรุด' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  ]">
                    {{ asset.condition }}
                  </span>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-slate-900 group-hover:text-[#065f46] transition-colors line-clamp-2">{{ asset.name }}</h4>
                  <p class="text-xs text-slate-400 mt-0.5">{{ asset.seq || '-' }} · {{ asset.category || 'ไม่ระบุ' }}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span class="text-xs text-slate-400 font-medium truncate pr-2" :title="getAssetLocation(asset)">{{ getAssetLocation(asset) }}</span>
                  <span class="text-xs font-bold text-[#065f46] bg-emerald-50 group-hover:bg-[#065f46] group-hover:text-white px-3 py-1 rounded-lg transition-all shrink-0">
                    เลือก
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
            <button type="button" @click="isAssetSelectorOpen = false"
              class="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </Transition>
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