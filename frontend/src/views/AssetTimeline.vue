<script setup>
import { ref, computed } from 'vue'
import { 
  History, 
  Wrench, 
  MapPin, 
  UserCheck, 
  PackageCheck, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  X,
  FileText
} from 'lucide-vue-next'

// --- Mock User Context ---
const currentUser = ref({
  id: 101,
  name: 'นายสมชาย ใจดี',
  role: 'Admin' // 'Admin' | 'Staff' | 'User'
})

// --- Mock Asset List ---
const assets = ref([
  {
    id: 'AST-2024-001',
    name: 'เครื่องคอมพิวเตอร์ประมวลผลสูง (Workstation)',
    serial: 'SN-99884210',
    category: 'ครุภัณฑ์คอมพิวเตอร์',
    ownerId: 101,
    ownerName: 'นายสมชาย ใจดี',
    currentLocation: 'ห้องปฏิบัติการคอมพิวเตอร์ 402',
    status: 'ใช้งานปกติ',
    receivedDate: '2023-05-10',
    totalRepairCost: 4500
  },
  {
    id: 'AST-2024-002',
    name: 'โปรเจคเตอร์ความละเอียดสูง 4K',
    serial: 'PJ-4K-55201',
    category: 'ครุภัณฑ์โสตทัศนูปกรณ์',
    ownerId: 202,
    ownerName: 'นางสาววิภาดา พัสดุ',
    currentLocation: 'ห้องประชุมชั้น 3',
    status: 'กำลังส่งซ่อม',
    receivedDate: '2022-11-15',
    totalRepairCost: 12000
  }
])

const visibleAssets = computed(() => {
  if (currentUser.value.role === 'User') {
    return assets.value.filter(a => a.ownerId === currentUser.value.id)
  }
  return assets.value
})

const selectedAssetId = ref(visibleAssets.value[0]?.id || '')

const currentAsset = computed(() => {
  return assets.value.find(a => a.id === selectedAssetId.value) || null
})

// --- Mock Timeline Logs ---
const timelineLogs = ref([
  {
    id: 1,
    assetId: 'AST-2024-001',
    type: 'RECEIVE',
    title: 'ตรวจรับครุภัณฑ์เข้าวิทยาลัย',
    date: '2023-05-10 09:30',
    operator: 'งานพัสดุกลาง',
    details: 'ตรวจรับครุภัณฑ์ใหม่ตามสัญญาจ้างเลขที่ ตร.66/2566 สภาพสมบูรณ์พร้อมใช้งาน',
    location: 'คลังพัสดุกลาง',
    responsiblePerson: 'นายสมชาย ใจดี',
    cost: 0
  },
  {
    id: 2,
    assetId: 'AST-2024-001',
    type: 'MOVE',
    title: 'โอนย้ายสถานที่และผู้ดูแล',
    date: '2023-06-01 13:15',
    operator: 'นายสมชาย ใจดี',
    details: 'ย้ายจากคลังพัสดุเข้าประจำการเพื่อใช้ในการเรียนการสอน',
    location: 'ห้องปฏิบัติการคอมพิวเตอร์ 402',
    responsiblePerson: 'นายสมชาย ใจดี',
    cost: 0
  },
  {
    id: 3,
    assetId: 'AST-2024-001',
    type: 'REPAIR',
    title: 'ส่งซ่อมบำรุง (เปลี่ยน Power Supply)',
    date: '2024-02-14 10:00',
    operator: 'ศูนย์ซ่อมบำรุงวิทยาลัย',
    details: 'อาการชำรุด: เปิดเครื่องไม่ติด พาวเวอร์ซัพพลายไหม้ ดำเนินการเปลี่ยนอะไหล่แท้',
    location: 'ห้องปฏิบัติการคอมพิวเตอร์ 402',
    responsiblePerson: 'นายสมชาย ใจดี',
    cost: 2500
  }
])

