<script setup>
import { ref, computed } from 'vue'
import {
  PackagePlus,
  Calendar,
  Tag,
  Wallet,
  Boxes,
  Calculator,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FolderPlus,
  Package,
  Sparkles
} from 'lucide-vue-next'

// --- User Context & Role Check ---
const currentUser = ref({
  id: 'USR-001',
  name: 'นายสมศักดิ์ รักการดี',
  role: 'Admin'
})

const isAuthorized = computed(() => ['Admin', 'Staff'].includes(currentUser.value.role))

// --- Helper: Format DATE เป็นภาษาไทย ---
const formatThaiDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// --- Mock Master Items Database (ตาราง items) ---
const items = ref([
  { id: 'ITM-001', name: 'กระดาษ A4 80 แกรม (Double A)', category: 'วัสดุสำนักงาน', current_stock: 120, unit: 'รีม', min_stock: 20 },
  { id: 'ITM-002', name: 'ปากกาลูกลื่น น้ำเงิน 0.5 มม.', category: 'วัสดุสำนักงาน', current_stock: 45, unit: 'ด้าม', min_stock: 50 },
  { id: 'ITM-003', name: 'หมึกพิมพ์ HP Laserjet 85A', category: 'วัสดุคอมพิวเตอร์', current_stock: 8, unit: 'ตลับ', min_stock: 10 },
  { id: 'ITM-004', name: 'น้ำยาทำความสะอาดพื้น 5,000 มล.', category: 'วัสดุงานบ้านงานครัว', current_stock: 15, unit: 'แกลลอน', min_stock: 5 }
])

// --- Stock Transactions History (ตาราง stock_transactions) ---
const stockTransactions = ref([
  {
    id: 'TX-2026-001',
    itemId: 'ITM-001',
    itemName: 'กระดาษ A4 80 แกรม (Double A)',
    type: 'IN',
    qty: 50,
    unitPrice: 115,
    totalPrice: 5750,
    receivedDate: '2026-07-15',
    operator: 'นายสมศักดิ์ รักการดี'
  }
])

// --- Form State ---
const todayStr = new Date().toISOString().substring(0, 10)

// 'EXISTING' = วัสดุเดิมที่มีอยู่แล้ว | 'NEW' = วัสดุใหม่
const itemSourceType = ref('EXISTING')

const formData = ref({
  receivedDate: todayStr,
  acquisitionMethod: 'สอบราคา',
  budgetType: 'เงินงบประมาณ',

  // สำหรับวัสดุเดิม
  selectedItemId: '',

  // สำหรับวัสดุใหม่
  newItemName: '',
  newItemCategory: 'วัสดุสำนักงาน',
  newItemUnit: 'ชิ้น',

  // จำนวนและราคา
  unitPrice: 0,
  qty: 1,
  remark: ''
})

// ค้นหาวัตถุ Item กรณีเลือกรายการเดิม
const selectedExistingItem = computed(() => {
  return items.value.find(item => item.id === formData.value.selectedItemId) || null
})

// คำนวณราคารวมอัตโนมัติ
const totalPrice = computed(() => {
  const price = Number(formData.value.unitPrice) || 0
  const count = Number(formData.value.qty) || 0
  return price * count
})

// สรุปชื่อวัสดุที่กำลังจะบันทึก
const displayItemName = computed(() => {
  if (itemSourceType.value === 'EXISTING') {
    return selectedExistingItem.value ? selectedExistingItem.value.name : 'กรุณาเลือกวัสดุที่มีอยู่ในระบบ...'
  } else {
    return formData.value.newItemName || 'กรุณากรอกชื่อวัสดุใหม่...'
  }
})

// สรุปหน่วยนับ
const displayUnit = computed(() => {
  if (itemSourceType.value === 'EXISTING') {
    return selectedExistingItem.value ? selectedExistingItem.value.unit : 'หน่วย'
  } else {
    return formData.value.newItemUnit || 'หน่วย'
  }
})

