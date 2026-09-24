<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  assets: {
    type: Array,
    required: true
  },
  numeralType: {
    type: String,
    default: 'thai' // 'thai' or 'arabic'
  }
})

// ข้อมูลผู้พิมพ์
const currentUser = ref(JSON.parse(localStorage.getItem('tcaims_user') || '{"name": "ผู้ดูแลระบบ", "position": "เจ้าหน้าที่พัสดุ"}'))
const printDate = ref(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))
const printTime = ref(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))

const formatThaiDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusText = (status) => {
  switch (status) {
    case 'Active': return 'ใช้งานปกติ'
    case 'Repaired': return 'ส่งซ่อม'
    case 'Broken': return 'ชำรุด'
    case 'Scrapped': return 'จำหน่าย'
    default: return status || '-'
  }
}

const toThaiNumerals = (num) => {
  if (num == null) return ''
  if (props.numeralType === 'arabic') return String(num)
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  return String(num).replace(/\d/g, (d) => thaiNums[d])
}

const formatSuffixesToRange = (suffixesArray) => {
  if (!suffixesArray || suffixesArray.length === 0) return ''
  const sorted = [...suffixesArray].sort((a, b) => parseInt(a) - parseInt(b))
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

  return ranges.map(r => {
    if (r.start === r.end) return r.start
    return `${r.start} ถึง ${r.end}`
  }).join(', ')
}

const groupedAssets = computed(() => {
  const groups = {}

  props.assets.forEach(asset => {
    const seq = asset.seq || asset.id
    const match = seq.toString().match(/^(.*)-(\d{1,4})$/)
    const baseSeq = match ? match[1] : seq
    const suffix = match ? match[2] : null

    // Group by base sequence and department only (combining all statuses)
    const key = `${baseSeq}|${asset.department}`

    if (!groups[key]) {
      groups[key] = {
        ...asset,
        baseSeq: baseSeq,
        allSuffixes: suffix ? [suffix] : [],
        brokenSuffixes: [],
        brokenComponents: [],
        count: 1,
        totalPrice: Number(asset.unitPrice) || 0
      }
    } else {
      if (suffix) groups[key].allSuffixes.push(suffix)
      groups[key].count += 1
      groups[key].totalPrice += (Number(asset.unitPrice) || 0)
    }

    if (suffix && (asset.status === 'Broken' || asset.status === 'Repaired' || asset.status === 'Repairing')) {
      groups[key].brokenSuffixes.push(suffix)
    }

    if (asset.components && asset.components.length > 0) {
      asset.components.forEach(comp => {
        if (comp.status === 'Broken' || comp.status === 'Repaired' || comp.status === 'Repairing') {
          groups[key].brokenComponents.push({
            parentSuffix: suffix,
            compName: comp.name
          })
        }
      })
    }
  })

  const result = Object.values(groups).sort((a, b) => a.baseSeq.localeCompare(b.baseSeq, undefined, { numeric: true }))

  return result.map(group => {
    const formattedAll = formatSuffixesToRange(group.allSuffixes)
    group.displaySeq = formattedAll ? `${group.baseSeq}-${formattedAll}` : group.baseSeq

    let remarks = []
    if (group.brokenSuffixes.length > 0) {
      const formattedBroken = formatSuffixesToRange(group.brokenSuffixes)
      remarks.push(`ชำรุด ${group.brokenSuffixes.length} เครื่อง (หมายเลข ${formattedBroken})`)
    }
    if (group.brokenComponents.length > 0) {
      const compNames = group.brokenComponents.map(c => c.compName).join(', ')
      remarks.push(`อุปกรณ์ย่อยชำรุด ${group.brokenComponents.length} ชิ้น (${compNames})`)
    }
    
    group.remark = remarks.length > 0 ? remarks.join(' | ') : '-'

    // Determine overall status
    if (group.brokenSuffixes.length === 0 && group.brokenComponents.length === 0) {
      group.displayStatus = 'ใช้งานปกติ'
    } else if (group.brokenSuffixes.length === group.count && group.brokenComponents.length === 0) {
      group.displayStatus = 'ชำรุดทั้งหมด'
    } else {
      group.displayStatus = 'มีชำรุดบางส่วน'
    }

    return group
  })
})
</script>

