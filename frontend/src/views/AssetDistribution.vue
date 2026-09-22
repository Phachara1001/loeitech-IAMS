<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Building2,
  Search,
  Plus,
  UserCheck,
  MapPin,
  Calendar,
  History,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Check,
  PackageSearch,
  PackageOpen,
  Wrench,
  X,
  ChevronDown,
  User
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// ==========================================
// 1. USER & ROLE CONTEXT
// ==========================================
const userObj = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
const currentRoleStr = (localStorage.getItem('tcaims_role') || 'user').toLowerCase()
const currentUser = ref({
  id: userObj.id || 'USR-001',
  name: userObj.name || 'ผู้ใช้งานระบบ',
  department: userObj.department?.name || 'แผนกเทคโนโลยีสารสนเทศ',
  role: currentRoleStr === 'admin' ? 'Admin' : currentRoleStr === 'staff' ? 'Staff' : 'User'
})

// --- Helper: Format DATE เป็นภาษาไทย ---
const formatThaiDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ==========================================
// 2. MASTER ASSETS & LOCATIONS (ฐานข้อมูลครุภัณฑ์)
// ==========================================
const masterAssets = ref([])
const distributionLogs = ref([])
const personnelList = ref([])
const isLoading = ref(false)

const departments = [
  'แผนกเทคโนโลยีสารสนเทศ',
  'ฝ่ายวิชาการ',
  'งานการเงินและบัญชี',
  'งานพัสดุกลาง',
  'แผนกช่างยนต์',
  'ส่วนกลาง'
]

