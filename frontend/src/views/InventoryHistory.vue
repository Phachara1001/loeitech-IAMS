<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  History,
  Search,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2,
  Printer,
  X,
  PackageSearch,
  PackageOpen
} from 'lucide-vue-next'
import api from '../services/api'
import { useToast } from '../composables/useToast'

const toast = useToast()

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
// 2. รายการพัสดุ (สำหรับ dropdown) — โหลดจาก backend จริง ไม่มีข้อมูลสมมุติอีกต่อไป
// ==========================================
const inventoryItems = ref([])
const isLoadingItems = ref(true)
const itemsLoadError = ref('')

const selectedSkuId = ref('')

const selectedItem = computed(() => {
  return inventoryItems.value.find(i => i.id === selectedSkuId.value) || null
})

// --- Modal Selection Logic ---
const isItemSelectorOpen = ref(false)
const searchItemQuery = ref('')

const filteredItemsForSelector = computed(() => {
  if (!searchItemQuery.value) return inventoryItems.value
  const q = searchItemQuery.value.toLowerCase()
  return inventoryItems.value.filter(item => 
    item.name.toLowerCase().includes(q) || 
    item.code.toLowerCase().includes(q) || 
    item.category.toLowerCase().includes(q)
  )
})

function selectItem(item) {
  selectedSkuId.value = item.id
  isItemSelectorOpen.value = false
  searchItemQuery.value = ''
}

async function loadItems() {
  isLoadingItems.value = true
  itemsLoadError.value = ''
  try {
    const { data } = await api.get('/items')
    // แปลงข้อมูลดิบจาก backend ให้ตรงกับ shape ที่หน้านี้ใช้แสดงผล
    inventoryItems.value = (data.data || data).map((it) => ({
      id: it.id,
      code: it.sku || it.code,
      name: it.name,
      category: it.category,
      unit: it.unit,
      minStock: it.minThreshold ?? it.minStock ?? 0
    }))
    if (inventoryItems.value.length > 0 && !selectedSkuId.value) {
      selectedSkuId.value = inventoryItems.value[0].id
    }
  } catch (err) {
    itemsLoadError.value = 'ไม่สามารถโหลดรายการพัสดุได้ กรุณาลองใหม่อีกครั้ง'
    toast.error(err.message || 'โหลดรายการพัสดุไม่สำเร็จ')
  } finally {
    isLoadingItems.value = false
  }
}

// ==========================================
// 3. ประวัติการเคลื่อนไหว (รายการรับ-จ่าย) ของรายการที่เลือก — โหลดจาก backend จริง
// ==========================================
const rawTransactions = ref([])
const isLoadingTransactions = ref(false)
const transactionsLoadError = ref('')

async function loadTransactions() {
  if (!selectedSkuId.value) {
    rawTransactions.value = []
    return
  }

  isLoadingTransactions.value = true
  transactionsLoadError.value = ''
  try {
    const { data } = await api.get(`/items/${selectedSkuId.value}/transactions`, {
      params: selectedYear.value ? { year: selectedYear.value } : {}
    })
    const list = data.data || data.transactions || data
    // แปลงข้อมูลดิบจาก backend (model StockTransaction จริง) ให้ตรงกับ shape ที่หน้านี้ใช้คำนวณ running balance
    // หมายเหตุ: StockTransaction ไม่มีฟิลด์เลขที่เอกสารอ้างอิง (docNo) เลย จึงยังโชว์ "-" ไปก่อน
    rawTransactions.value = list.map((t) => ({
      id: t.id,
      skuId: t.itemId ?? selectedSkuId.value,
      date: t.receivedDate,
      docNo: t.referenceNo || t.docNo || '-',
      type: t.transactionType,
      qty: t.quantity ?? 0,
      note: t.remarks || '',
      operator: t.operatorName || 'ไม่ระบุ'
    }))
  } catch (err) {
    transactionsLoadError.value = 'ไม่สามารถโหลดประวัติการเคลื่อนไหวได้ กรุณาลองใหม่อีกครั้ง'
    toast.error(err.message || 'โหลดประวัติการเคลื่อนไหวไม่สำเร็จ')
  } finally {
    isLoadingTransactions.value = false
  }
}