const activeTimeline = computed(() => {
  return timelineLogs.value
    .filter(log => log.assetId === selectedAssetId.value)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const repairStats = computed(() => {
  const repairs = activeTimeline.value.filter(l => l.type === 'REPAIR' || l.type === 'MAINTENANCE')
  const totalCost = repairs.reduce((sum, item) => sum + item.cost, 0)
  const moveCount = activeTimeline.value.filter(l => l.type === 'MOVE').length
  return { repairCount: repairs.length, moveCount, totalCost }
})

const getTypeBadge = (type) => {
  switch (type) {
    case 'RECEIVE':
      return { label: 'ตรวจรับเข้า', class: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: PackageCheck }
    case 'MOVE':
      return { label: 'ย้ายสถานที่ / เปลี่ยนผู้ดูแล', class: 'bg-blue-100 text-blue-800 border-blue-300', icon: MapPin }
    case 'REPAIR':
      return { label: 'ส่งซ่อมแซม', class: 'bg-rose-100 text-rose-800 border-rose-300', icon: Wrench }
    case 'MAINTENANCE':
      return { label: 'บำรุงรักษา', class: 'bg-amber-100 text-amber-800 border-amber-300', icon: History }
    default:
      return { label: 'บันทึกกิจกรรม', class: 'bg-slate-100 text-slate-800 border-slate-300', icon: FileText }
  }
}

// Modal State
const isModalOpen = ref(false)
const newLog = ref({
  type: 'MOVE',
  title: '',
  location: '',
  responsiblePerson: '',
  details: '',
  cost: 0
})

const handleAddLog = () => {
  if (!newLog.value.title) return
  timelineLogs.value.push({
    id: Date.now(),
    assetId: selectedAssetId.value,
    type: newLog.value.type,
    title: newLog.value.title,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    operator: currentUser.value.name,
    details: newLog.value.details,
    location: newLog.value.location || currentAsset.value?.currentLocation,
    responsiblePerson: newLog.value.responsiblePerson || currentAsset.value?.ownerName,
    cost: Number(newLog.value.cost) || 0
  })

  if (newLog.value.type === 'MOVE' && newLog.value.location && currentAsset.value) {
    currentAsset.value.currentLocation = newLog.value.location
    if (newLog.value.responsiblePerson) {
      currentAsset.value.ownerName = newLog.value.responsiblePerson
    }
  }

  isModalOpen.value = false
  newLog.value = { type: 'MOVE', title: '', location: '', responsiblePerson: '', details: '', cost: 0 }
}
</script>

<template>
  <!-- พื้นหลังโทนสว่าง คลีน สะอาดตา ไม่ปวดตา -->
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-slate-100 text-slate-800 space-y-6">
    
    <!-- Header Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
          <History class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900">ประวัติการเคลื่อนย้ายและซ่อมบำรุง</h1>
          <p class="text-base text-slate-500 font-medium mt-0.5">ติดตามประวัติการย้ายห้อง เปลี่ยนผู้ดูแล และประวัติการซ่อมแซมครุภัณฑ์</p>
        </div>
      </div>

      <!-- Demo Role Toggle -->
      <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <span class="text-sm text-slate-500 font-bold px-2">สิทธิ์ใช้งาน:</span>
        <button 
          @click="currentUser.role = 'Admin'" 
          :class="['px-3.5 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'Admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          Admin
        </button>
        <button 
          @click="currentUser.role = 'Staff'" 
          :class="['px-3.5 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'Staff' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          Staff
        </button>
        <button 
          @click="currentUser.role = 'User'" 
          :class="['px-3.5 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer', currentUser.role === 'User' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']"
        >
          User
        </button>
      </div>
    </div>

    <!-- Asset Selector Bar -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-100 pb-6">
        
        <div class="flex-1">
          <label class="block text-lg font-extrabold text-slate-900 mb-2">📌 เลือกรายการครุภัณฑ์ที่ต้องการค้นหา:</label>
          <select 
            v-model="selectedAssetId"
            class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base md:text-lg text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition-all"
          >
            <option v-for="asset in visibleAssets" :key="asset.id" :value="asset.id">
              [{{ asset.id }}] {{ asset.name }} - ({{ asset.currentLocation }})
            </option>
          </select>
          <p v-if="currentUser.role === 'User'" class="text-sm text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
            <ShieldAlert class="w-4 h-4" />
            ท่านเห็นเฉพาะครุภัณฑ์ที่อยู่ในความดูแลรับผิดชอบของท่านเท่านั้น
          </p>
        </div>

        <div v-if="currentUser.role === 'Admin' || currentUser.role === 'Staff'">
          <button 
            @click="isModalOpen = true"
            class="w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus class="w-7 h-7 stroke-[3]" />
            <span>+ บันทึกกิจกรรม / ส่งซ่อม</span>
          </button>
        </div>
      </div>

      <!-- Summary Info Cards -->
      <div v-if="currentAsset" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span class="text-slate-500 font-medium text-sm block">รหัสซีเรียลครุภัณฑ์</span>
          <span class="font-mono font-bold text-slate-900 text-lg md:text-xl">{{ currentAsset.serial }}</span>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span class="text-slate-500 font-medium text-sm block">สถานที่ติดตั้งปัจจุบัน</span>
          <span class="font-bold text-slate-900 text-lg flex items-center gap-1.5 mt-0.5">
            <MapPin class="w-5 h-5 text-rose-500 shrink-0" />
            {{ currentAsset.currentLocation }}
          </span>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span class="text-slate-500 font-medium text-sm block">ผู้ดูแลรับผิดชอบ</span>
          <span class="font-bold text-slate-900 text-lg flex items-center gap-1.5 mt-0.5">
            <UserCheck class="w-5 h-5 text-blue-500 shrink-0" />
            {{ currentAsset.ownerName }}
          </span>
        </div>
        <div class="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
          <span class="text-emerald-700 font-medium text-sm block">ยอดซ่อมบำรุงสะสมรวม</span>
          <span class="font-extrabold text-emerald-700 text-2xl">฿{{ repairStats.totalCost.toLocaleString() }} บาท</span>
        </div>
      </div>
    </div>

    <!-- Timeline List Section -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
      <h3 class="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2.5">
        <Calendar class="w-6 h-6 text-emerald-600" />
        ประวัติและลำดับเหตุการณ์ย้อนหลัง
      </h3>

      <div v-if="activeTimeline.length > 0" class="relative border-l-4 border-slate-200 ml-4 md:ml-8 space-y-8">
        
        <div v-for="item in activeTimeline" :key="item.id" class="relative pl-8 md:pl-10">
          <!-- Timeline Icon -->
          <div :class="['absolute -left-[22px] top-0 w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-sm', getTypeBadge(item.type).class]">
            <component :is="getTypeBadge(item.type).icon" class="w-5 h-5" />
          </div>

          <!-- Event Detail Box -->
          <div class="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all space-y-4">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div class="flex items-center gap-3 flex-wrap">
                <span :class="['px-3 py-1 rounded-lg text-sm font-bold border', getTypeBadge(item.type).class]">
                  {{ getTypeBadge(item.type).label }}
                </span>
                <h4 class="font-extrabold text-slate-900 text-lg md:text-xl">{{ item.title }}</h4>
              </div>
              <span class="text-base font-bold text-slate-500 font-mono">
                📅 {{ item.date }}
              </span>
            </div>

            <p class="text-slate-800 text-base md:text-lg leading-relaxed font-medium">
              {{ item.details }}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-base pt-2 bg-white p-4 rounded-xl border border-slate-200/60">
              <div>📍 สถานที่: <strong class="text-slate-900">{{ item.location }}</strong></div>
              <div>👤 ผู้ดูแล: <strong class="text-slate-900">{{ item.responsiblePerson }}</strong></div>
              <div>💰 ค่าใช้จ่าย: 
                <strong :class="item.cost > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-800'">
                  {{ item.cost > 0 ? '฿' + item.cost.toLocaleString() + ' บาท' : 'ไม่มี' }}
                </strong>
              </div>
            </div>

            <div class="text-sm text-slate-400 text-right italic font-medium">
              บันทึกข้อมูลโดย: {{ item.operator }}
            </div>

          </div>
        </div>

      </div>

      <div v-else class="py-12 text-center text-slate-400">
        <History class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p class="text-lg font-medium">ไม่พบข้อมูลประวัติการทำรายการของครุภัณฑ์ชิ้นนี้</p>
      </div>
    </div>

    <!-- Modal Form (ขนาดใหญ่ อ่านง่าย พิเศษสำหรับผู้สูงอายุ) -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/80">
          <h3 class="font-extrabold text-slate-900 text-2xl flex items-center gap-3">
            <Plus class="w-8 h-8 text-emerald-700 stroke-[3]" />
            บันทึกกิจกรรมประวัติครุภัณฑ์ใหม่
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-colors">
            <X class="w-8 h-8" />
          </button>
        </div>

        <form @submit.prevent="handleAddLog" class="p-8 overflow-y-auto space-y-6 text-base md:text-lg">
          
          <div>
            <label class="block font-extrabold text-slate-900 mb-2">1. เลือกประเภทกิจกรรม:</label>
            <select 
              v-model="newLog.type" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-bold focus:border-emerald-600 bg-white cursor-pointer"
            >
              <option value="MOVE">📦 ย้ายสถานที่ / เปลี่ยนผู้ดูแล</option>
              <option value="REPAIR">🔧 ส่งซ่อมแซม (กรณีเครื่องชำรุด)</option>
              <option value="MAINTENANCE">🧹 ทำความสะอาด / บำรุงรักษาประจำปี</option>
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">2. ชื่อกิจกรรม / อาการชำรุด:</label>
            <input 
              v-model="newLog.title" 
              type="text" 
              required
              placeholder="เช่น ย้ายไปห้อง 501 หรือ เปิดเครื่องไม่ติด" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-extrabold text-slate-900 mb-2">สถานที่ใหม่ (ถ้ามี):</label>
              <input 
                v-model="newLog.location" 
                type="text" 
                :placeholder="currentAsset?.currentLocation" 
                class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
              />
            </div>

            <div>
              <label class="block font-extrabold text-slate-900 mb-2">ผู้ดูแลใหม่ (ถ้ามี):</label>
              <input 
                v-model="newLog.responsiblePerson" 
                type="text" 
                :placeholder="currentAsset?.ownerName" 
                class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">3. ค่าใช้จ่ายในการซ่อม (บาท):</label>
            <input 
              v-model="newLog.cost" 
              type="number" 
              min="0"
              placeholder="0 (ถ้าไม่มีให้ใส่ 0)" 
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-bold focus:border-emerald-600"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-900 mb-2">4. รายละเอียดเพิ่มเติม / หมายเหตุ:</label>
            <textarea 
              v-model="newLog.details" 
              rows="3" 
              placeholder="พิมพ์รายละเอียดเพิ่มเติมตรงนี้..."
              class="w-full border-2 border-slate-300 rounded-xl p-4 text-slate-900 font-medium focus:border-emerald-600"
            ></textarea>
          </div>

          <div class="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-200">
            <button 
              type="button" 
              @click="isModalOpen = false" 
              class="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-lg cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-lg shadow-md cursor-pointer transition-colors"
            >
              ✓ บันทึกข้อมูล
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>