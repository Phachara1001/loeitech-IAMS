<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2, Printer } from 'lucide-vue-next'
import { getItems, getAllItemTransactions } from '../services/inventoryApi.js'

const logs = ref([])
const items = ref([])
const isLoading = ref(false)
const error = ref('')

const route = useRoute()

const reportPeriod = ref('month') // 'month' or 'year'
const reportScope = ref(route.query.itemId ? 'specific' : 'all') // 'all' or 'specific'

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const selectedItemId = ref(route.query.itemId ? String(route.query.itemId) : '')

const userObj = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
const issuerName = ref(userObj.name || 'เจ้าหน้าที่พัสดุ')

const months = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' }
]

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const arr = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    arr.push({ value: i, label: i + 543 })
  }
  return arr.reverse()
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const [itemsData, txData] = await Promise.all([
      getItems(),
      getAllItemTransactions()
    ])

    items.value = itemsData
    
    // Map transactions
    logs.value = txData.map(tx => {
      // tx has item { sku, name, unit } (from include in backend)
      return {
        id: tx.id,
        itemId: String(tx.itemId),
        sku: tx.item?.sku || '-',
        name: tx.item?.name || '-',
        type: tx.transactionType, // IN, OUT, ADJUSTMENT
        qty: tx.quantity,
        unit: tx.item?.unit || '-',
        operator: tx.operatorName || 'ระบบ',
        remark: tx.remarks || '-',
        createdAt: tx.createdAt
      }
    })

  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const date = new Date(log.createdAt)
    const matchYear = date.getFullYear() === selectedYear.value
    const matchMonth = reportPeriod.value === 'month' ? (date.getMonth() + 1) === selectedMonth.value : true
    const matchItem = reportScope.value === 'specific' ? log.itemId === String(selectedItemId.value) : true
    
    return matchYear && matchMonth && matchItem
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

const getItemNameDisplay = (itemId) => {
  if (!itemId) return '-'
  const item = items.value.find(i => String(i.id) === String(itemId))
  return item ? `${item.sku} - ${item.name}` : `ID: ${itemId}`
}

const formatThaiDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTxText = (type) => {
  switch(type) {
    case 'IN': return 'รับเข้า'
    case 'OUT': return 'จ่ายออก'
    case 'ADJUSTMENT': return 'ปรับปรุงยอด'
    default: return type
  }
}

const getTxStyle = (type) => {
  switch(type) {
    case 'IN': return 'text-emerald-700'
    case 'OUT': return 'text-rose-700'
    case 'ADJUSTMENT': return 'text-blue-700'
    default: return 'text-black'
  }
}

const printDocument = () => {
  window.print()
}

const toThaiNumerals = (num) => {
  if (num == null) return ''
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  return String(num).replace(/\d/g, (d) => thaiNums[d])
}

</script>