<template>
  <div class="print-container font-sarabun text-black">
    <!-- หน้าเอกสารสำหรับพิมพ์ (Landscape) -->
    <div class="max-w-[280mm] mx-auto bg-white">

      <!-- หัวกระดาษ (แบบราชการ) -->
      <div class="text-center mb-8 relative">
        <h1 class="text-xl font-bold mb-1">ทะเบียนคุมทรัพย์สิน (ครุภัณฑ์)</h1>
        <h2 class="text-lg">แผนกเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเลย</h2>
        <p class="text-sm mt-2">พิมพ์ข้อมูล ณ วันที่ {{ toThaiNumerals(printDate) }} </p>
      </div>

      <!-- ตารางข้อมูล -->
      <table class="w-full text-xs border-collapse border border-black mb-6">
        <thead>
          <tr>
            <th class="border border-black px-2 py-2 text-center w-12 font-bold">ลำดับ</th>
            <th class="border border-black px-2 py-2 text-center font-bold">เลขครุภัณฑ์</th>
            <th class="border border-black px-2 py-2 text-center font-bold">รายการ / ยี่ห้อ</th>
            <th class="border border-black px-2 py-2 text-center font-bold">วันที่ได้มา</th>
            <th class="border border-black px-2 py-2 text-center font-bold">ราคา (บาท)</th>
            <th class="border border-black px-2 py-2 text-center font-bold">หน่วยงานที่ครอบครอง</th>
            <th class="border border-black px-2 py-2 text-center font-bold">สถานะ</th>
            <th class="border border-black px-2 py-2 text-center font-bold w-48">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(asset, index) in groupedAssets" :key="asset.id + '-' + index">
            <td class="border border-black px-2 py-1.5 text-center">{{ toThaiNumerals(index + 1) }}</td>
            <td class="border border-black px-2 py-1.5">{{ toThaiNumerals(asset.displaySeq) }}</td>
            <td class="border border-black px-2 py-1.5">
              <div>
                {{ toThaiNumerals(asset.name) }}
                <span v-if="asset.count > 1" class="ml-2 font-bold">(จำนวน {{ toThaiNumerals(asset.count) }}
                  ชิ้น)</span>
              </div>
            </td>
            <td class="border border-black px-2 py-1.5 text-center">{{
              toThaiNumerals(formatThaiDate(asset.acquiredDate)) }}</td>
            <td class="border border-black px-2 py-1.5 text-right">{{
              toThaiNumerals(asset.totalPrice?.toLocaleString(undefined,
                { minimumFractionDigits: 2 }) || '-') }}</td>
            <td class="border border-black px-2 py-1.5">{{ toThaiNumerals(asset.department) }}</td>
            <td class="border border-black px-2 py-1.5 text-center">{{ toThaiNumerals(asset.displayStatus) }}</td>
            <td class="border border-black px-2 py-1.5 text-left text-[11px] leading-tight">{{
              toThaiNumerals(asset.remark) }}</td>
          </tr>
          <tr v-if="groupedAssets.length === 0">
            <td colspan="8" class="border border-black px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลครุภัณฑ์</td>
          </tr>
        </tbody>
        <!-- สรุปยอด -->
        <tfoot v-if="groupedAssets.length > 0">
          <tr>
            <th colspan="4" class="border border-black px-2 py-2 text-right font-bold">รวมมูลค่าทั้งสิ้น</th>
            <th class="border border-black px-2 py-2 text-right font-bold">
              {{toThaiNumerals(groupedAssets.reduce((sum, a) => sum + (Number(a.totalPrice) || 0),
                0).toLocaleString(undefined,
                  { minimumFractionDigits: 2 }))}}
            </th>
            <th colspan="3" class="border border-black px-2 py-2"></th>
          </tr>
        </tfoot>
      </table>

      <!-- ส่วนผู้รายงาน / ลายเซ็น -->
      <div class="mt-12 flex justify-end">
        <div class="text-center w-64">
          <p class="mb-4 text-sm">ลงชื่อ ..............................................................
          </p>
          <p class="text-sm font-bold">( {{ currentUser?.name ||
            '......................................................' }} )</p>
          <p class="text-sm mt-1">ผู้พิมพ์รายงาน</p>
          <p class="text-xs mt-1">วันที่ {{ toThaiNumerals(printDate) }}</p>
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

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  .print-container {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding-top: 15mm;
    padding-bottom: 15mm;
    padding-left: 10mm;
    padding-right: 10mm;
  }
}
</style>
