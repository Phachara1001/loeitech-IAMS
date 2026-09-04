<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE } from '../config/api'
import { Loader2, Printer } from 'lucide-vue-next'
import { getAssets, getAssetDistributions, getRepairs, getBorrows } from '../services/inventoryApi.js'

const logs = ref([])
const assets = ref([])
const isLoading = ref(false)
const error = ref('')

const reportPeriod = ref('month') // 'month' or 'year'
const reportScope = ref('all') // 'all' or 'specific'

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const selectedAssetId = ref('')

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
    const [assetsData, distsData, repairsData, borrowsData] = await Promise.all([
      getAssets(),
      getAssetDistributions(),
      getRepairs(),
      getBorrows()
    ])

    assets.value = assetsData
    const combinedLogs = []

    // 1. Receives (from assets)
    assetsData.forEach(a => {
      combinedLogs.push({
        id: `rec-${a.id}`,
        entityId: String(a.id),
        action: 'RECEIVE',
        createdAt: a.createdAt,
        details: `เพิ่มครุภัณฑ์ "${a.name}" (${a.seq})`,
        userName: 'งานพัสดุกลาง'
      })
    })

    // 2. Distributions (Moves)
    distsData.forEach(d => {
      combinedLogs.push({
        id: `dist-${d.id}`,
        entityId: String(d.assetId),
        action: 'MOVE',
        createdAt: d.createdAt,
        details: `โอนย้าย/จัดสรรไปที่: ${d.department} (${d.building || ''} ${d.room || ''})`,
        userName: d.responsiblePerson?.name || 'ผู้ดูแลระบบ'
      })
    })

    // 3. Repairs
    repairsData.forEach(r => {
      combinedLogs.push({
        id: `rep-${r.id}`,
        entityId: String(r.assetId),
        action: 'REPAIR',
        createdAt: r.createdAt,
        details: `แจ้งซ่อม (${r.repairCode}): ${r.description}`,
        userName: r.reporterName
      })
      if (r.status === 'COMPLETED' && r.finishDate) {
        combinedLogs.push({
          id: `rep-done-${r.id}`,
          entityId: String(r.assetId),
          action: 'REPAIR_DONE',
          createdAt: r.finishDate,
          details: `ซ่อมสำเร็จ (${r.repairCode}) ค่าใช้จ่าย: ${r.repairCost} บาท`,
          userName: r.approvedBy || 'ช่างซ่อมบำรุง'
        })
      }
    })

    // 4. Borrows
    borrowsData.forEach(b => {
      combinedLogs.push({
        id: `borrow-${b.id}`,
        entityId: String(b.assetId),
        action: 'BORROW',
        createdAt: b.createdAt,
        details: `ขอยืมใช้งาน (${b.borrowCode}): ${b.purpose}`,
        userName: b.borrowerName
      })
      if (b.returnDate) {
         combinedLogs.push({
          id: `return-${b.id}`,
          entityId: String(b.assetId),
          action: 'RETURN',
          createdAt: b.returnDate,
          details: `รับคืนครุภัณฑ์ (${b.borrowCode})`,
          userName: b.returnedTo || 'เจ้าหน้าที่พัสดุ'
        })
      }
    })
    
    logs.value = combinedLogs

  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง (Admin)'
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
    const matchAsset = reportScope.value === 'specific' ? String(log.entityId) === String(selectedAssetId.value) : true
    
    return matchYear && matchMonth && matchAsset
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

const getAssetSeq = (entityId) => {
  if (!entityId) return '-'
  const asset = assets.value.find(a => String(a.id) === String(entityId))
  return asset ? asset.seq : `ID: ${entityId}`
}

const getAssetFullName = (entityId) => {
  if (!entityId) return '-'
  const asset = assets.value.find(a => String(a.id) === String(entityId))
  return asset ? asset.name : '-'
}

