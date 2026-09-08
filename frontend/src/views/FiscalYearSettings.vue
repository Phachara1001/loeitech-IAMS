<script setup>
import { ref, onMounted } from 'vue'
import { CalendarCheck, AlertTriangle, CheckCircle, Info, Lock, ArrowRight, X } from 'lucide-vue-next'

const currentYear = ref(2569)
const nextYear = ref(2570)
const isConfirmModalOpen = ref(false)
const confirmInput = ref('')
const isProcessing = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

onMounted(() => {
  const storedYear = localStorage.getItem('tcaims_fiscal_year')
  if (storedYear) {
    currentYear.value = parseInt(storedYear, 10)
    nextYear.value = currentYear.value + 1
  } else {
    currentYear.value = 2569
    nextYear.value = 2570
  }
})

function openModal() {
  confirmInput.value = ''
  errorMessage.value = ''
  isConfirmModalOpen.value = true
}

function closeModal() {
  if (isProcessing.value) return
  isConfirmModalOpen.value = false
}

async function handleCloseFiscalYear() {
  if (confirmInput.value !== currentYear.value.toString()) {
    errorMessage.value = `กรุณาพิมพ์ ${currentYear.value} ให้ถูกต้องเพื่อยืนยัน`
    return
  }

  errorMessage.value = ''
  isProcessing.value = true

  // จำลองเวลาประมวลผล (เช่น ยกยอด, ล็อกข้อมูลเก่า)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // เปลี่ยนปีงบประมาณ
  const newYear = currentYear.value + 1
  localStorage.setItem('tcaims_fiscal_year', newYear.toString())

  // แจ้งให้ Topbar อัปเดตทันที
  window.dispatchEvent(new CustomEvent('fiscal-year-updated', {
    detail: { year: newYear.toString() }
  }))

  isProcessing.value = false
  isSuccess.value = true

  // หลังจากสำเร็จให้รีเซ็ตหน้าจอใหม่
  setTimeout(() => {
    isSuccess.value = false
    isConfirmModalOpen.value = false
    currentYear.value = newYear
    nextYear.value = newYear + 1
  }, 2000)
}
</script>

<template>
  <div class="max-w-auto mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-slate-800">ตั้งค่าปีงบประมาณ</h2>
      <p class="text-slate-500 mt-1">จัดการการปิดปีงบประมาณและยกยอดคงเหลือประจำปี</p>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Current Year Status -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-emerald-600 px-6 py-4">
          <div class="flex items-center gap-3 text-white">
            <CalendarCheck class="w-6 h-6" />
            <h3 class="text-lg font-semibold">ปีงบประมาณปัจจุบัน</h3>
          </div>
        </div>
        <div class="p-8 flex flex-col items-center justify-center text-center">
          <div class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">ปี พ.ศ.
            ปัจจุบันที่ระบบกำลังทำงาน</div>
          <div class="text-6xl font-black text-emerald-600 mb-6 tracking-tight">
            {{ currentYear }}
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full text-left">
            <div class="flex gap-3">
              <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 class="text-sm font-semibold text-amber-800">คำเตือนก่อนการปิดงบ</h4>
                <ul class="mt-2 space-y-1 text-sm text-amber-700 list-disc list-inside">
                  <li>ตรวจสอบรายการเบิกจ่ายที่ค้างอยู่ให้เรียบร้อย</li>
                  <li>ข้อมูลการเบิกจ่ายของปี {{ currentYear }} จะถูกล็อกห้ามแก้ไข</li>
                  <li>ยอดคงเหลือพัสดุจะถูกยกยอดไปเป็นต้นทุนของปี {{ nextYear }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lock class="w-5 h-5 text-slate-400" />
            ดำเนินการปิดงบประมาณ
          </h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">
            เมื่อทุกอย่างพร้อมสำหรับการสิ้นสุดปีงบประมาณ คุณสามารถกดปุ่มด้านล่างเพื่อทำการปิดบัญชีระบบของปี <span
              class="font-bold text-slate-800">{{ currentYear }}</span>
            และเริ่มต้นใช้งานปีงบประมาณ <span class="font-bold text-slate-800">{{ nextYear }}</span>
          </p>

          <div class="space-y-4">
            <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div class="flex-1 text-center">
                <div class="text-xs text-slate-500 font-medium">ปีงบประมาณเก่า</div>
                <div class="text-xl font-bold text-slate-700">{{ currentYear }}</div>
              </div>
              <ArrowRight class="w-5 h-5 text-slate-400" />
              <div class="flex-1 text-center">
                <div class="text-xs text-emerald-600 font-medium">ปีงบประมาณใหม่</div>
                <div class="text-xl font-bold text-emerald-600">{{ nextYear }}</div>
              </div>
            </div>
          </div>
        </div>

        <button @click="openModal"
          class="mt-8 w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
          <CalendarCheck class="w-5 h-5" />
          เริ่มต้นปีงบประมาณ {{ nextYear }}
        </button>
      </div>

    </div>

    <!-- Confirm Modal -->
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isConfirmModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">

        <!-- Modal Content -->
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" @click.stop>

          <div v-if="!isSuccess">
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 class="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle class="w-5 h-5" />
                ยืนยันการปิดงบประมาณ
              </h3>
              <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors"
                :disabled="isProcessing">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6">
              <p class="text-slate-600 text-sm mb-4">
                การกระทำนี้ <span class="font-bold text-rose-600">ไม่สามารถย้อนกลับได้</span> ข้อมูลการเบิกจ่ายของปี {{
                currentYear }} จะถูกล็อก และระบบจะสร้างยอดยกมาสำหรับปี {{ nextYear }} อัตโนมัติ
              </p>

              <div class="mb-4">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  เพื่อเป็นการยืนยัน กรุณาพิมพ์ <span
                    class="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{{ currentYear }}</span>
                  ลงในช่องด้านล่าง
                </label>
                <input v-model="confirmInput" type="text"
                  class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-center text-lg font-bold tracking-widest text-slate-800"
                  placeholder="พิมพ์ปี พ.ศ. ปัจจุบัน" :disabled="isProcessing" @keyup.enter="handleCloseFiscalYear" />
                <p v-if="errorMessage" class="mt-2 text-sm text-rose-600 flex items-center gap-1">
                  <Info class="w-4 h-4" /> {{ errorMessage }}
                </p>
              </div>

              <!-- Modal Actions -->
              <div class="flex gap-3 mt-6">
                <button type="button" @click="closeModal"
                  class="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  :disabled="isProcessing">
                  ยกเลิก
                </button>
                <button type="button" @click="handleCloseFiscalYear"
                  class="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  :disabled="isProcessing || confirmInput !== currentYear.toString()">
                  <span v-if="!isProcessing">ยืนยันการปิดงบ</span>
                  <div v-else class="flex items-center gap-2">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                      fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                    </svg>
                    กำลังประมวลผล...
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Success State -->
          <div v-else class="p-8 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle class="w-8 h-8" />
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">ปิดปีงบประมาณสำเร็จ!</h3>
            <p class="text-slate-600 text-sm">
              ระบบได้เริ่มต้นปีงบประมาณ {{ nextYear }} เรียบร้อยแล้ว<br />หน้าจอจะรีเฟรชในอีกสักครู่...
            </p>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>
