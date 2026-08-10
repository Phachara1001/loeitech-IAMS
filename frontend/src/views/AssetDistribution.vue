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
  User,
  X,
  Check
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
  'แผนกช่างยนต์'
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

// ==========================================
// 5. FORM & AUTO RELINQUISH LOGIC
// ==========================================
const isModalOpen = ref(false)
const form = ref({
  assetId: '',
  department: '',
  building: '',
  room: '',
  responsiblePersonId: '',
  note: ''
})

const handleAssignAsset = async () => {
  if (currentUser.value.role === 'User') return

  const selectedAsset = masterAssets.value.find(a => a.id === Number(form.value.assetId))
  const selectedPerson = personnelList.value.find(p => p.id === form.value.responsiblePersonId)

  if (!selectedAsset || !selectedPerson) {
    toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  try {
    const payload = {
      assetId: selectedAsset.id,
      department: form.value.department,
      building: form.value.building,
      room: form.value.room,
      responsiblePersonId: Number(selectedPerson.id),
      note: form.value.note || 'จัดสรรลงหน่วยงาน'
    }

    await inventoryApi.createAssetDistribution(payload)
    toast.success(`จัดสรรครุภัณฑ์ ${selectedAsset.seq || '-'} ไปยัง ${form.value.department} เรียบร้อยแล้ว!`)
    
    // Reset Form & Close Modal
    isModalOpen.value = false
    form.value = { assetId: '', department: '', building: '', room: '', responsiblePersonId: '', note: '' }
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
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]"></div>
        <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]"></div>
        <div class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]"></div>
      </div>

      <div class="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md shrink-0">
            <Building2 class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">ทะเบียนคุมครุภัณฑ์จ่ายให้หน่วย</h1>
            <p class="text-emerald-100/80 text-sm sm:text-base mt-1">ระบบควบคุมการจัดสรร โยกย้ายสถานที่ และระบุบุคลากรผู้รับผิดชอบดูแลครุภัณฑ์</p>
          </div>
        </div>

        <!-- Switcher Role สำหรับทดสอบ -->
        <div class="flex items-center gap-2 bg-black/20 border border-white/10 p-2 rounded-xl backdrop-blur-md shrink-0">
          <span class="text-xs sm:text-sm text-emerald-100/80 font-medium px-2">ทดสอบสิทธิ์ผู้ใช้:</span>
          <button 
            @click="currentUser.role = 'Admin'" 
            :class="['px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Admin' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Admin
          </button>
          <button 
            @click="currentUser.role = 'Staff'" 
            :class="['px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Staff' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Staff
          </button>
          <button 
            @click="currentUser.role = 'User'" 
            :class="['px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'User' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            User (ดูเฉพาะในแผนก)
          </button>
        </div>
      </div>
    </div>

    <!-- Banner Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-xl font-extrabold text-slate-800">
          {{ currentUser.role === 'User' ? `รายการครุภัณฑ์ในสังกัด (${currentUser.department})` : 'รายการประวัติการจ่ายครุภัณฑ์ทั้งหมด' }}
        </h2>
        <p class="text-sm text-slate-500 mt-0.5">
          {{ currentUser.role === 'User' ? 'แสดงเฉพาะรายการครุภัณฑ์ที่ผูกกับแผนกหรือตัวท่าน' : 'บันทึกการจัดสรร โยกย้าย และลงประวัติการส่งคืนอัตโนมัติ' }}
        </p>
      </div>

      <!-- ปุ่มเปิด Modal จัดสรรครุภัณฑ์ (เฉพาะ Admin & Staff) -->
      <div v-if="currentUser.role === 'Admin' || currentUser.role === 'Staff'">
        <button 
          @click="isModalOpen = true"
          class="px-5 py-3 bg-emerald-800 text-white hover:bg-emerald-700 rounded-2xl font-extrabold flex items-center transition-all shadow-md cursor-pointer"
        >
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
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ค้นหาเลขครุภัณฑ์, ชื่อ, ห้อง, ผู้ดูแล..."
            class="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" 
          />
        </div>

        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300">
            <input type="checkbox" v-model="currentOnlyFilter" class="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-500" />
            <span>แสดงเฉพาะที่ครอบครองอยู่ปัจจุบัน (is_current)</span>
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
          <tbody class="divide-y divide-slate-200 font-medium">
            <tr v-for="item in filteredDistributions" :key="item.id" :class="['transition-colors', item.is_current ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 text-slate-400']">
              
              <!-- หมายเลขครุภัณฑ์ -->
              <td class="px-6 py-4">
                <div class="font-mono font-extrabold text-slate-900 text-base" :class="{ 'opacity-60': !item.is_current }">
                  {{ item.assetCode }}
                </div>
                <div class="text-xs text-slate-500 font-bold mt-0.5">{{ item.assetName }}</div>
              </td>

              <!-- ฝ่าย/หน่วยงาน -->
              <td class="px-6 py-4 font-bold text-slate-800">
                {{ item.department }}
              </td>

              <!-- อาคาร / ห้อง -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <MapPin class="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{{ item.room }}</span>
                </div>
                <div class="text-xs text-slate-400 pl-5.5">{{ item.building }}</div>
              </td>

              <!-- บุคลากรผู้รับผิดชอบ -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs border">
                    <User class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-900">{{ item.responsiblePersonName }}</div>
                    <div class="text-xs text-slate-400">ID: {{ item.responsiblePersonId }}</div>
                  </div>
                </div>
              </td>

              <!-- ว.ด.ป. รับมอบ/ส่งคืน -->
              <td class="px-6 py-4 text-center text-xs">
                <div class="font-bold text-slate-700">รับมอบ: {{ formatThaiDate(item.assignDate) }}</div>
                <div v-if="item.returnDate" class="text-rose-600 font-bold mt-0.5">
                  ส่งคืน: {{ formatThaiDate(item.returnDate) }}
                </div>
                <div v-else class="text-emerald-700 font-bold mt-0.5">- ถือครองอยู่ -</div>
              </td>

              <!-- สถานะ is_current -->
              <td class="px-6 py-4 text-center">
                <span 
                  v-if="item.is_current" 
                  class="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" /> ครอบครองปัจจุบัน
                </span>
                <span 
                  v-else 
                  class="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-bold inline-flex items-center gap-1"
                >
                  <ArrowRightLeft class="w-3.5 h-3.5" /> โยกย้ายแล้ว (ประวัติ)
                </span>
              </td>

            </tr>

            <tr v-if="filteredDistributions.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">
                ไม่พบประวัติการคุมครุภัณฑ์จ่ายให้หน่วยงาน
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- =========================================
         MODAL: ฟอร์มจัดสรร / โยกย้ายครุภัณฑ์
         ========================================= -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
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
            <label class="block font-extrabold text-slate-800 mb-1">เลือกครุภัณฑ์ที่ต้องการจัดสรร:</label>
            <select v-model="form.assetId" required class="w-full p-3 border-2 border-slate-300 rounded-xl font-bold bg-slate-50 focus:border-emerald-600 focus:outline-none">
              <option value="" disabled>-- เลือกครุภัณฑ์ --</option>
              <option v-for="asset in masterAssets" :key="asset.id" :value="asset.id">
                [{{ asset.seq || '-' }}] {{ asset.name }}
              </option>
            </select>
          </div>

          <!-- เลือกหน่วยงาน / ฝ่าย -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">นามหน่วยงาน / ฝ่าย ที่รับมอบ:</label>
            <select v-model="form.department" required class="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white focus:outline-none">
              <option value="" disabled>-- เลือกฝ่าย/แผนก --</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>

          <!-- อาคาร & ห้องเรียน -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-extrabold text-slate-800 mb-1">ชื่ออาคาร:</label>
              <input v-model="form.building" type="text" required placeholder="เช่น อาคาร 3" class="w-full p-3 border border-slate-300 rounded-xl font-medium" />
            </div>
            <div>
              <label class="block font-extrabold text-slate-800 mb-1">ห้องเรียน / ห้องทำงาน:</label>
              <input v-model="form.room" type="text" required placeholder="เช่น ห้อง 304" class="w-full p-3 border border-slate-300 rounded-xl font-medium" />
            </div>
          </div>

          <!-- บุคลากรผู้รับผิดชอบ -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">บุคลากรผู้ลงนามรับผิดชอบดูแล:</label>
            <select v-model="form.responsiblePersonId" required class="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white focus:outline-none">
              <option value="" disabled>-- เลือกผู้รับผิดชอบ --</option>
              <option v-for="p in personnelList" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.dept }})
              </option>
            </select>
          </div>

          <!-- หมายเหตุ -->
          <div>
            <label class="block font-extrabold text-slate-800 mb-1">หมายเหตุการจัดสรร / โยกย้าย:</label>
            <textarea v-model="form.note" rows="2" placeholder="เช่น โยกย้ายตามคำขอประจำภาคเรียน..." class="w-full p-3 border border-slate-300 rounded-xl font-medium"></textarea>
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" @click="isModalOpen = false" class="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer">
              ยกเลิก
            </button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
              <Check class="w-4 h-4 stroke-[3]" /> ยืนยันการจัดสรร
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>