<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'

const route = useRoute()
const requisition = ref(null)
const currentUser = ref('')
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('ไม่พบรหัสใบเบิก')

    // ดึงชื่อผู้ใช้ปัจจุบันเผื่อกรณีใบเบิกเก่าไม่มีชื่อคนเบิก
    const storedUser = JSON.parse(localStorage.getItem('tcaims_user') || '{}')
    currentUser.value = storedUser.name || '....................................................................'

    // Fetch data from API
    const data = await inventoryApi.getRequisitionById(id)
    requisition.value = data

    // Auto print when data is loaded
    setTimeout(() => {
      window.print()
    }, 500)
  } catch (err) {
    error.value = err.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
})

// Helpers for date
const reqDate = computed(() => {
  if (!requisition.value?.createdAt) return { day: '.....', month: '..................', year: '...........' }
  const d = new Date(requisition.value.createdAt)
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  return {
    day: d.getDate(),
    month: months[d.getMonth()],
    year: d.getFullYear() + 543
  }
})

// Requisition Number
const reqNumberParts = computed(() => {
  const code = requisition.value?.reqCode || ''
  if (code.includes('/')) {
    const parts = code.split('/')
    if (parts.length === 2) {
      return { num: parts[0], year: parts[1] }
    }
  } else if (code.startsWith('REQ-')) {
    // Legacy support: REQ-2569-0001
    const parts = code.split('-')
    if (parts.length === 3) {
      return { num: parseInt(parts[2], 10), year: parts[1] }
    }
  }
  return { num: '.....', year: '...........' }
})

const padItems = computed(() => {
  return requisition.value?.items || []
})

const numberThai = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐']

</script>

<template>
  <div v-if="isLoading" class="min-h-screen flex flex-col items-center justify-center bg-gray-100 print:hidden">
    <Loader2 class="w-8 h-8 animate-spin text-[#065f46]" />
    <p class="mt-2 text-gray-500">กำลังเตรียมเอกสาร...</p>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-gray-100 text-red-500 print:hidden">
    {{ error }}
  </div>

  <div v-else class="print-container font-sarabun text-black bg-white min-h-screen flex justify-center">
    <!-- Non-print utility bar -->
    <div class="fixed top-4 right-4 print:hidden flex gap-2">
      <button @click="window.print()" class="px-4 py-2 bg-emerald-600 text-white rounded shadow">พิมพ์ใบเบิก</button>
      <button @click="$router.back()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow">กลับ</button>
    </div>

    <!-- A4 Paper size container -->
    <div class="a4-page bg-white shadow-xl print:shadow-none p-12 mx-auto relative">
      <h1 class="text-center font-bold text-2xl mt-4 mb-8">ใบเบิกวัสดุ</h1>

      <div class="flex justify-between mb-4 text-sm leading-relaxed">
        <div>
          ใบเบิกเลขที่<span
            class="mx-2 px-4 border-b border-dotted border-black min-w-[60px] inline-block text-center">{{
              reqNumberParts.num }}/{{
              reqNumberParts.year }}</span>
        </div>
        <div>
          หน่วยงาน<span
            class="mx-2 px-12 border-b border-dotted border-black min-w-[150px] inline-block text-center">วิทยาลัยเทคนิคเลย</span>
        </div>
      </div>

      <div class="flex justify-end mb-6 text-sm leading-relaxed">
        <div>
          วันที่ {{ reqDate.day }} {{ reqDate.month }} พ.ศ. {{ reqDate.year }}
        </div>
      </div>

      <div class="text-sm leading-relaxed mb-6">
        <div>เรื่อง<span class="ml-4">ขออนุมัติเบิกวัสดุสิ่งของใช้ราชการ</span></div>
        <div>เรียน<span class="ml-4">หัวหน้าหน่วยพัสดุ</span></div>
        <div class="indent-12 mt-2">
          ด้วยข้าพเจ้า {{ requisition.requesterName }} สังกัด {{ วิทยาลัยเทคนิคเลย }}
          มีความประสงค์จะขอเบิกพัสดุสิ่งของเพื่อไปใช้เพื่อ{{ requisition.reason }}
        </div>
        <div>
          ตามรายการต่อไปนี้คือ
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
            <td class="border border-black p-1.5 text-center">{{ numberThai[index] || index + 1 }}</td>
            <td class="border border-black p-1.5 px-3 truncate">{{ item?.item?.name || '' }}</td>
            <td class="border border-black p-1.5 text-center">{{ item ? `${item.requestedQty} ${item.item?.unit || ''}`
              : '' }}</td>
            <td class="border border-black p-1.5 text-center"></td>
          </tr>
        </tbody>
      </table>

      <div class="indent-12 text-sm mb-8">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>

      <div class="grid grid-cols-2 gap-x-12 gap-y-12 text-sm text-center">
        <!-- Requester (ผู้เบิก) -->
        <div class="col-start-2">
          <div class="flex items-end justify-center mb-1">
            (ลงชื่อ)<span class="mx-2 border-b border-dotted border-black w-48 inline-block"></span><br />
            {{ requisition.requesterName }}
          </div>
          <div class="flex items-end justify-center">
            สังกัด วิทยาลัยเทคนิคเลย
          </div>
        </div>

        <!-- Examiner (ผู้ตรวจสอบ) -->
        <div>
          <div class="text-left mb-4">ได้ตรวจสอบสิ่งของแล้วพอมีจ่ายให้เบิกตามที่ขอมา</div>
          <div class="flex items-end justify-start mb-1">
            (ลงชื่อ)<span class="mx-2 border-b border-dotted border-black w-48 inline-block"></span>
          </div>
          <div class="mb-1">เจ้าหน้าที่ผู้ตรวจสอบ</div>
          <div>........../............/..........</div>
        </div>

        <!-- Approver (ผู้อนุมัติ) -->
        <div>
          <div class="mb-4">อนุมัติให้จ่ายได้</div>
          <div class="flex items-end justify-center mb-1">
            (ลงชื่อ)<span
              class="mx-2 border-b border-dotted border-black w-48 inline-block"></span>(หัวหน้าหน่วยพัสดุ/ผู้สั่งจ่ายพัสดุ)
          </div>
          <div class="mb-1">(...................................................)</div>
          <div>........../............/..........</div>
        </div>

        <!-- Receiver (ผู้รับของ) -->
        <div>
          <div class="mb-4">ได้รับของไปถูกต้องแล้ว</div>
          <div class="flex items-end justify-start mb-1">
            (ลงชื่อ)<span class="mx-2 border-b border-dotted border-black w-48 inline-block"></span>
          </div>
          <div class="mb-1">(...................................................)</div>
          <div>........../............/..........</div>
        </div>

        <!-- Payer (ผู้จ่ายของ) -->
        <div>
          <div class="mb-4">ได้จ่ายสิ่งของไปและตัดยอดใบบัญชีแล้ว</div>
          <div class="flex items-end justify-start mb-1">
            (ลงชื่อ)<span class="mx-2 border-b border-dotted border-black w-48 inline-block"></span>
          </div>
          <div class="mb-1">(...................................................)</div>
          <div>........../............/..........</div>
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

  .a4-page {
    width: 100%;
    min-height: auto;
    padding: 20mm;
    margin: 0;
    box-shadow: none;
  }
}
</style>