<template>
  <div class="print-container font-sarabun text-black bg-white min-h-screen">
    
    <!-- Non-print utility bar -->
    <div class="p-4 bg-slate-100 print:hidden flex flex-col gap-4 border-b">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Period -->
        <label class="font-bold text-slate-700">รูปแบบ:</label>
        <select v-model="reportPeriod" class="px-3 py-2 rounded-lg border border-gray-300">
          <option value="month">ประจำเดือน</option>
          <option value="year">ประจำปี</option>
        </select>

        <label v-if="reportPeriod === 'month'" class="font-bold text-slate-700">เดือน:</label>
        <select v-if="reportPeriod === 'month'" v-model="selectedMonth" class="px-3 py-2 rounded-lg border border-gray-300">
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>

        <label class="font-bold text-slate-700">ปี พ.ศ.:</label>
        <select v-model="selectedYear" class="px-3 py-2 rounded-lg border border-gray-300">
          <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
        </select>
        
        <div class="w-px h-6 bg-gray-300 mx-2"></div>

        <!-- Scope -->
        <label class="font-bold text-slate-700">ขอบเขต:</label>
        <select v-model="reportScope" class="px-3 py-2 rounded-lg border border-gray-300">
          <option value="all">พัสดุทั้งหมด</option>
          <option value="specific">เฉพาะรายชิ้น</option>
        </select>

        <select v-if="reportScope === 'specific'" v-model="selectedItemId" class="px-3 py-2 rounded-lg border border-gray-300 max-w-xs">
          <option value="" disabled>-- เลือกพัสดุ --</option>
          <option v-for="i in items" :key="i.id" :value="i.id">{{ i.sku }} - {{ i.name }}</option>
        </select>
      </div>
      
      <div class="flex gap-2 justify-end">
        <button @click="printDocument" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow inline-flex items-center gap-2">
          <Printer class="w-5 h-5" />
          พิมพ์เอกสารแนวนอน
        </button>
        <button @click="$router.back()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg shadow">
          กลับ
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center p-20 print:hidden">
      <Loader2 class="w-8 h-8 animate-spin text-emerald-600" />
      <p class="mt-2 text-gray-500">กำลังดึงข้อมูล...</p>
    </div>

    <div v-else-if="error" class="flex items-center justify-center p-20 text-red-500 print:hidden">
      {{ error }}
    </div>

    <!-- Landscape Paper size container -->
    <div v-else class="a4-landscape bg-white shadow-xl print:shadow-none p-10 mx-auto relative">
      <div class="text-center mb-8">
        <h1 class="font-bold text-2xl mb-2">รายงานประวัติการเคลื่อนไหวพัสดุสิ้นเปลือง</h1>
        <h2 class="font-bold text-xl">
          {{ toThaiNumerals(reportPeriod === 'month' ? 'ประจำเดือน ' + months.find(m => m.value === selectedMonth)?.label : 'ประจำปี') }}
          {{ toThaiNumerals(reportPeriod === 'month' ? ' ปี พ.ศ. ' + (selectedYear + 543) : ' พ.ศ. ' + (selectedYear + 543)) }}
        </h2>
        <h3 v-if="reportScope === 'specific' && selectedItemId" class="font-bold text-lg mt-2 text-emerald-800">
          (เฉพาะพัสดุ: {{ toThaiNumerals(getItemNameDisplay(selectedItemId)) }})
        </h3>
        <p class="text-gray-600 mt-2">วิทยาลัยเทคนิคเลย</p>
      </div>

      <table class="w-full border-collapse border border-black text-sm mb-8 table-fixed">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-black p-2 w-12 text-center font-bold">ลำดับ</th>
            <th class="border border-black p-2 w-28 text-center font-bold">วันที่-เวลา</th>
            <th class="border border-black p-2 w-28 text-center font-bold">รหัสพัสดุ</th>
            <th class="border border-black p-2 w-48 text-center font-bold">ชื่อพัสดุ</th>
            <th class="border border-black p-2 w-20 text-center font-bold">ประเภท</th>
            <th class="border border-black p-2 w-24 text-center font-bold">จำนวน</th>
            <th class="border border-black p-2 text-center font-bold">รายละเอียด (หมายเหตุ)</th>
            <th class="border border-black p-2 w-24 text-center font-bold">ผู้บันทึก</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(log, index) in filteredLogs" :key="log.id" class="h-10">
            <td class="border border-black p-2 text-center">{{ toThaiNumerals(index + 1) }}</td>
            <td class="border border-black p-2 text-center">{{ toThaiNumerals(formatThaiDate(log.createdAt)) }}</td>
            <td class="border border-black p-2 text-center font-mono text-xs">
               {{ toThaiNumerals(log.sku) }}
            </td>
            <td class="border border-black p-2 font-medium">
               {{ toThaiNumerals(log.name) }}
            </td>
            <td class="border border-black p-2 text-center font-bold" :class="getTxStyle(log.type)">
               {{ toThaiNumerals(getTxText(log.type)) }}
            </td>
            <td class="border border-black p-2 text-center font-bold" :class="getTxStyle(log.type)">
               {{ toThaiNumerals((log.type === 'IN' ? '+' : (log.type === 'OUT' ? '-' : '')) + Math.abs(log.qty) + ' ' + log.unit) }}
            </td>
            <td class="border border-black p-2 text-xs">{{ toThaiNumerals(log.remark) }}</td>
            <td class="border border-black p-2 text-center">{{ toThaiNumerals(log.operator) }}</td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="8" class="border border-black p-8 text-center text-gray-500">
              ไม่มีประวัติการเคลื่อนไหวในช่วงเวลาที่เลือก
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Footer section (ผู้ออกเอกสาร) -->
      <div class="mt-12 flex justify-end">
        <div class="text-center w-64">
          <div class="mb-2">ผู้ออกเอกสาร</div>
          <div class="mb-2">{{ toThaiNumerals(issuerName) }}</div>
          <div>วันที่ {{ toThaiNumerals(formatThaiDate(new Date())) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

.font-sarabun {
  font-family: 'Sarabun', sans-serif;
}

.a4-landscape {
  width: 297mm;
  min-height: 210mm;
  background-color: white;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  body * {
    visibility: hidden;
  }

  .print-container,
  .print-container * {
    visibility: visible;
  }

  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    background: white;
  }

  .a4-landscape {
    width: 100%;
    min-height: auto;
    padding: 10mm;
    margin: 0;
    box-shadow: none;
  }
}
</style>
