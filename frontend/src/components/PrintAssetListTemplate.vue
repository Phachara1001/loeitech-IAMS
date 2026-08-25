<script setup>
import { ref } from 'vue'

const props = defineProps({
  assets: {
    type: Array,
    required: true
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
</script>

<template>
  <div class="print-container font-sarabun text-black">
    <!-- หน้าเอกสารสำหรับพิมพ์ -->
    <div class="max-w-[210mm] mx-auto bg-white">

      <!-- หัวกระดาษ (แบบราชการ) -->
      <div class="text-center mb-8 relative">
        <h1 class="text-xl font-bold mb-1">ทะเบียนคุมทรัพย์สิน (ครุภัณฑ์)</h1>
        <h2 class="text-lg">วิทยาลัยเทคนิคเลย</h2>
        <p class="text-sm mt-2">พิมพ์ข้อมูล ณ วันที่ {{ printDate }} เวลา {{ printTime }} น.</p>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="(asset, index) in assets" :key="asset.id">
            <td class="border border-black px-2 py-1.5 text-center">{{ index + 1 }}</td>
            <td class="border border-black px-2 py-1.5">{{ asset.seq }}</td>
            <td class="border border-black px-2 py-1.5">
              <div>{{ asset.name }}</div>
            </td>
            <td class="border border-black px-2 py-1.5 text-center">{{ formatThaiDate(asset.acquiredDate) }}</td>
            <td class="border border-black px-2 py-1.5 text-right">{{ asset.unitPrice?.toLocaleString(undefined,
              { minimumFractionDigits: 2 }) || '-' }}</td>
            <td class="border border-black px-2 py-1.5">{{ asset.department }}</td>
            <td class="border border-black px-2 py-1.5 text-center">{{ getStatusText(asset.status) }}</td>
          </tr>
          <tr v-if="assets.length === 0">
            <td colspan="7" class="border border-black px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลครุภัณฑ์</td>
          </tr>
        </tbody>
        <!-- สรุปยอด -->
        <tfoot v-if="assets.length > 0">
          <tr>
            <th colspan="4" class="border border-black px-2 py-2 text-right font-bold">รวมมูลค่าทั้งสิ้น</th>
            <th class="border border-black px-2 py-2 text-right font-bold">
              {{assets.reduce((sum, a) => sum + (Number(a.unitPrice) || 0), 0).toLocaleString(undefined,
                { minimumFractionDigits: 2 })}}
            </th>
            <th colspan="2" class="border border-black px-2 py-2"></th>
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
          <p class="text-xs mt-1">วันที่ {{ printDate }}</p>
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

@media print {
  @page {
    size: A4 portrait;
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
