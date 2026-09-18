<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAssets } from '../services/inventoryApi.js'
import api from '../services/api.js'
import { Loader2, Printer } from 'lucide-vue-next'

const assets = ref([])
const isLoading = ref(false)
const error = ref('')

const route = useRoute()
const disposalCode = ref(route.query.code || null)
const requestStatus = ref('')

const selectedYear = ref(new Date().getFullYear())
const selectedStatusType = ref(disposalCode.value ? 'all' : 'pending') // 'pending' = Broken/Repairing, 'approved' = Scrapped

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
    const assetsData = await getAssets()
    
    if (disposalCode.value) {
      // ดึงข้อมูลคำขอจำหน่ายตามรหัสที่ระบุ
      const { data } = await api.get(`/disposal-requests?search=${disposalCode.value}`)
      const targetAssetIds = data.data.filter(r => r.disposalCode === disposalCode.value).map(r => r.assetId)
      
      // กรองเฉพาะครุภัณฑ์ที่อยู่ในคำขอนี้
      assets.value = assetsData.filter(a => targetAssetIds.includes(a.id))
      
      // ตั้งค่าปีงบประมาณตามคำขอแรก (ถ้ามี)
      if (data.data.length > 0) {
        const reqData = data.data.find(r => r.disposalCode === disposalCode.value) || data.data[0]
        requestStatus.value = reqData.status
        
        const reqDate = new Date(reqData.createdAt)
        const fiscalYear = reqDate.getMonth() >= 9 ? reqDate.getFullYear() + 1 : reqDate.getFullYear()
        selectedYear.value = fiscalYear
      }
    } else {
      // เก็บรายการทั้งหมดเพื่อนำไปใช้นับ 'เต็มตามบัญชี'
      assets.value = assetsData
    }
  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลครุภัณฑ์ได้'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredAssets = computed(() => {
  const groups = {}
  assets.value.forEach(asset => {
    // แยก base sequence หากมีรูปแบบ -001, -002 ต่อท้าย
    const match = asset.seq ? asset.seq.match(/^(.*)-(\d{1,4})$/) : null
    const baseSeq = match ? match[1] : (asset.seq || asset.id)
    const suffix = match ? match[2] : null
    const itemPrice = parseFloat(asset.unitPrice) || parseFloat(asset.price) || 0
    
    let isTargetStatus = false
    if (disposalCode.value) {
      isTargetStatus = true // ถ้ามารหัสคำขอ เอาทุกรายการในคำขอนั้นเลย
    } else if (selectedStatusType.value === 'pending') {
      isTargetStatus = asset.status === 'Broken' || asset.status === 'Repaired' || asset.status === 'Repairing'
    } else if (selectedStatusType.value === 'approved') {
      isTargetStatus = asset.status === 'Scrapped' || asset.status === 'DISPOSED'
    }

    if (!groups[baseSeq]) {
      groups[baseSeq] = {
        ...asset,
        baseSeq: baseSeq,
        brokenSuffixes: (suffix && isTargetStatus) ? [suffix] : [],
        totalQuantity: 1, // เต็มตามบัญชี
        brokenQuantity: isTargetStatus ? 1 : 0, // ตามสถานะที่เลือก
        unitPrice: itemPrice,
        totalPrice: isTargetStatus ? itemPrice : 0 // คิดเฉพาะที่ตรงตามสถานะ
      }
    } else {
      if (suffix && isTargetStatus) groups[baseSeq].brokenSuffixes.push(suffix)
      groups[baseSeq].totalQuantity += 1
      if (isTargetStatus) {
        groups[baseSeq].brokenQuantity += 1
        groups[baseSeq].totalPrice += itemPrice
      }
    }
  })

  // กรองเอาเฉพาะกลุ่มที่มีของชำรุด
  const brokenGroups = Object.values(groups).filter(g => g.brokenQuantity > 0)

  // จัดรูปแบบเลขครุภัณฑ์ (displaySeq) เฉพาะของที่ชำรุด โดยจัดกลุ่มเลขที่ต่อเนื่องกัน
  return brokenGroups.map(group => {
    if (group.brokenSuffixes.length > 0) {
      // เรียงลำดับจากน้อยไปมาก
      const sorted = [...group.brokenSuffixes].sort((a, b) => parseInt(a) - parseInt(b))
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

const paginatedAssets = computed(() => {
  const items = filteredAssets.value
  const chunks = []
  for (let i = 0; i < items.length; i += 10) {
    chunks.push(items.slice(i, i + 10))
  }
  if (chunks.length === 0) chunks.push([])
  return chunks
})

const formatThaiDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
}

const formatNumber = (num) => {
  if (!num) return '0.00'
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatAcquisitionMethod = (method) => {
  const m = method || 'งบประมาณ'
  if (m.includes('งบประมาณ')) return 'งปม'
  if (m.includes('บำรุงการศึกษา')) return 'บกศ'
  if (m.includes('รับบริจาค / รับมอบ')) return 'บริจาค'
  return m
}

const calculateUsageDuration = (dateString) => {
  if (!dateString) return '-'
  const acquiredDate = new Date(dateString)
  const currentDate = new Date()
  let years = currentDate.getFullYear() - acquiredDate.getFullYear()
  let months = currentDate.getMonth() - acquiredDate.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  if (years === 0 && months === 0) return 'ไม่ถึง 1 เดือน'
  let result = ''
  if (years > 0) result += `${years} ปี `
  if (months > 0) result += `${months} เดือน`
  return result.trim()
}

const totalPrice = computed(() => {
  return filteredAssets.value.reduce((sum, asset) => sum + (Number(asset.totalPrice) || 0), 0)
})

const convertToThaiBaht = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  let number = Math.round(amount * 100) / 100;
  if (number === 0) return 'ศูนย์บาทถ้วน';

  let numberStr = number.toFixed(2).toString();
  let parts = numberStr.split('.');
  let baht = parts[0];
  let satang = parts[1];

  const textNum = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const textRank = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertText(str) {
    if (str === '0' || str === '00') return '';
    let result = '';
    let len = str.length;
    for (let i = 0; i < len; i++) {
      let n = parseInt(str[i]);
      if (n !== 0) {
        if (i === len - 1 && n === 1 && len > 1 && str[len - 2] !== '0') {
          result += 'เอ็ด';
        } else if (i === len - 2 && n === 2) {
          result += 'ยี่สิบ';
        } else if (i === len - 2 && n === 1) {
          result += 'สิบ';
        } else {
          result += textNum[n] + textRank[len - i - 1];
        }
      }
    }
    return result;
  }

  let bahtText = '';
  if (baht.length > 7) {
    let millionPart = baht.substring(0, baht.length - 6);
    let restPart = baht.substring(baht.length - 6);
    bahtText = convertText(millionPart) + 'ล้าน' + convertText(restPart);
  } else {
    bahtText = convertText(baht);
  }

  let satangText = convertText(satang);

  if (bahtText) bahtText += 'บาท';
  if (satangText) {
    satangText += 'สตางค์';
  } else {
    bahtText += 'ถ้วน';
  }

  return bahtText + satangText;
}

const printDocument = () => {
  window.print()
}

</script>

<template>
  <div class="print-container font-sarabun text-black bg-white min-h-screen">

    <!-- Non-print utility bar -->
    <div class="p-4 bg-slate-100 print:hidden flex flex-col sm:flex-row gap-4 border-b justify-between items-center">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="font-bold text-slate-700">ประจำปีงบประมาณ พ.ศ.:</label>
          <select v-model="selectedYear" class="px-3 py-2 rounded-lg border border-gray-300 outline-none focus:border-emerald-500">
            <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
          </select>
        </div>
        <div v-if="!disposalCode" class="flex items-center gap-2">
          <label class="font-bold text-slate-700">สถานะครุภัณฑ์:</label>
          <select v-model="selectedStatusType" class="px-3 py-2 rounded-lg border border-gray-300 outline-none focus:border-emerald-500">
            <option value="pending">รอขออนุมัติ (ชำรุด/ส่งซ่อม)</option>
            <option value="approved">อนุมัติแล้ว (แทงจำหน่าย)</option>
          </select>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
            พิมพ์เอกสารคำขอ: {{ disposalCode }}
          </span>
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button @click="printDocument"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow inline-flex items-center gap-2">
          <Printer class="w-5 h-5" />
          พิมพ์แบบฟอร์มแทงจำหน่าย
        </button>
        <button @click="$router.back()"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg shadow">
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
    <div v-for="(page, pageIndex) in paginatedAssets" :key="pageIndex"
      class="a4-landscape print-page bg-white shadow-xl print:shadow-none px-10 py-6 mx-auto relative print:mb-0 mb-8 overflow-hidden">
      
      <!-- Reject Stamp -->
      <div v-if="requestStatus === 'REJECTED'" class="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <div class="border-8 border-rose-500 text-rose-500 rounded-3xl px-16 py-8 text-8xl font-black transform -rotate-12 tracking-widest opacity-30 shadow-sm bg-white/10 backdrop-blur-[1px]">
          ไม่อนุมัติ
        </div>
      </div>

      <div class="text-center mb-4 relative z-10">
        <h1 class="font-bold text-[18px] mb-4">วิทยาลัยเทคนิคเลย</h1>
        <div class="flex justify-between items-end text-[14px]">
          <div class="flex gap-2 w-full justify-center">
            <span>บัญชีรายการ</span>
            <span class="border-b border-dotted border-black px-12 min-w-[200px]">ครุภัณฑ์ต่ำกว่าเกณฑ์</span>
            <span>ชำรุดเสื่อมสภาพ ไม่ใช้ราชการ ของสถานศึกษา</span>
          </div>
        </div>
        <div class="flex justify-between items-end mt-2 text-[14px]">
          <div class="flex gap-2 w-full justify-center">
            <span>ของแผนก/งาน</span>
            <span class="border-b border-dotted border-black px-12 min-w-[300px]">แผนกวิชาเทคโนโลยีสารสนเทศ</span>
            <span>ประจำปี {{ selectedYear + 543 }}</span>
            <span class="ml-4">สิ้นงวดเมื่อวันที่ 30 กันยายน {{ selectedYear + 543 }}</span>
          </div>
        </div>
      </div>

      <table class="w-full border-collapse border border-black text-[10px] mb-4">
        <thead>
          <tr>
            <th rowspan="2" class="border border-black p-1 w-10 text-center font-bold font-sarabun align-middle">
              ลำดับ<br>ที่</th>
            <th rowspan="2" class="border border-black p-1 w-20 text-center font-bold font-sarabun align-middle">
              วัน/เดือน/ปี<br>ที่ได้มา</th>
            <th rowspan="2" class="border border-black p-1 w-28 text-center font-bold font-sarabun align-middle">
              หมายเลขประจำ<br>วัสดุ/ครุภัณฑ์</th>
            <th rowspan="2" class="border border-black p-1 text-center font-bold font-sarabun align-middle">รายการ ขนาด
              ลักษณะ</th>
            <th rowspan="2" class="border border-black p-1 w-20 text-center font-bold font-sarabun align-middle">
              ได้มาโดย<br>วิธีใด</th>
            <th rowspan="2" class="border border-black p-1 w-20 text-center font-bold font-sarabun align-middle">
              ระยะเวลา<br>ใช้งาน</th>
            <th rowspan="2" class="border border-black p-1 w-16 text-center font-bold font-sarabun align-middle">
              เคยซ่อม<br>กี่ครั้ง</th>
            <th colspan="2" class="border border-black p-1 text-center font-bold font-sarabun align-middle">จำนวน</th>
            <th rowspan="2" class="border border-black p-1 w-24 text-center font-bold font-sarabun align-middle">
              หน่วยละ<br>(บาท)</th>
            <th rowspan="2" class="border border-black p-1 w-24 text-center font-bold font-sarabun align-middle">
              เป็นเงิน<br>(บาท)</th>
            <th rowspan="2" class="border border-black p-1 w-32 text-center font-bold font-sarabun align-middle">
              คำชี้แจงประกอบ<br>ของชำรุด</th>
          </tr>
          <tr>
            <th class="border border-black p-1 w-16 text-center font-bold font-sarabun">เต็มตาม<br>บัญชี</th>
            <th class="border border-black p-1 w-16 text-center font-bold font-sarabun">ชำรุด</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(asset, index) in page" :key="asset.id || index" class="h-7">
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{ (pageIndex * 10) + index + 1 }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{ formatThaiDateShort(asset.createdAt)
              }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{ asset.displaySeq || '-' }}
            </td>
            <td class="border border-black px-1 py-0.5 font-sarabun pl-2">{{ asset.name }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{
              formatAcquisitionMethod(asset.acquisitionMethod) }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{
              calculateUsageDuration(asset.createdAt) }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">-</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{ asset.totalQuantity }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun">{{ asset.brokenQuantity }}</td>
            <td class="border border-black px-1 py-0.5 text-right font-sarabun pr-2">{{ formatNumber(asset.unitPrice) }}
            </td>
            <td class="border border-black px-1 py-0.5 text-right font-sarabun pr-2">{{ formatNumber(asset.totalPrice)
              }}</td>
            <td class="border border-black px-1 py-0.5 text-center font-sarabun leading-tight">{{ asset.remark
            }}</td>
          </tr>

          <!-- Fill empty rows up to 10 rows minimum to look like a full page -->
          <tr v-for="n in Math.max(0, 10 - page.length)" :key="'empty-' + n" class="h-7">
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
            <td class="border border-black px-1 py-0.5"></td>
          </tr>

          <!-- Total Row -->
          <tr v-if="pageIndex === paginatedAssets.length - 1" class="h-8 bg-gray-50/50">
            <td colspan="10" class="border border-black px-1 py-0.5 text-center font-bold font-sarabun">
              ( <span class="mx-4 text-black">{{ convertToThaiBaht(totalPrice) }}</span> )<span
                class="ml-4">รวมเป็นเงิน</span>
            </td>
            <td class="border border-black px-1 py-0.5 text-right font-bold font-sarabun pr-2">{{
              formatNumber(totalPrice) }}</td>
            <td class="border border-black px-1 py-0.5"></td>
          </tr>
        </tbody>
      </table>

      <!-- Footer section -->
      <div class="flex mt-2 text-[11px]">
        <div class="flex-1">
          <div class="flex gap-2">
            <span class="font-bold">หมายเหตุ</span>
            <ol class="list-decimal pl-4 m-0">
              <li>ให้แยกบัญชี เช่น บัญชีรายการวัสดุถาวรชำรุดฯ หรือบัญชีรายการครุภัณฑ์ชำรุด เป็นต้น</li>
              <li>ในช่อง "เป็นเงิน" ให้ลงจำนวนรวมตามจำนวนของที่ชำรุดเท่านั้น</li>
            </ol>
          </div>
        </div>

        <div class="w-[300px] text-center pt-2">
          <div class="mb-2">
            ลงชื่อ ..................................................... หัวหน้าแผนก
          </div>
          <div class="mb-1">
            (นายพิชญะ พรมลา)
          </div>
          <div>
            หัวหน้าแผนกเทคโนโลยีสารสนเทศ
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
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
    margin: 0mm;
    /* Hide browser headers/footers */
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

  .print-page {
    page-break-after: always;
  }

  .print-page:last-child {
    page-break-after: auto;
  }

  .a4-landscape {
    width: 100%;
    min-height: auto;
    padding: 8mm 10mm;
    /* Reduce top/bottom padding */
    margin: 0;
    box-shadow: none;
  }
}
</style>