// ==========================================
// 4. TRANSACTION LOGIC & BALANCE CALCULATION
// ==========================================
const searchQuery = ref('')
const currentYearBE = new Date().getFullYear() + 543
const selectedYear = ref(String(currentYearBE - 543)) // ปี ค.ศ. ที่ใช้ query backend

const calculatedTransactions = computed(() => {
  // rawTransactions ตอนนี้ backend กรองให้ตรงรายการ+ปีที่เลือกแล้ว เหลือแค่เรียงลำดับ + คำนวณยอดคงเหลือสะสม
  const items = [...rawTransactions.value].sort((a, b) => new Date(a.date) - new Date(b.date))

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
    if (!searchQuery.value) return true
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
    .filter(t => t.type === 'OUT')
    .forEach(t => {
      const monthNum = (t.date || '').split('-')[1]
      if (monthNum && summary[monthNum] !== undefined) {
        summary[monthNum] += t.qty
      }
    })

  return summary
})

const totalYearlyOut = computed(() => {
  return Object.values(monthlyUsageSummary.value).reduce((a, b) => a + b, 0)
})

// ==========================================
// 6. LIFECYCLE — โหลดรายการพัสดุก่อน แล้วค่อยโหลดประวัติของรายการที่เลือก
// โหลดประวัติใหม่ทุกครั้งที่เปลี่ยนรายการพัสดุหรือปีที่ดู
// ==========================================
onMounted(async () => {
  await loadItems()
  await loadTransactions()
})

