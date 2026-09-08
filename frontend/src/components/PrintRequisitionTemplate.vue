<script setup>
import { computed } from 'vue'

const props = defineProps({
  requisition: {
    type: Object,
    required: true
  }
})

// Helpers for date
const reqDate = computed(() => {
  if (!props.requisition?.createdAt) return { day: '.....', month: '..................', year: '...........' }
  const d = new Date(props.requisition.createdAt)
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  return {
    day: d.getDate(),
    month: months[d.getMonth()],
    year: d.getFullYear() + 543
  }
})

// Requisition Number
const reqNumberParts = computed(() => {
  const code = props.requisition?.reqCode || ''
  if (code.includes('/')) {
    const parts = code.split('/')
    if (parts.length === 2) {
      return { num: parts[0], year: parts[1] }
    }
  } else if (code.startsWith('REQ-')) {
    const parts = code.split('-')
    if (parts.length === 3) {
      return { num: parseInt(parts[2], 10), year: parts[1] }
    }
  }
  return { num: '.....', year: '...........' }
})

const padItems = computed(() => {
  return props.requisition?.items || []
})

const currentUser = computed(() => {
  const storedUser = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
  return storedUser.name || '....................................................................'
})

const toThaiNumerals = (num) => {
  if (num == null) return ''
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  return String(num).replace(/\d/g, (d) => thaiNums[d])
}

const numberThai = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐']
</script>

<template>
  <div class="print-container font-sarabun text-black bg-white">
    <!-- A4 Paper size container -->
    <div class="a4-page mx-auto relative">
      <h1 class="text-center font-bold text-2xl mt-4 mb-8">ใบเบิกวัสดุ</h1>

      <div class="flex justify-between mb-4 text-sm leading-relaxed">
        <div>
          ใบเบิกเลขที่ {{ toThaiNumerals(reqNumberParts.num) }}/{{ toThaiNumerals(reqNumberParts.year) }}
        </div>
        <div>
          แผนกวิชาเทคโนโลยีสารสนเทศ
        </div>
      </div>

      <div class="flex justify-end mb-6 text-sm leading-relaxed">
        <div>
          วันที่ {{ toThaiNumerals(reqDate.day) }} {{ reqDate.month }} พ.ศ. {{ toThaiNumerals(reqDate.year) }}
        </div>
      </div>

      <div class="text-sm leading-relaxed mb-6">
        <div>เรื่อง<span class="ml-4">ขออนุมัติเบิกวัสดุสิ่งของใช้ราชการ</span></div>
        <div>เรียน<span class="ml-4">หัวหน้าแผนกวิชาเทคโนโลยีสารสนเทศ</span></div>
        <div class="indent-12 mt-2">
          ด้วยข้าพเจ้า {{ requisition.requesterName || currentUser }} สังกัดแผนกวิชาเทคโนโลยีสารสนเทศ
          มีความประสงค์จะขอเบิกพัสดุสิ่งของเพื่อไปใช้เพื่อ{{ toThaiNumerals(requisition.reason) }} ตามรายการต่อไปนี้คือ
        </div>
      </div>

      <table class="w-full border-collapse border border-black text-sm mb-6 table-fixed">
        <thead>
          <tr>
            <th class="border border-black p-1.5 w-12 text-center font-normal">ลำดับ</th>
            <th class="border border-black p-1.5 text-center font-normal">รายการ</th>
            <th class="border border-black p-1.5 w-24 text-center font-normal">จำนวน</th>
            <th class="border border-black p-1.5 w-32 text-center font-normal">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in padItems" :key="index" class="h-8">
            <td class="border border-black p-1.5 text-center">{{ toThaiNumerals(numberThai[index] || index + 1) }}</td>
            <td class="border border-black p-1.5 px-3 truncate">{{ toThaiNumerals(item?.item?.name || '') }}</td>
            <td class="border border-black p-1.5 text-center">{{ item ? toThaiNumerals(`${item.requestedQty} ${item.item?.unit || ''}`)
              : '' }}</td>
            <td class="border border-black p-1.5 text-center"></td>
          </tr>
        </tbody>
      </table>

      <div class="grid grid-cols-2 gap-x-12 gap-y-12 text-sm text-center">
        <!-- Requester (ผู้เบิก) -->
        <div class="col-start-2">
          <div class="mb-1 text-center">
            {{ requisition.requesterName || currentUser }}
          </div>
          <div class="flex items-end justify-center">
            ผู้ขอเบิก
          </div>
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

.a4-page {
  width: 210mm;
  min-height: 297mm;
  background-color: white;
}

@media print {
  @page {
    size: A4;
    margin: 0;
  }

  .print-container {
    width: 100%;
    margin: 0;
    padding: 0;
    background: white;
  }

  .a4-page {
    width: 100%;
    min-height: auto;
    padding: 20mm;
    margin: 0;
    box-shadow: none;
  }
}
</style>