const getAssetName = (entityId) => {
  if (!entityId) return '-'
  const asset = assets.value.find(a => String(a.id) === String(entityId))
  return asset ? `${asset.seq} - ${asset.name}` : `ID: ${entityId}`
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

const getActionText = (action) => {
  switch(action) {
    case 'RECEIVE': return 'ขึ้นทะเบียนใหม่'
    case 'MOVE': return 'จัดสรร/โอนย้าย'
    case 'REPAIR': return 'ส่งซ่อมบำรุง'
    case 'REPAIR_DONE': return 'ซ่อมเสร็จสิ้น'
    case 'BORROW': return 'ขอยืมใช้งาน'
    case 'RETURN': return 'รับคืนครุภัณฑ์'
    default: return action
  }
}

const printDocument = () => {
  window.print()
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
          <option value="all">ครุภัณฑ์ทั้งหมด</option>
          <option value="specific">เฉพาะรายชิ้น</option>
        </select>

        <select v-if="reportScope === 'specific'" v-model="selectedAssetId" class="px-3 py-2 rounded-lg border border-gray-300 max-w-xs">
          <option value="" disabled>-- เลือกครุภัณฑ์ --</option>
          <option v-for="a in assets" :key="a.id" :value="a.id">{{ a.seq }} - {{ a.name }}</option>
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
        <h1 class="font-bold text-2xl mb-2">รายงานประวัติการเคลื่อนไหวครุภัณฑ์</h1>
        <h2 class="font-bold text-xl">
          {{ reportPeriod === 'month' ? 'ประจำเดือน ' + months.find(m => m.value === selectedMonth)?.label : 'ประจำปี' }}
          {{ reportPeriod === 'month' ? ' ปี พ.ศ. ' + (selectedYear + 543) : ' พ.ศ. ' + (selectedYear + 543) }}
        </h2>
        <h3 v-if="reportScope === 'specific' && selectedAssetId" class="font-bold text-lg mt-2 text-emerald-800">
          (เฉพาะครุภัณฑ์: {{ getAssetName(selectedAssetId) }})
        </h3>
        <p class="text-gray-600 mt-2">วิทยาลัยเทคนิคเลย</p>
      </div>

      <table class="w-full border-collapse border border-black text-sm mb-8 table-fixed">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-black p-2 w-12 text-center font-bold">ลำดับ</th>
            <th class="border border-black p-2 w-28 text-center font-bold">วันที่-เวลา</th>
            <th class="border border-black p-2 w-28 text-center font-bold">เลขครุภัณฑ์</th>
            <th class="border border-black p-2 w-48 text-center font-bold">ชื่อครุภัณฑ์</th>
            <th class="border border-black p-2 w-24 text-center font-bold">ประเภทรายการ</th>
            <th class="border border-black p-2 text-center font-bold">รายละเอียดการเคลื่อนไหว</th>
            <th class="border border-black p-2 w-28 text-center font-bold">ผู้บันทึก</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(log, index) in filteredLogs" :key="log.id" class="h-10">
            <td class="border border-black p-2 text-center">{{ index + 1 }}</td>
            <td class="border border-black p-2 text-center">{{ formatThaiDate(log.createdAt) }}</td>
            <td class="border border-black p-2 text-center font-mono text-xs">
               {{ getAssetSeq(log.entityId) }}
            </td>
            <td class="border border-black p-2 font-medium">
               {{ getAssetFullName(log.entityId) }}
            </td>
            <td class="border border-black p-2 text-center">{{ getActionText(log.action) }}</td>
            <td class="border border-black p-2 text-xs">{{ log.details || '-' }}</td>
            <td class="border border-black p-2 text-center">{{ log.userName || '-' }}</td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="7" class="border border-black p-8 text-center text-gray-500">
              ไม่มีประวัติการเคลื่อนไหวในช่วงเวลาที่เลือก
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Footer section (ผู้ออกเอกสาร) -->
      <div class="mt-12 flex justify-end">
        <div class="text-center w-64">
          <div class="mb-2">ผู้ออกเอกสาร</div>
          <div class="mb-2">{{ issuerName }}</div>
          <div>วันที่ {{ formatThaiDate(new Date()) }}</div>
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