watch([selectedSkuId, selectedYear], () => {
  loadTransactions()
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
            <h1 class="text-xl sm:text-2xl font-bold text-white">ประวัติการเคลื่อนไหวพัสดุ</h1>
            <p class="text-emerald-100/80 text-xs sm:text-sm mt-1">บัญชีคุมพัสดุสิ้นเปลือง แสดงประวัติรับ-จ่าย และสรุปความต้องการเบิกใช้รายเดือน</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <router-link :to="selectedSkuId ? `/print-item-movement?itemId=${selectedSkuId}` : '/print-item-movement'" target="_blank" class="flex items-center gap-2 px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl font-bold transition-colors shadow-sm">
            <Printer class="w-5 h-5" />
            พิมพ์ประวัติการเคลื่อนไหว
          </router-link>
        </div>
      </div>
    </div>

    <!-- กำลังโหลดรายการพัสดุ -->
    <div v-if="isLoadingItems" class="w-full flex flex-col items-center justify-center py-24 text-slate-400">
      <Loader2 class="w-8 h-8 animate-spin mb-3 text-emerald-700" />
      <p class="text-sm">กำลังโหลดรายการพัสดุ...</p>
    </div>

    <!-- โหลดรายการพัสดุไม่สำเร็จ -->
    <div v-else-if="itemsLoadError" class="w-full flex flex-col items-center justify-center py-24 text-center">
      <div class="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
        <AlertTriangle class="w-7 h-7" />
      </div>
      <p class="text-slate-700 font-semibold">{{ itemsLoadError }}</p>
      <button
        @click="loadItems"
        class="mt-4 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>

    <!-- ยังไม่มีรายการพัสดุในระบบ -->
    <div v-else-if="inventoryItems.length === 0" class="w-full flex flex-col items-center justify-center py-24 text-center text-slate-400">
      <ShieldAlert class="w-10 h-10 mb-3 opacity-50" />
      <p class="text-sm">ยังไม่มีรายการพัสดุในระบบให้ดูประวัติ</p>
    </div>

    <!-- MAIN CONTENT FOR ADMIN & STAFF -->
    <div v-else class="space-y-6">

      <!-- Item Selection & Summary Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div class="flex-1">
            <label class="block text-xs font-bold text-slate-400 mb-1">เลือกรายการพัสดุเพื่อดูบัญชีคุม:</label>
            <button type="button" @click="isItemSelectorOpen = true"
              class="w-full flex items-center justify-between text-left bg-slate-50 border-2 border-slate-200 rounded-xl p-3 hover:border-emerald-600 focus:outline-none transition-all cursor-pointer">
              <div v-if="selectedItem" class="text-slate-900 font-bold truncate">
                [{{ selectedItem.code }}] {{ selectedItem.name }} <span class="text-slate-500 font-medium text-sm ml-1">(หมวด: {{ selectedItem.category }})</span>
              </div>
              <div v-else class="text-slate-400 font-medium">-- คลิกเพื่อค้นหาและเลือกรายการพัสดุ --</div>
              <span class="ml-3 shrink-0 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">เปลี่ยน</span>
            </button>
          </div>
        </div>

        <!-- Stock Indicator Stats -->
        <div v-if="selectedItem" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">รหัสพัสดุ</span>
            <span class="font-mono font-bold text-slate-900 text-base">{{ selectedItem.code }}</span>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">หน่วยนับ</span>
            <span class="font-bold text-slate-900 text-base">{{ selectedItem.unit }}</span>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <span class="text-xs text-slate-400 font-bold block">จุดสั่งซื้อเพิ่ม (Min Stock)</span>
            <span class="font-bold text-slate-900 text-base">{{ selectedItem.minStock }} {{ selectedItem.unit }}</span>
          </div>
          <div class="p-4 rounded-xl border" :class="currentStockBalance <= selectedItem.minStock ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50/60 border-emerald-100 text-emerald-800'">
            <span class="text-xs font-bold block opacity-80">ยอดคงคลังปัจจุบัน (Balance)</span>
            <span class="font-extrabold text-xl flex items-center gap-2">
              {{ currentStockBalance }} {{ selectedItem.unit }}
              <AlertTriangle v-if="currentStockBalance <= selectedItem.minStock" class="w-5 h-5 text-rose-600 shrink-0" />
            </span>
          </div>
        </div>

      </div>

      <!-- MONTHLY USAGE SUMMARY TABLE (ม.ค. - ธ.ค.) -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar class="w-4.5 h-4.5 text-emerald-800" />
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
                <td class="border border-slate-200 p-3 bg-emerald-50 font-extrabold text-emerald-900 text-sm">
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
          <div class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ArrowUpDown class="w-4.5 h-4.5 text-emerald-800" />
            รายงานการรับ - จ่ายพัสดุ (เรียงตาม วัน เดือน ปี)
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative w-28">
              <input
                v-model="selectedYear"
                type="number"
                placeholder="ปี ค.ศ."
                class="pl-3 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
              />
            </div>
            <div class="relative flex-1 sm:w-80">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="ค้นหาเลขที่เอกสาร, หมายเหตุ..."
                class="pl-10 pr-4 py-2 w-full bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium" 
              />
            </div>
          </div>
        </div>

        <!-- กำลังโหลดประวัติการเคลื่อนไหว -->
        <div v-if="isLoadingTransactions" class="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 class="w-6 h-6 animate-spin mb-2 text-emerald-700" />
          <p class="text-sm">กำลังโหลดประวัติการเคลื่อนไหว...</p>
        </div>

        <!-- โหลดประวัติไม่สำเร็จ -->
        <div v-else-if="transactionsLoadError" class="py-16 flex flex-col items-center justify-center text-center">
          <AlertTriangle class="w-8 h-8 text-red-400 mb-2" />
          <p class="text-sm text-slate-600 font-medium mb-3">{{ transactionsLoadError }}</p>
          <button @click="loadTransactions" class="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition">
            ลองใหม่อีกครั้ง
          </button>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
            <thead class="bg-gradient-to-b from-slate-50 to-slate-100/70 text-slate-600 font-bold sticky top-0 z-10">
              <tr>
                <th class="px-6 py-3.5 text-center border-b-2 border-slate-200 text-xs uppercase tracking-wide">วัน เดือน ปี</th>
                <th class="px-6 py-3.5 border-b-2 border-slate-200 text-xs uppercase tracking-wide">เลขที่เอกสารอ้างอิง</th>
                <th class="px-6 py-3.5 border-b-2 border-slate-200 text-xs uppercase tracking-wide">รายการ / ผู้ขอเบิก / หมายเหตุ</th>
                <th class="px-6 py-3.5 text-center border-b-2 border-slate-200 text-xs uppercase tracking-wide text-emerald-800 bg-emerald-50/40">รับเข้า (+)</th>
                <th class="px-6 py-3.5 text-center border-b-2 border-slate-200 text-xs uppercase tracking-wide text-rose-700 bg-rose-50/40">จ่ายออก (-)</th>
                <th class="px-6 py-3.5 text-center border-b-2 border-slate-200 text-xs uppercase tracking-wide bg-slate-100 font-extrabold text-slate-900">คงเหลือ (Balance)</th>
                <th class="px-6 py-3.5 text-center border-b-2 border-slate-200 text-xs uppercase tracking-wide">ผู้บันทึกรายการ</th>
              </tr>
            </thead>
            <tbody class="font-medium">
              <tr
                v-for="t in calculatedTransactions"
                :key="t.id"
                class="group relative bg-white odd:bg-slate-50/40 border-b border-slate-100 transition-all duration-200 ease-out hover:bg-white hover:shadow-[0_10px_28px_-10px_rgba(6,95,70,0.35)] hover:-translate-y-0.5 hover:relative hover:z-20"
              >
                
                <!-- วัน เดือน ปี -->
                <td class="px-6 py-4 text-center font-bold text-slate-700 border-l-4 border-transparent group-hover:border-emerald-500 transition-colors">
                  <div class="flex items-center justify-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span>{{ formatThaiDate(t.date) }}</span>
                  </div>
                </td>

                <!-- เลขที่เอกสารอ้างอิง -->
                <td class="px-6 py-4 font-mono font-extrabold text-slate-900">
                  {{ t.docNo }}
                </td>

                <!-- รายการ / หมายเหตุ -->
                <td class="px-6 py-4 max-w-xs truncate">
                  <span class="text-slate-800 font-semibold">{{ t.note }}</span>
                </td>

                <!-- รับเข้า -->
                <td class="px-6 py-4 text-center font-bold text-emerald-800 bg-emerald-50/20 group-hover:bg-emerald-50/50 transition-colors">
                  <span v-if="t.inQty > 0" class="inline-flex items-center gap-1">
                    <TrendingUp class="w-4 h-4 text-emerald-600" />
                    +{{ t.inQty }}
                  </span>
                  <span v-else class="text-slate-300 inline-flex items-center justify-center">
                    <Minus class="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </td>

                <!-- จ่ายออก -->
                <td class="px-6 py-4 text-center font-bold text-rose-700 bg-rose-50/20 group-hover:bg-rose-50/50 transition-colors">
                  <span v-if="t.outQty > 0" class="inline-flex items-center gap-1">
                    <TrendingDown class="w-4 h-4 text-rose-500" />
                    -{{ t.outQty }}
                  </span>
                  <span v-else class="text-slate-300 inline-flex items-center justify-center">
                    <Minus class="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </td>

                <!-- ยอดคงเหลือสะสม (Balance Qty) -->
                <td class="px-6 py-4 text-center font-mono font-extrabold text-slate-900 text-sm bg-slate-50 group-hover:bg-slate-100 transition-colors">
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

    <!-- Modal: เลือกพัสดุ -->
    <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isItemSelectorOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" @click.self="isItemSelectorOpen = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center">
                <PackageSearch class="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-slate-900">เลือกรายการพัสดุ</h3>
                <p class="text-sm text-slate-500 font-medium">ค้นหาและเลือกพัสดุที่ต้องการดูบัญชีคุม</p>
              </div>
            </div>
            <button type="button" @click="isItemSelectorOpen = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Search & Filter -->
          <div class="p-4 border-b border-slate-100 shrink-0 bg-white">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search class="w-5 h-5 text-slate-400" />
              </div>
              <input type="text" v-model="searchItemQuery" placeholder="ค้นหาด้วยรหัส, ชื่อพัสดุ หรือหมวดหมู่..."
                class="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-400" />
            </div>
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1 bg-slate-50/50 p-2">
            <div class="grid grid-cols-1 gap-2">
              <div v-if="filteredItemsForSelector.length === 0" class="p-8 text-center text-slate-400">
                <PackageOpen class="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p class="font-medium">ไม่พบรายการพัสดุที่ค้นหา</p>
              </div>
              
              <button v-for="item in filteredItemsForSelector" :key="item.id" @click="selectItem(item)" type="button"
                class="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all text-left group">
                <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                  <PackageOpen class="w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <p class="font-extrabold text-slate-900 text-base truncate group-hover:text-emerald-700 transition-colors">{{ item.name }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> รหัส: {{ item.code }}</span>
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> หมวดหมู่: {{ item.category }}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>