async function fetchData() {
  isLoading.value = true
  try {
    const [assetsData, distsData, usersData] = await Promise.all([
      inventoryApi.getAssets(),
      inventoryApi.getAssetDistributions(),
      inventoryApi.getUsers()
    ])
    masterAssets.value = assetsData

    distributionLogs.value = distsData.map(d => ({
      id: d.id.toString(),
      assetId: d.assetId,
      assetCode: d.asset?.seq || '-',
      assetName: d.asset?.name || '-',
      department: d.department,
      building: d.building,
      room: d.room,
      responsiblePersonId: d.responsiblePersonId.toString(),
      responsiblePersonName: d.responsiblePerson?.name || 'ไม่ระบุ',
      assignDate: d.assignDate,
      returnDate: d.returnDate,
      is_current: d.isCurrent,
      note: d.note
    }))

    personnelList.value = usersData.map(u => ({
      id: u.id.toString(),
      name: u.name || u.username,
      dept: u.department?.name || 'ไม่ระบุหน่วยงาน'
    }))
  } catch (err) {
    toast.error('ไม่สามารถโหลดข้อมูลจัดสรรครุภัณฑ์ได้: ' + err.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// ==========================================
// 4. FILTER & RBAC LOGIC
// ==========================================
const searchQuery = ref('')
const currentOnlyFilter = ref(false)

const filteredDistributions = computed(() => {
  return distributionLogs.value.filter(item => {
    // RBAC: User เห็นเฉพาะในแผนกตนเอง หรือรายการที่ตนรับผิดชอบ
    if (currentUser.value.role === 'User') {
      const isMyDept = item.department === currentUser.value.department
      const isMyPerson = item.responsiblePersonId === currentUser.value.id
      if (!isMyDept && !isMyPerson) return false
    }

    const matchesSearch = item.assetCode.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.assetName.includes(searchQuery.value) ||
      item.department.includes(searchQuery.value) ||
      item.responsiblePersonName.includes(searchQuery.value) ||
      item.room.includes(searchQuery.value)

    const matchesCurrent = currentOnlyFilter.value ? item.is_current === true : true

    return matchesSearch && matchesCurrent
  })
})

const expandedGroups = ref(new Set())

const toggleGroup = (prefix) => {
  const newSet = new Set(expandedGroups.value)
  if (newSet.has(prefix)) {
    newSet.delete(prefix)
  } else {
    newSet.add(prefix)
  }
  expandedGroups.value = newSet
}

const groupedDistributions = computed(() => {
  const groupsMap = {} // Key: prefix

  filteredDistributions.value.forEach(item => {
    const seq = item.assetCode || ''
    const match = seq.match(/^(.*?)-\d+$/)
    const prefix = match ? match[1] : seq

    if (!groupsMap[prefix]) {
      groupsMap[prefix] = {
        prefix,
        itemsByCode: {},
        baseItem: { ...item }
      }
    }

    if (!groupsMap[prefix].itemsByCode[seq]) {
      groupsMap[prefix].itemsByCode[seq] = []
    }
    groupsMap[prefix].itemsByCode[seq].push(item)
  })

  return Object.values(groupsMap).map(group => {
    const subGroups = Object.values(group.itemsByCode).map(historyList => {
      // Sort history: newest first
      historyList.sort((a, b) => new Date(b.assignDate) - new Date(a.assignDate))
      const latest = historyList.find(i => i.is_current) || historyList[0]
      const history = historyList.filter(i => i.id !== latest.id)
      return {
        assetCode: latest.assetCode,
        latest,
        history
      }
    })

    // Sort subGroups sequentially (001, 002, 003)
    subGroups.sort((a, b) => a.assetCode.localeCompare(b.assetCode, undefined, { numeric: true }))

    group.subGroups = subGroups

    // Count total unique items
    group.totalUniqueItems = subGroups.length
    group.isGroup = true // We always want to be able to expand to see the sub-items

    if (subGroups.length > 0) {
      const unique = (arr) => [...new Set(arr.filter(Boolean))]
      
      group.aggregateData = {
        department: unique(subGroups.map(s => s.latest.department || 'ส่วนกลาง')).join(', '),
        building: unique(subGroups.map(s => s.latest.building)).join(', '),
        room: unique(subGroups.map(s => s.latest.room)).join(', '),
        responsiblePersonName: unique(subGroups.map(s => s.latest.responsiblePersonName)).join(', '),
        assignDate: unique(subGroups.map(s => s.latest.assignDate ? formatThaiDate(s.latest.assignDate) : null)).join(', '),
        returnDate: unique(subGroups.map(s => s.latest.returnDate ? formatThaiDate(s.latest.returnDate) : null)).join(', '),
        is_current_types: unique(subGroups.map(s => s.latest.is_current ? 'current' : 'old'))
      }
      group.isUniform = true // Always display the aggregated data
      group.uniformData = group.aggregateData
    }

    return group
  })
})

const flattenedDistributions = computed(() => {
  const rows = []
  groupedDistributions.value.forEach(group => {
    rows.push({
      type: 'header',
      key: 'header-' + group.prefix,
      group: group
    })

    if (group.isGroup && expandedGroups.value.has(group.prefix)) {
      group.subGroups.forEach(sub => {
        rows.push({
          type: 'item-latest',
          key: 'latest-' + sub.latest.id,
          item: sub.latest,
          group: group,
          subGroup: sub,
          hasHistory: sub.history.length > 0
        })
      })
    }
  })
  return rows
})

const isHistoryModalOpen = ref(false)
const currentHistoryData = ref({ assetCode: '', assetName: '', timeline: [] })

const openHistoryModal = (subGroup) => {
  // Combine latest and history for a full timeline, sorted newest first
  const fullTimeline = [subGroup.latest, ...subGroup.history].sort((a, b) => new Date(b.assignDate) - new Date(a.assignDate))

  currentHistoryData.value = {
    assetCode: subGroup.assetCode,
    assetName: subGroup.latest.assetName,
    timeline: fullTimeline
  }
  isHistoryModalOpen.value = true
}

// ==========================================
// 5. FORM & AUTO RELINQUISH LOGIC
// ==========================================
const isModalOpen = ref(false)
const form = ref({
  assetIds: [],
  department: 'แผนกเทคโนโลยีสารสนเทศ',
  building: 'อาคาร 6',
  room: '',
  responsiblePersonId: '',
  note: ''
})

// --- Modal Selection Logic for Asset ---
const isAssetSelectorOpen = ref(false)
const searchAssetQuery = ref('')
const assetCatFilter = ref('ทั้งหมด')

const assetCategories = computed(() => {
  const cats = new Set(masterAssets.value.map(a => a.category).filter(Boolean))
  return ['ทั้งหมด', ...Array.from(cats)]
})

const filteredAssetsForSelector = computed(() => {
  let result = masterAssets.value

  if (assetCatFilter.value !== 'ทั้งหมด') {
    result = result.filter(a => a.category === assetCatFilter.value)
  }

  if (searchAssetQuery.value) {
    const q = searchAssetQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.seq && item.seq.toLowerCase().includes(q))
    )
  }

  return result
})

const groupedSelectedAssets = computed(() => {
  const selected = masterAssets.value.filter(a => form.value.assetIds.includes(a.id.toString()))
  
  const groups = {}
  selected.forEach(asset => {
    const seq = asset.seq || asset.id
    const match = seq.toString().match(/^(.*)-(\d{1,4})$/)
    const baseSeq = match ? match[1] : seq
    const suffix = match ? match[2] : null

    if (!groups[baseSeq]) {
      groups[baseSeq] = {
        name: asset.name,
        baseSeq: baseSeq,
        suffixes: suffix ? [suffix] : [],
        count: 1,
        assets: [asset]
      }
    } else {
      if (suffix) groups[baseSeq].suffixes.push(suffix)
      groups[baseSeq].count += 1
      groups[baseSeq].assets.push(asset)
    }
  })

  return Object.values(groups).map(group => {
    if (group.suffixes.length > 0) {
      const sorted = [...group.suffixes].sort((a, b) => parseInt(a) - parseInt(b))
      const ranges = []
      let start = sorted[0]
      let prev = sorted[0]

      for (let i = 1; i < sorted.length; i++) {
        const curr = sorted[i]
        if (parseInt(curr) === parseInt(prev) + 1) {
          prev = curr
        } else {
          ranges.push({ start, end: prev })
          start = curr
          prev = curr
        }
      }
      ranges.push({ start, end: prev })

      const formattedSuffixes = ranges.map(r => {
        if (r.start === r.end) return r.start
        return `${r.start} ถึง ${r.end}`
      }).join(', ')

      group.displaySeq = `${group.baseSeq}-${formattedSuffixes}`
    } else {
      group.displaySeq = group.baseSeq
    }
    return group
  })
})

function toggleSelectAsset(asset) {
  const strId = asset.id.toString()
  const idx = form.value.assetIds.indexOf(strId)
  if (idx !== -1) {
    form.value.assetIds.splice(idx, 1)
  } else {
    form.value.assetIds.push(strId)
  }
}

function removeGroupFromSelection(group) {
  const idsToRemove = group.assets.map(a => a.id.toString())
  form.value.assetIds = form.value.assetIds.filter(id => !idsToRemove.includes(id))
}

function confirmAssetSelection() {
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
  return asset.department || 'ส่วนกลาง';
}

const handleAssignAsset = async () => {
  if (currentUser.value.role === 'User') return

  const selectedPerson = personnelList.value.find(p => p.id === form.value.responsiblePersonId)

  if (form.value.assetIds.length === 0 || !selectedPerson) {
    toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  try {
    const promises = form.value.assetIds.map(assetId => {
      const payload = {
        assetId: Number(assetId),
        department: form.value.department,
        building: form.value.building,
        room: form.value.room,
        responsiblePersonId: Number(selectedPerson.id),
        note: form.value.note || '-'
      }
      return inventoryApi.createAssetDistribution(payload)
    })

    await Promise.all(promises)
    toast.success(`จัดสรรครุภัณฑ์ ${form.value.assetIds.length} รายการ ไปยัง ${form.value.department} เรียบร้อยแล้ว!`)

    // Reset Form & Close Modal
    isModalOpen.value = false
    form.value = { assetIds: [], department: 'แผนกเทคโนโลยีสารสนเทศ', building: 'อาคาร 6', room: '', responsiblePersonId: '', note: '' }
    await fetchData()
  } catch (err) {
    toast.error('ไม่สามารถจัดสรรครุภัณฑ์ได้: ' + err.message)
  }
}
</script>

<template>
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-slate-100 text-slate-800 space-y-6">

    <!-- Header Banner ขยายเต็มความกว้าง (เหมือน AssetTimeline) -->
    <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl print:hidden">
      <!-- Background Mesh Gradient -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]">
        </div>
        <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]">
        </div>
        <div class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]">
        </div>
      </div>

      <div class="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div
            class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md shrink-0">
            <Building2 class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">ทะเบียนคุมครุภัณฑ์จ่ายให้หน่วย</h1>
            <p class="text-emerald-100/80 text-sm sm:text-base mt-1">ระบบควบคุมการจัดสรร โยกย้ายสถานที่
              และระบุบุคลากรผู้รับผิดชอบดูแลครุภัณฑ์</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Banner Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-xl font-extrabold text-slate-800">
          {{ currentUser.role === 'User' ? `รายการครุภัณฑ์ในสังกัด (${currentUser.department})` :
            'รายการประวัติการจ่ายครุภัณฑ์ทั้งหมด' }}
        </h2>
        <p class="text-sm text-slate-500 mt-0.5">
          <span v-if="currentUser.role === 'User'">แสดงเฉพาะรายการครุภัณฑ์ที่ผูกกับแผนกหรือตัวท่าน</span>
          <span v-else>บันทึกการจัดสรร โยกย้าย และลงประวัติการส่งคืนอัตโนมัติ</span>
        </p>
      </div>

      <!-- ปุ่มเปิด Modal จัดสรรครุภัณฑ์ (เฉพาะ Admin & Staff) -->
      <div v-if="currentUser.role === 'Admin' || currentUser.role === 'Staff'">
        <button @click="isModalOpen = true"
          class="px-5 py-3 bg-emerald-800 text-white hover:bg-emerald-700 rounded-2xl font-extrabold flex items-center transition-all shadow-md cursor-pointer">
          <Plus class="w-5 h-5 mr-2 stroke-[3]" />
          ทำรายการจัดสรร / โยกย้ายครุภัณฑ์
        </button>
      </div>
    </div>

    <!-- Main Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      <!-- Filter Toolbar -->
      <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" type="text" placeholder="ค้นหาเลขครุภัณฑ์, ชื่อ, ห้อง, ผู้ดูแล..."
            class="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" />
        </div>

        <div class="flex items-center gap-3">
          <label
            class="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300">
            <input type="checkbox" v-model="currentOnlyFilter"
              class="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-500" />
            <span>แสดงเฉพาะที่ครอบครองอยู่ปัจจุบัน</span>
          </label>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th class="px-6 py-4">หมายเลขครุภัณฑ์ / ชื่อรายการ</th>
              <th class="px-6 py-4">นามหน่วยงาน / ฝ่าย</th>
              <th class="px-6 py-4">สถานที่ติดตั้ง (อาคาร / ห้อง)</th>
              <th class="px-6 py-4">บุคลากรผู้รับผิดชอบดูแล</th>
              <th class="px-6 py-4 text-center">วัน เดือน ปี (รับมอบ - ส่งคืน)</th>
              <th class="px-6 py-4 text-center">สถานะการครอบครอง</th>
            </tr>
          </thead>
          <transition-group tag="tbody" name="dropdown" class="divide-y divide-slate-200 font-medium">
            <template v-for="row in flattenedDistributions" :key="row.key">

              <!-- Header Row (Prefix Group) -->
              <tr v-if="row.type === 'header'" class="transition-colors bg-slate-50 hover:bg-slate-100 relative z-10">
                <!-- หมายเลขครุภัณฑ์ -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <button v-if="row.group.isGroup" @click="toggleGroup(row.group.prefix)"
                      class="flex items-center justify-center w-6 h-6 rounded-md bg-white hover:bg-emerald-100 text-slate-500 shadow-sm border border-slate-200 shrink-0 transition-colors">
                      <ChevronDown class="w-4 h-4 transition-transform duration-300"
                        :class="{ 'rotate-180': expandedGroups.has(row.group.prefix) }" />
                    </button>
                    <div v-else class="w-6 h-6 shrink-0"></div>

                    <div>
                      <div class="font-mono font-extrabold text-slate-900 text-base">
                        {{ row.group.prefix }}
                      </div>
                      <div class="text-xs text-slate-500 font-bold mt-0.5">
                        {{ row.group.baseItem.assetName }}
                        <span
                          class="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">รวม
                          {{ row.group.totalUniqueItems }} รายการ</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- ฝ่าย/หน่วยงาน -->
                <template v-if="true">
                  <!-- ฝ่าย/หน่วยงาน -->
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">
                    {{ row.group.aggregateData?.department }}
                  </td>

                  <!-- อาคาร / ห้อง -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1 text-slate-800 font-semibold text-xs">
                      <MapPin class="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{{ row.group.aggregateData?.room || '-' }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 pl-4.5">{{ row.group.aggregateData?.building }}</div>
                  </td>

                  <!-- บุคลากรผู้รับผิดชอบ -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-[10px] border">
                        <User class="w-3 h-3" />
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-xs">{{ row.group.aggregateData?.responsiblePersonName || 'ไม่ระบุ' }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- ว.ด.ป. รับมอบ/ส่งคืน -->
                  <td class="px-6 py-4 text-center text-[10px]">
                    <div class="font-bold text-slate-700">รับมอบ: {{ row.group.aggregateData?.assignDate || '-' }}</div>
                    <div v-if="row.group.aggregateData?.returnDate" class="text-rose-600 font-bold mt-0.5">
                      ส่งคืน: {{ row.group.aggregateData?.returnDate }}
                    </div>
                    <div v-else class="text-emerald-700 font-bold mt-0.5">- ถือครองอยู่ -</div>
                  </td>

                  <!-- สถานะ is_current -->
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center gap-1.5">
                      <span v-if="row.group.aggregateData?.is_current_types?.includes('current')"
                        class="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3" /> ครอบครองปัจจุบัน
                      </span>
                      <span v-if="row.group.aggregateData?.is_current_types?.includes('old')"
                        class="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowRightLeft class="w-3 h-3" /> ประวัติเก่า
                      </span>
                    </div>
                  </td>
                </template>
              </tr>

              <!-- Latest Item Row (Current location for a specific physical asset) -->
              <tr v-else-if="row.type === 'item-latest'"
                class="bg-emerald-50/20 hover:bg-emerald-50/60 transition-colors border-l-4 border-emerald-300 relative z-0">

                <!-- หมายเลข -->
                <td class="px-6 py-2.5">
                  <div class="flex items-center gap-3">
                    <div class="w-6 h-6 flex justify-end items-start pt-1 pr-1 shrink-0">
                      <div class="w-3 h-3 rounded-bl-lg border-b-2 border-l-2 border-emerald-200"></div>
                    </div>
                    <div class="font-mono font-extrabold text-slate-900 text-sm"
                      :class="{ 'opacity-60': !row.item.is_current }">
                      {{ row.item.assetCode }}
                    </div>
                  </div>
                </td>

                <!-- ฝ่าย/หน่วยงาน -->
                <td class="px-6 py-2.5 text-sm font-bold text-slate-800">
                  {{ row.item.department || 'ส่วนกลาง' }}
                </td>

                <!-- อาคาร / ห้อง -->
                <td class="px-6 py-2.5">
                  <div class="flex items-center gap-1 text-slate-800 font-semibold text-xs">
                    <MapPin class="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{{ row.item.room }}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 pl-4.5">{{ row.item.building }}</div>
                </td>

                <!-- บุคลากรผู้รับผิดชอบ -->
                <td class="px-6 py-2.5">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-[10px] border">
                      <User class="w-3 h-3" />
                    </div>
                    <div>
                      <div class="font-bold text-slate-900 text-xs">{{ row.item.responsiblePersonName }}</div>
                    </div>
                  </div>
                </td>

                <!-- ว.ด.ป. รับมอบ/ส่งคืน -->
                <td class="px-6 py-2.5 text-center text-[10px]">
                  <div class="font-bold text-slate-700">รับมอบ: {{ formatThaiDate(row.item.assignDate) }}</div>
                  <div v-if="row.item.returnDate" class="text-rose-600 font-bold mt-0.5">
                    ส่งคืน: {{ formatThaiDate(row.item.returnDate) }}
                  </div>
                  <div v-else class="text-emerald-700 font-bold mt-0.5">- ถือครองอยู่ -</div>
                </td>

                <!-- สถานะ is_current -->
                <td class="px-6 py-2.5 text-center">
                  <div class="flex flex-col items-center gap-1.5">
                    <span v-if="row.item.is_current"
                      class="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                      <CheckCircle2 class="w-3 h-3" /> ครอบครองปัจจุบัน
                    </span>
                    <span v-else
                      class="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                      <ArrowRightLeft class="w-3 h-3" /> ประวัติเก่า
                    </span>

                    <button v-if="row.hasHistory" @click="openHistoryModal(row.subGroup)"
                      class="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer">
                      <History class="w-2.5 h-2.5" /> ดูประวัติ ({{ row.subGroup.history.length }})
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="filteredDistributions.length === 0" key="empty-state">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">
                ไม่พบประวัติการคุมครุภัณฑ์จ่ายให้หน่วยงาน
              </td>
            </tr>
          </transition-group>
        </table>
      </div>

    </div>

    <!-- =========================================
         MODAL: ฟอร์มจัดสรร / โยกย้ายครุภัณฑ์
         ========================================= -->
    <div v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        class="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">

        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <h3 class="font-extrabold text-slate-900 text-2xl flex items-center gap-2">
            <Building2 class="w-7 h-7 text-emerald-800" />
            จัดสรร / โยกย้ายครุภัณฑ์
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold p-2 cursor-pointer">
            <X class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="handleAssignAsset" class="p-8 space-y-4 text-sm">

          <!-- เลือกครุภัณฑ์ -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">เลือกครุภัณฑ์ที่ต้องการจัดสรร
              (เลือกได้หลายรายการ):</label>
            <button type="button" @click="isAssetSelectorOpen = true"
              class="w-full flex items-center justify-between text-left bg-slate-50 border-2 border-slate-300 rounded-xl p-3 hover:border-emerald-600 focus:outline-none transition-all cursor-pointer">
              <div class="text-slate-900 font-bold truncate">
                <span v-if="form.assetIds.length > 0">เลือกแล้ว {{ form.assetIds.length }} รายการ</span>
                <span v-else class="text-slate-400 font-medium">-- คลิกเพื่อค้นหาและเลือกครุภัณฑ์ --</span>
              </div>
              <span class="ml-3 shrink-0 px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold">
                {{ form.assetIds.length > 0 ? 'จัดการรายการ' : 'ค้นหา' }}
              </span>
            </button>

            <!-- Selected Assets List -->
            <div v-if="groupedSelectedAssets.length > 0"
              class="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div v-for="(group, index) in groupedSelectedAssets" :key="group.baseSeq"
                class="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm group">
                <div
                  class="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-emerald-700 font-mono truncate mb-0.5">{{ group.displaySeq || '-' }}</div>
                  <div class="text-sm font-semibold text-slate-800 truncate">
                    {{ group.name }} 
                    <span class="text-slate-500 text-xs ml-1 font-normal">(จำนวน {{ group.count }} ชิ้น)</span>
                  </div>
                </div>
                <button type="button" @click="removeGroupFromSelection(group)"
                  class="p-1.5 text-rose-500 bg-rose-50 hover:text-white hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="นำออก">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- เลือกหน่วยงาน / ฝ่าย -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">นามหน่วยงาน / ฝ่าย ที่รับมอบ:</label>
            <input type="text" v-model="form.department" disabled
              class="w-full p-3 border border-slate-300 rounded-xl font-bold bg-slate-100 text-slate-600 focus:outline-none cursor-not-allowed" />
          </div>

          <!-- อาคาร & ห้องเรียน -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-extrabold text-slate-800 mb-1">ชื่ออาคาร:</label>
              <input v-model="form.building" type="text" disabled
                class="w-full p-3 border border-slate-300 rounded-xl font-medium bg-slate-100 text-slate-600 cursor-not-allowed" />
            </div>
            <div>
              <label class="block font-extrabold text-slate-800 mb-1">ห้องเรียน / ห้องทำงาน:</label>
              <input v-model="form.room" type="text" required placeholder="เช่น ห้อง 304"
                class="w-full p-3 border border-slate-300 rounded-xl font-medium" />
            </div>
          </div>

          <!-- บุคลากรผู้รับผิดชอบ -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">บุคลากรผู้ลงนามรับผิดชอบดูแล:</label>
            <select v-model="form.responsiblePersonId" required
              class="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white focus:outline-none">
              <option value="" disabled>-- เลือกผู้รับผิดชอบ --</option>
              <option v-for="p in personnelList" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <!-- หมายเหตุ -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">หมายเหตุการจัดสรร / โยกย้าย (ไม่บังคับ):</label>
            <textarea v-model="form.note" rows="2" placeholder="เช่น โยกย้ายตามคำขอประจำภาคเรียน..."
              class="w-full p-3 border border-slate-300 rounded-xl font-medium"></textarea>
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" @click="isModalOpen = false"
              class="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer">
              ยกเลิก
            </button>
            <button type="submit"
              class="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
              <Check class="w-4 h-4 stroke-[3]" /> ยืนยันการจัดสรร
            </button>
          </div>

        </form>

      </div>
    </div>

    <!-- Modal: เลือกพัสดุ (ซ้อนทับ Modal จัดสรรอีกที) -->
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isAssetSelectorOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        @click.self="isAssetSelectorOpen = false">
        <div class="bg-white rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-slate-900">ค้นหาและเลือกครุภัณฑ์เพื่อจัดสรร</h3>
                <p class="text-xs text-slate-500 mt-0.5">ค้นหาครุภัณฑ์ที่ต้องการจัดสรรหรือโยกย้ายหน่วยงาน</p>
              </div>
              <button type="button" @click="isAssetSelectorOpen = false"
                class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
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
              <button v-for="cat in assetCategories" :key="cat" type="button" @click="assetCatFilter = cat" :class="[
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
              <div v-for="asset in filteredAssetsForSelector" :key="asset.id" @click="toggleSelectAsset(asset)"
                type="button"
                :class="form.assetIds.includes(asset.id.toString()) ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-[#047857] hover:shadow-md'"
                class="rounded-xl border-2 transition-all cursor-pointer p-4 flex flex-col gap-3 group text-left relative overflow-hidden">
                <div class="flex items-start justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-[#065f46] flex items-center justify-center transition-colors shrink-0">
                    <Wrench class="w-5 h-5 text-[#065f46] group-hover:text-white transition-colors" />
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    พร้อมใช้
                  </span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 bg-slate-50/80 border border-slate-100 rounded-lg p-1.5 mb-2">
                    <div class="bg-white border border-slate-200 rounded-md p-1.5 shadow-sm shrink-0">
                      <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span
                        class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">รหัสครุภัณฑ์</span>
                      <span class="text-xs font-bold text-[#065f46] font-mono truncate" :title="asset.seq">{{ asset.seq
                        || '-' }}</span>
                    </div>
                  </div>
                  <hr class="border-slate-300 my-2" />
                  <h4
                    class="text-sm font-semibold text-slate-900 group-hover:text-[#065f46] transition-colors line-clamp-2">
                    {{ asset.name }}</h4>
                  <p class="text-xs text-slate-400 mt-0.5">{{ asset.category || 'ไม่ระบุ' }}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span class="text-xs text-slate-400 font-medium truncate pr-2" :title="getAssetLocation(asset)">{{
                    getAssetLocation(asset) }}</span>
                  <span
                    :class="form.assetIds.includes(asset.id.toString()) ? 'text-white bg-emerald-600' : 'text-[#065f46] bg-emerald-50 group-hover:bg-[#065f46] group-hover:text-white'"
                    class="text-xs font-bold px-3 py-1 rounded-lg transition-all shrink-0">
                    {{ form.assetIds.includes(asset.id.toString()) ? '✓ เลือกแล้ว' : 'เลือก' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
            <div class="text-sm font-medium text-slate-600">
              เลือกแล้ว <span class="text-emerald-700 font-bold text-lg">{{ form.assetIds.length }}</span> รายการ
            </div>
            <div class="flex gap-2">
              <button type="button" @click="isAssetSelectorOpen = false"
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer">
                ปิด
              </button>
              <button type="button" @click="confirmAssetSelection"
                class="px-6 py-2.5 rounded-xl bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] shadow-sm transition-colors cursor-pointer flex items-center gap-2">
                <Check class="w-4 h-4" /> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal: ประวัติการโยกย้าย (History) -->
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isHistoryModalOpen"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        @click.self="isHistoryModalOpen = false">
        <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between shrink-0">
            <div>
              <h3 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <History class="w-6 h-6 text-emerald-700" />
                ประวัติการโยกย้ายครุภัณฑ์
              </h3>
              <div class="mt-2 flex items-center gap-2">
                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg font-mono">{{
                  currentHistoryData.assetCode }}</span>
                <span class="text-sm font-semibold text-slate-600">{{ currentHistoryData.assetName }}</span>
              </div>
            </div>
            <button type="button" @click="isHistoryModalOpen = false"
              class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Content Timeline -->
          <div class="flex-1 overflow-y-auto p-6 bg-white">
            <div class="relative border-l-2 border-slate-200 ml-4 space-y-8">

              <div v-for="(item, index) in currentHistoryData.timeline" :key="item.id" class="relative pl-6">
                <!-- Timeline Dot -->
                <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                  :class="item.is_current ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]' : 'bg-slate-300'">
                </div>

                <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm"
                  :class="{ 'ring-1 ring-emerald-500/30 bg-emerald-50/30': item.is_current }">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="font-bold text-slate-900 flex items-center gap-2">
                        {{ item.department || 'ส่วนกลาง' }}
                        <span v-if="item.is_current"
                          class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">ปัจจุบัน</span>
                      </h4>
                      <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                        <MapPin class="w-3.5 h-3.5" /> {{ item.building }} / {{ item.room }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-bold text-slate-700">รับมอบ: {{ formatThaiDate(item.assignDate) }}</div>
                      <div v-if="item.returnDate" class="text-xs font-bold text-rose-600 mt-0.5">ส่งคืน: {{
                        formatThaiDate(item.returnDate) }}</div>
                      <div v-else class="text-xs font-bold text-emerald-600 mt-0.5">- ถือครองอยู่ -</div>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-200/60 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                      <User class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="text-sm font-bold text-slate-800">{{ item.responsiblePersonName }}</div>
                      <div class="text-[10px] text-slate-500 font-semibold">ผู้ลงนามรับผิดชอบ</div>
                    </div>
                  </div>

                  <div v-if="item.note"
                    class="mt-3 text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600">
                    <span class="font-bold">หมายเหตุ:</span> {{ item.note }}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
            <button type="button" @click="isHistoryModalOpen = false"
              class="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>