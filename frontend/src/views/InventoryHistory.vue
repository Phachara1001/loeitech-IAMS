<script setup>
import { ref, computed } from 'vue'
import {
  History,
  Search,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-vue-next'

// ==========================================
// 1. USER & ROLE CONTEXT (Admin / Staff)
// ==========================================
const currentUser = ref({
  id: 'STF-001',
  name: 'นางสาววิภาดา พัสดุ',
  role: 'Staff' // 'Admin' | 'Staff'
})

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

// ==========================================
// 2. MASTER INVENTORY DATA
// ==========================================
const inventoryItems = ref([
  { id: 'SKU-001', code: 'PAS-01-001', name: 'กระดาษ A4 80 GSM (รีม)', category: 'วัสดุสำนักงาน', unit: 'รีม', minStock: 20 },
  { id: 'SKU-002', code: 'PAS-01-002', name: 'ปากกาลูกลื่น น้ำเงิน 0.5mm', category: 'วัสดุสำนักงาน', unit: 'ด้าม', minStock: 50 },
  { id: 'SKU-003', code: 'PAS-02-005', name: 'หมึกพิมพ์ HP Laser Toner 85A', category: 'วัสดุคอมพิวเตอร์', unit: 'กล่อง', minStock: 3 }
])

const selectedSkuId = ref('SKU-001')

const selectedItem = computed(() => {
  return inventoryItems.value.find(i => i.id === selectedSkuId.value) || inventoryItems.value[0]
})

// ==========================================
// 3. MOCK TRANSACTIONS DATABASE (พ.3102-8)
// ==========================================
const rawTransactions = ref([
  { id: 1, skuId: 'SKU-001', date: '2026-01-05', docNo: 'INV-69/001', type: 'IN', qty: 200, note: 'ตรวจรับเข้าคลัง จากสัญญาซื้อขายเลขที่ 12/2569', operator: 'งานพัสดุกลาง' },
  { id: 2, skuId: 'SKU-001', date: '2026-01-15', docNo: 'REQ-2026-001', type: 'OUT', qty: 15, note: 'เบิกใช้ งานสารบรรณกลาง', operator: 'นายสมชาย ใจดี' },
  { id: 3, skuId: 'SKU-001', date: '2026-02-02', docNo: 'REQ-2026-008', type: 'OUT', qty: 20, note: 'เบิกใช้ การสอบกลางภาคเรียนที่ 2', operator: 'ฝ่ายวิชาการ' },
  { id: 4, skuId: 'SKU-001', date: '2026-03-10', docNo: 'REQ-2026-015', type: 'OUT', qty: 30, note: 'เบิกใช้ โครงการอบรมวิชาชีพ', operator: 'แผนกช่างยนต์' },
  { id: 5, skuId: 'SKU-001', date: '2026-04-05', docNo: 'INV-69/042', type: 'IN', qty: 100, note: 'จัดซื้อเพิ่มประจำไตรมาส 2', operator: 'งานพัสดุกลาง' },
  { id: 6, skuId: 'SKU-001', date: '2026-05-12', docNo: 'REQ-2026-022', type: 'OUT', qty: 25, note: 'เบิกใช้ งานประเมินสถานศึกษา', operator: 'งานประกันคุณภาพ' },
  { id: 7, skuId: 'SKU-001', date: '2026-06-20', docNo: 'REQ-2026-035', type: 'OUT', qty: 40, note: 'เบิกใช้ พิมพ์เอกสารการลงทะเบียน', operator: 'งานทะเบียน' },
  { id: 8, skuId: 'SKU-001', date: '2026-07-08', docNo: 'REQ-2026-041', type: 'OUT', qty: 18, note: 'เบิกใช้ งานประชุมสภาวิทยาลัย', operator: 'สำนักงานผู้อำนวยการ' },
  { id: 9, skuId: 'SKU-002', date: '2026-01-05', docNo: 'INV-69/001', type: 'IN', qty: 500, note: 'ยกยอดมาจากปีงบประมาณก่อน', operator: 'งานพัสดุกลาง' },
  { id: 10, skuId: 'SKU-002', date: '2026-02-10', docNo: 'REQ-2026-010', type: 'OUT', qty: 50, note: 'แจกครูประจำชั้นภาคเรียนใหม่', operator: 'ฝ่ายปกครอง' }
])

// ==========================================
// 4. TRANSACTION LOGIC & BALANCE CALCULATION
// ==========================================
const searchQuery = ref('')
const selectedYear = ref('2026')

const calculatedTransactions = computed(() => {
  const items = rawTransactions.value
    .filter(t => t.skuId === selectedSkuId.value && t.date.startsWith(selectedYear.value))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  let runningBalance = 0

  return items.map(t => {
    if (t.type === 'IN') {
      runningBalance += t.qty
    } else if (t.type === 'OUT') {
      runningBalance -= t.qty
    }

    return {
      ...t,
      inQty: t.type === 'IN' ? t.qty : 0,
      outQty: t.type === 'OUT' ? t.qty : 0,
      balance: runningBalance
    }
  }).filter(t => {
    return t.docNo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.note.includes(searchQuery.value) ||
      t.operator.includes(searchQuery.value)
  })
})

const currentStockBalance = computed(() => {
  const list = calculatedTransactions.value
  return list.length > 0 ? list[list.length - 1].balance : 0
})

// ==========================================
// 5. MONTHLY REQUISITION SUMMARY
// ==========================================
const monthsTH = [
  { num: '01', short: 'ม.ค.', name: 'มกราคม' },
  { num: '02', short: 'ก.พ.', name: 'กุมภาพันธ์' },
  { num: '03', short: 'มี.ค.', name: 'มีนาคม' },
  { num: '04', short: 'เม.ย.', name: 'เมษายน' },
  { num: '05', short: 'พ.ค.', name: 'พฤษภาคม' },
  { num: '06', short: 'มิ.ย.', name: 'มิถุนายน' },
  { num: '07', short: 'ก.ค.', name: 'กรกฎาคม' },
  { num: '08', short: 'ส.ค.', name: 'สิงหาคม' },
  { num: '09', short: 'ก.ย.', name: 'กันยายน' },
  { num: '10', short: 'ต.ค.', name: 'ตุลาคม' },
  { num: '11', short: 'พ.ย.', name: 'พฤศจิกายน' },
  { num: '12', short: 'ธ.ค.', name: 'ธันวาคม' }
]

const monthlyUsageSummary = computed(() => {
  const summary = {}
  monthsTH.forEach(m => summary[m.num] = 0)

  rawTransactions.value
    .filter(t => t.skuId === selectedSkuId.value && t.type === 'OUT' && t.date.startsWith(selectedYear.value))
    .forEach(t => {
      const monthNum = t.date.split('-')[1]
      if (summary[monthNum] !== undefined) {
        summary[monthNum] += t.qty
      }
    })

  return summary
})

const totalYearlyOut = computed(() => {
  return Object.values(monthlyUsageSummary.value).reduce((a, b) => a + b, 0)
})
</script>

<template>
  <div class="relative w-full min-h-screen p-4 md:p-8 bg-slate-100 text-slate-800 space-y-6">

    <!-- Global Top Header Bar (เหมือน AssetTimeline) -->
    <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl print:hidden">
      <!-- Background Mesh Gradient -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]"></div>
        <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]"></div>
        <div class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]"></div>
      </div>

      <div class="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md">
            <History class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">ประวัติการเคลื่อนไหวพัสดุ</h1>
            <p class="text-emerald-100/80 text-sm sm:text-base mt-1">บัญชีคุมพัสดุสิ้นเปลือง แสดงประวัติรับ-จ่าย และสรุปความต้องการเบิกใช้รายเดือน</p>
          </div>
        </div>

        <!-- Role Switcher (Admin / Staff Only) -->
        <div class="flex items-center gap-2 bg-black/20 border border-white/10 p-2 rounded-xl backdrop-blur-md shrink-0">
          <span class="text-xs sm:text-sm text-emerald-100/80 font-medium px-2">สิทธิ์ผู้ใช้:</span>
          <button 
            @click="currentUser.role = 'Admin'" 
            :class="['px-3.5 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Admin' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Admin
          </button>
          <button 
            @click="currentUser.role = 'Staff'" 
            :class="['px-3.5 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition backdrop-blur-md cursor-pointer', currentUser.role === 'Staff' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-100/70 hover:bg-white/10']"
          >
            Staff
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT FOR ADMIN & STAFF -->
    <div class="space-y-6">

      <!-- Item Selection & Summary Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div class="flex-1">
            <label class="block text-xs font-bold text-slate-400 mb-1">เลือกรายการพัสดุเพื่อดูบัญชีคุม:</label>
            <select 
              v-model="selectedSkuId" 
              class="w-full text-base md:text-lg font-extrabold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option v-for="item in inventoryItems" :key="item.id" :value="item.id">
                [{{ item.code }}] {{ item.name }} (หมวด: {{ item.category }})
              </option>
            </select>
          </div>
        </div>

        <!-- Stock Indicator Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">รหัสพัสดุ</span>
            <span class="font-mono font-bold text-slate-900 text-lg">{{ selectedItem.code }}</span>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">หน่วยนับ</span>
            <span class="font-bold text-slate-900 text-lg">{{ selectedItem.unit }}</span>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">จุดสั่งซื้อเพิ่ม (Min Stock)</span>
            <span class="font-bold text-slate-900 text-lg">{{ selectedItem.minStock }} {{ selectedItem.unit }}</span>
          </div>
          <div class="p-4 rounded-xl border" :class="currentStockBalance <= selectedItem.minStock ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50/60 border-emerald-100 text-emerald-800'">
            <span class="text-xs font-bold block opacity-80">ยอดคงคลังปัจจุบัน (Balance)</span>
            <span class="font-extrabold text-2xl flex items-center gap-2">
              {{ currentStockBalance }} {{ selectedItem.unit }}
              <AlertTriangle v-if="currentStockBalance <= selectedItem.minStock" class="w-5 h-5 text-rose-600 shrink-0" />
            </span>
          </div>
        </div>

      </div>

      <!-- MONTHLY USAGE SUMMARY TABLE (ม.ค. - ธ.ค.) -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-emerald-800" />
            ตารางสรุปยอดความต้องการเบิกใช้รายเดือน (ม.ค. - ธ.ค. {{ Number(selectedYear) + 543 }})
          </h3>
          <span class="text-xs font-bold text-slate-400">หน่วย: {{ selectedItem.unit }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-center text-xs md:text-sm border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-extrabold">
                <th v-for="m in monthsTH" :key="m.num" class="border border-slate-200 p-2.5">
                  {{ m.short }}
                </th>
                <th class="border border-slate-200 p-2.5 bg-emerald-800 text-white">รวมทั้งปี</th>
              </tr>
            </thead>
            <tbody class="font-bold text-slate-800">
              <tr>
                <td v-for="m in monthsTH" :key="m.num" class="border border-slate-200 p-3">
                  <span v-if="monthlyUsageSummary[m.num] > 0" class="text-slate-900 font-extrabold">
                    {{ monthlyUsageSummary[m.num] }}
                  </span>
                  <span v-else class="text-slate-300 inline-flex items-center justify-center">
                    <Minus class="w-3 h-3 text-slate-300" />
                  </span>
                </td>
                <td class="border border-slate-200 p-3 bg-emerald-50 font-extrabold text-emerald-900 text-base">
                  {{ totalYearlyOut }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TRANSACTION HISTORY TABLE (แบบ พ.3102-8 หน้า 2) -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <!-- Search Bar Header -->
        <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <ArrowUpDown class="w-5 h-5 text-emerald-800" />
            รายงานการรับ - จ่ายพัสดุ (เรียงตาม วัน เดือน ปี)
          </div>

          <div class="relative w-full sm:w-80">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="ค้นหาเลขที่เอกสาร, หมายเหตุ..."
              class="pl-10 pr-4 py-2 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" 
            />
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th class="px-6 py-4 text-center border-r border-slate-200/60">วัน เดือน ปี</th>
                <th class="px-6 py-4 border-r border-slate-200/60">เลขที่เอกสารอ้างอิง</th>
                <th class="px-6 py-4 border-r border-slate-200/60">รายการ / ผู้ขอเบิก / หมายเหตุ</th>
                <th class="px-6 py-4 text-center border-r border-slate-200/60 text-emerald-800 bg-emerald-50/40">รับเข้า (+)</th>
                <th class="px-6 py-4 text-center border-r border-slate-200/60 text-rose-700 bg-rose-50/40">จ่ายออก (-)</th>
                <th class="px-6 py-4 text-center border-r border-slate-200/60 bg-slate-100 font-extrabold text-slate-900">คงเหลือ (Balance)</th>
                <th class="px-6 py-4 text-center">ผู้บันทึกรายการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-medium">
              <tr v-for="t in calculatedTransactions" :key="t.id" class="hover:bg-slate-50/80 transition-colors">
                
                <!-- วัน เดือน ปี -->
                <td class="px-6 py-4 text-center font-bold text-slate-700 border-r border-slate-200/60">
                  <div class="flex items-center justify-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ formatThaiDate(t.date) }}</span>
                  </div>
                </td>

                <!-- เลขที่เอกสารอ้างอิง -->
                <td class="px-6 py-4 font-mono font-extrabold text-slate-900 border-r border-slate-200/60">
                  {{ t.docNo }}
                </td>

                <!-- รายการ / หมายเหตุ -->
                <td class="px-6 py-4 border-r border-slate-200/60 max-w-xs truncate">
                  <span class="text-slate-800 font-semibold">{{ t.note }}</span>
                </td>

                <!-- รับเข้า -->
                <td class="px-6 py-4 text-center font-bold text-emerald-800 bg-emerald-50/20 border-r border-slate-200/60">
                  <span v-if="t.inQty > 0" class="inline-flex items-center gap-1">
                    <TrendingUp class="w-4 h-4 text-emerald-600" />
                    +{{ t.inQty }}
                  </span>
                  <span v-else class="text-slate-300 inline-flex items-center justify-center">
                    <Minus class="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </td>

                <!-- จ่ายออก -->
                <td class="px-6 py-4 text-center font-bold text-rose-700 bg-rose-50/20 border-r border-slate-200/60">
                  <span v-if="t.outQty > 0" class="inline-flex items-center gap-1">
                    <TrendingDown class="w-4 h-4 text-rose-500" />
                    -{{ t.outQty }}
                  </span>
                  <span v-else class="text-slate-300 inline-flex items-center justify-center">
                    <Minus class="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </td>

                <!-- ยอดคงเหลือสะสม (Balance Qty) -->
                <td class="px-6 py-4 text-center font-mono font-extrabold text-slate-900 text-base bg-slate-50 border-r border-slate-200/60">
                  {{ t.balance }} {{ selectedItem.unit }}
                </td>

                <!-- ผู้บันทึก -->
                <td class="px-6 py-4 text-center text-xs text-slate-500 font-medium">
                  {{ t.operator }}
                </td>

              </tr>

              <tr v-if="calculatedTransactions.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-slate-400 font-medium">
                  ไม่พบประวัติการเคลื่อนไหวพัสดุรายการนี้
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>

  </div>
</template>