// คำนวณสต๊อกใหม่
const projectedStock = computed(() => {
  const inputQty = Number(formData.value.qty) || 0
  if (itemSourceType.value === 'EXISTING') {
    if (!selectedExistingItem.value) return 0
    return selectedExistingItem.value.current_stock + inputQty
  } else {
    return inputQty // ถ้าเป็นวัสดุใหม่ สต๊อกตั้งต้นคือจำนวนที่รับเข้ามาเลย
  }
})

// Modal Status
const showSuccessModal = ref(false)
const lastSavedData = ref(null)

// --- Submit Function ---
const handleSaveStockReceive = () => {
  const qtyToAdd = Number(formData.value.qty)
  const pricePerUnit = Number(formData.value.unitPrice)
  let targetItemId = ''
  let targetItemName = ''

  if (itemSourceType.value === 'EXISTING') {
    if (!selectedExistingItem.value) return
    // 1. อัปเดตตาราง items เดิม
    selectedExistingItem.value.current_stock += qtyToAdd
    targetItemId = selectedExistingItem.value.id
    targetItemName = selectedExistingItem.value.name
  } else {
    if (!formData.value.newItemName.trim()) return
    // 2. กรณีวัสดุใหม่ -> สร้างไอเทมใหม่เพิ่มลงตาราง items
    targetItemId = `ITM-00${items.value.length + 1}`
    targetItemName = formData.value.newItemName.trim()

    items.value.push({
      id: targetItemId,
      name: targetItemName,
      category: formData.value.newItemCategory,
      current_stock: qtyToAdd,
      unit: formData.value.newItemUnit,
      min_stock: 5
    })
  }

  // 3. เพิ่มลงตาราง stock_transactions
  const newTx = {
    id: `TX-${Date.now().toString().slice(-6)}`,
    itemId: targetItemId,
    itemName: targetItemName,
    type: 'IN',
    qty: qtyToAdd,
    unitPrice: pricePerUnit,
    totalPrice: qtyToAdd * pricePerUnit,
    receivedDate: formData.value.receivedDate,
    acquisitionMethod: formData.value.acquisitionMethod,
    budgetType: formData.value.budgetType,
    remark: formData.value.remark,
    operator: currentUser.value.name,
    createdAt: new Date().toLocaleString('th-TH')
  }

  stockTransactions.value.unshift(newTx)
  lastSavedData.value = newTx
  showSuccessModal.value = true

  // Reset Form
  formData.value = {
    receivedDate: todayStr,
    acquisitionMethod: 'สอบราคา',
    budgetType: 'เงินงบประมาณ',
    selectedItemId: '',
    newItemName: '',
    newItemCategory: 'วัสดุสำนักงาน',
    newItemUnit: 'ชิ้น',
    unitPrice: 0,
    qty: 1,
    remark: ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100/80 text-slate-800 p-4 sm:p-6 md:p-8 font-sans space-y-6">

    <!-- Guard Notice -->
    <div v-if="!isAuthorized"
      class="max-w-2xl mx-auto mt-12 bg-white rounded-3xl p-8 shadow-xl text-center border-2 border-rose-200">
      <AlertCircle class="w-16 h-16 text-rose-500 mx-auto mb-4" />
      <h2 class="text-2xl font-extrabold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
    </div>

    <!-- Main Container -->
    <div v-else class="w-full space-y-6">

      <!-- Header Banner ขยายเต็มความกว้าง (เหมือน AssetTimeline) -->
      <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl print:hidden">
        <!-- Background Mesh Gradient -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]">
          </div>
          <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]">
          </div>
          <div
            class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]">
          </div>
        </div>

        <div class="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div
              class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md shrink-0">
              <PackagePlus class="w-8 h-8" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-extrabold px-3 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-md">
                  ระบบสต๊อกหลัก
                </span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">บันทึกการรับพัสดุเข้าคลัง</h1>
            </div>
          </div>

          <div
            class="flex items-center gap-2 bg-black/20 border border-white/10 p-2.5 rounded-xl backdrop-blur-md self-start md:self-auto shrink-0">
            <ShieldCheck class="w-5 h-5 text-emerald-400 ml-1" />
            <span class="text-sm font-bold text-white pr-2">{{ currentUser.name }}</span>
          </div>
        </div>
      </div>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Left Side: Interactive Form -->
        <form @submit.prevent="handleSaveStockReceive"
          class="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8">

          <!-- Section 1: ข้อมูลทั่วไป -->
          <div>
            <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              1. ข้อมูลการรับเข้าตามเอกสาร
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                  <Calendar class="w-5 h-5 text-emerald-600" /> วัน เดือน ปี ที่รับ
                </label>
                <input v-model="formData.receivedDate" type="date" required
                  class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer" />
              </div>

              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                  <Tag class="w-5 h-5 text-emerald-600" /> วิธีการได้มา
                </label>
                <select v-model="formData.acquisitionMethod"
                  class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer">
                  <option value="ตกลงราคา">ตกลงราคา</option>
                  <option value="สอบราคา">สอบราคา</option>
                  <option value="ประกวดราคา">ประกวดราคา</option>
                  <option value="วิธีเฉพาะเจาะจง">วิธีเฉพาะเจาะจง</option>
                  <option value="รับบริจาค / รับมอบ">รับบริจาค / รับมอบ</option>
                </select>
              </div>

              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                  <Wallet class="w-5 h-5 text-emerald-600" /> ประเภทเงิน
                </label>
                <select v-model="formData.budgetType"
                  class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer">
                  <option value="เงินงบประมาณ">เงินงบประมาณ</option>
                  <option value="เงินนอกงบประมาณ">เงินนอกงบประมาณ</option>
                  <option value="เงินรายได้สถานศึกษา">เงินรายได้สถานศึกษา</option>
                  <option value="เงินบริจาค">เงินบริจาค</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: เลือกประเภทวัสดุ (เดิม vs ใหม่) -->
          <div>
            <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              2. เลือกรายการหรือลงทะเบียนพัสดุใหม่
            </h2>

            <!-- Radio Switch Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <label :class="[
                'p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all',
                itemSourceType === 'EXISTING'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              ]">
                <input type="radio" v-model="itemSourceType" value="EXISTING"
                  class="w-6 h-6 text-emerald-600 accent-emerald-600" />
                <div class="space-y-0.5">
                  <span class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Package class="w-5 h-5 text-emerald-600 shrink-0" />
                    วัสดุที่มีในคลังอยู่แล้ว
                  </span>
                  <span class="text-sm font-medium text-slate-500 block">เลือกพัสดุเดิมเพื่อเพิ่มจำนวนสต๊อก</span>
                </div>
              </label>

              <label :class="[
                'p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all',
                itemSourceType === 'NEW'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              ]">
                <input type="radio" v-model="itemSourceType" value="NEW"
                  class="w-6 h-6 text-emerald-600 accent-emerald-600" />
                <div class="space-y-0.5">
                  <span class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles class="w-5 h-5 text-emerald-600 shrink-0" />
                    พัสดุ/วัสดุใหม่ (ยังไม่มีในระบบ)
                  </span>
                  <span class="text-sm font-medium text-slate-500 block">กรอกชื่อเพื่อลงทะเบียนเข้าคลังใหม่</span>
                </div>
              </label>
            </div>

            <!-- Case 1: เลือกวัสดุเดิม -->
            <div v-if="itemSourceType === 'EXISTING'" class="mt-6">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Boxes class="w-5 h-5 text-emerald-600" /> เลือกรายการพัสดุเดิม <span class="text-rose-500">*</span>
              </label>
              <select v-model="formData.selectedItemId" required
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg md:text-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer shadow-sm">
                <option value="" disabled>-- คลิกเพื่อเลือกรายการพัสดุเดิม --</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  [{{ item.id }}] {{ item.name }} (มีอยู่แล้ว {{ item.current_stock }} {{ item.unit }})
                </option>
              </select>
            </div>

            <!-- Case 2: ช่องกรอกวัสดุใหม่ (จะโชว์เฉพาะเมื่อเลือก "วัสดุใหม่") -->
            <div v-else class="mt-6 p-6 bg-slate-50 rounded-2xl border-2 border-emerald-200 space-y-4">
              <div class="flex items-center gap-2 text-emerald-800 font-extrabold text-lg">
                <PlusCircle class="w-6 h-6 text-emerald-600" />
                <span>กรอกรายละเอียดพัสดุใหม่</span>
              </div>

              <!-- ช่องกรอกชื่อวัสดุใหม่ -->
              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2">
                  ชื่อพัสดุ/วัสดุใหม่ <span class="text-rose-500">*</span>
                </label>
                <input v-model="formData.newItemName" type="text" required
                  placeholder="เช่น ปลั๊กไฟ 3 ตา 5 เมตร, แฟ้มตราช้าง 444..."
                  class="w-full bg-white border-2 border-slate-300 rounded-2xl p-4 text-slate-900 font-extrabold text-xl focus:outline-none focus:border-emerald-600 shadow-sm" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- หมวดหมู่ -->
                <div>
                  <label class="block text-base font-extrabold text-slate-800 mb-2">หมวดหมู่</label>
                  <select v-model="formData.newItemCategory"
                    class="w-full bg-white border-2 border-slate-300 rounded-2xl p-3.5 text-slate-900 font-bold text-base focus:border-emerald-600">
                    <option value="วัสดุสำนักงาน">วัสดุสำนักงาน</option>
                    <option value="วัสดุคอมพิวเตอร์">วัสดุคอมพิวเตอร์</option>
                    <option value="วัสดุไฟฟ้าและวิทยุ">วัสดุไฟฟ้าและวิทยุ</option>
                    <option value="วัสดุงานบ้านงานครัว">วัสดุงานบ้านงานครัว</option>
                  </select>
                </div>

                <!-- หน่วยนับ -->
                <div>
                  <label class="block text-base font-extrabold text-slate-800 mb-2">หน่วยนับ</label>
                  <input v-model="formData.newItemUnit" type="text" required placeholder="เช่น อัน, กล่อง, แฟ้ม, ด้าม"
                    class="w-full bg-white border-2 border-slate-300 rounded-2xl p-3.5 text-slate-900 font-bold text-base focus:border-emerald-600" />
                </div>
              </div>
            </div>

            <!-- จำนวน & ราคา -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2">
                  ราคาต่อหน่วย (บาท) <span class="text-rose-500">*</span>
                </label>
                <input v-model="formData.unitPrice" type="number" step="0.01" min="0" required placeholder="0.00"
                  class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-extrabold text-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
              </div>

              <div>
                <label class="block text-base font-extrabold text-slate-800 mb-2">
                  จำนวนที่รับเข้า <span class="text-rose-500">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <input v-model="formData.qty" type="number" min="1" required
                    class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-extrabold text-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
                  <span class="text-lg font-bold text-slate-600 min-w-[50px]">
                    {{ displayUnit }}
                  </span>
                </div>
              </div>
            </div>

            <!-- หมายเหตุ -->
            <div class="mt-6">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <FileText class="w-5 h-5 text-slate-500" /> หมายเหตุ / เลขที่ใบสั่งซื้อ
              </label>
              <textarea v-model="formData.remark" rows="2" placeholder="เช่น ใบสั่งซื้อเลขที่ PO-2569/088..."
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-medium text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit"
              :disabled="(itemSourceType === 'EXISTING' && !selectedExistingItem) || (itemSourceType === 'NEW' && !formData.newItemName.trim())"
              :class="[
                'w-full sm:w-auto px-10 py-5 rounded-2xl text-xl font-extrabold text-white flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer active:scale-95',
                (itemSourceType === 'EXISTING' && selectedExistingItem) || (itemSourceType === 'NEW' && formData.newItemName.trim())
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              ]">
              <CheckCircle2 class="w-7 h-7 stroke-[2.5]" />
              <span>บันทึกการรับพัสดุเข้าคลัง</span>
            </button>
          </div>

        </form>

        <!-- Right Side: Live Summary Panel -->
        <div class="lg:col-span-4 space-y-6">
          <div
            class="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <h3 class="text-lg font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-3">
              <Calculator class="w-5 h-5 text-emerald-400" /> สรุปยอดรายการที่จะรับเข้า
            </h3>

            <div class="mt-6 space-y-6">
              <div>
                <span class="text-sm font-medium text-slate-400 block">พัสดุรายการนี้:</span>
                <p class="text-xl font-extrabold text-emerald-400 mt-1 leading-snug">
                  {{ displayItemName }}
                </p>
                <span v-if="itemSourceType === 'NEW'"
                  class="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-xs font-bold border border-emerald-500/30">
                  <Sparkles class="w-3.5 h-3.5 text-emerald-300" /> พัสดุรายการใหม่
                </span>
              </div>

              <div class="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3">
                <div class="flex items-center justify-between text-base">
                  <span class="text-slate-400">สต๊อกเดิม:</span>
                  <span class="font-mono font-bold text-white text-lg">
                    {{ itemSourceType === 'EXISTING' && selectedExistingItem ? selectedExistingItem.current_stock : 0 }}
                    {{ displayUnit }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between text-base text-emerald-400 font-bold border-t border-b border-slate-700 py-2">
                  <span>+ รับเข้าครั้งนี้:</span>
                  <span class="font-mono text-xl">+ {{ formData.qty || 0 }} {{ displayUnit }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-slate-300 font-bold">สต๊อกรวมใหม่:</span>
                  <span class="font-mono font-extrabold text-2xl text-teal-300">{{ projectedStock }} {{ displayUnit
                    }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-700">
                <span class="text-sm font-medium text-slate-400 block">รวมมูลค่ารับเข้าทั้งสิ้น:</span>
                <p class="text-3xl font-black text-white mt-1">
                  ฿{{ totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- History Preview -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <h4 class="text-lg font-extrabold text-slate-900 mb-4 flex items-center justify-between">
              <span>รายการรับเข้าล่าสุด</span>
              <RefreshCw class="w-4 h-4 text-slate-400" />
            </h4>

            <div class="space-y-3 max-h-[250px] overflow-y-auto">
              <div v-for="tx in stockTransactions.slice(0, 3)" :key="tx.id"
                class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-sm">
                <div class="flex justify-between items-start font-bold text-slate-900">
                  <span class="line-clamp-1">{{ tx.itemName }}</span>
                  <span class="text-emerald-700 font-mono font-extrabold ml-2 shrink-0">+{{ tx.qty }}</span>
                </div>
                <div class="text-xs text-slate-500 mt-1 flex justify-between items-center">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-slate-400" />
                    {{ formatThaiDate(tx.receivedDate) }}
                  </span>
                  <span>฿{{ tx.totalPrice.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
        <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-12 h-12 stroke-[2.5]" />
        </div>

        <div>
          <h3 class="text-2xl font-extrabold text-slate-900">บันทึกรับเข้าสำเร็จ!</h3>
          <p class="text-base text-slate-600 mt-2">
            ระบบอัปเดตข้อมูลพัสดุในตาราง <code
              class="bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-bold">items</code> และบันทึกประวัติลงใน
            <code class="bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-bold">stock_transactions</code>
            เรียบร้อยแล้ว
          </p>
        </div>

        <button @click="showSuccessModal = false"
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-lg shadow-lg cursor-pointer transition-all">
          ตกลง / ทำรายการต่อไป
        </button>
      </div>
    </div>

  </div>
</template>