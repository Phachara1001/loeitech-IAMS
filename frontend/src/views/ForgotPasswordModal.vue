<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { X, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const emit = defineEmits(['close'])
const toast = useToast()

// ขั้นตอน: 'email' (กรอกอีเมลขอรหัส) -> 'pending' (รอแอดมินอนุมัติ) -> 'newPassword' (ตั้งรหัสผ่านใหม่) -> 'done' (สำเร็จ)
const step = ref('email')

const email = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const isLoading = ref(false)
const errorMessage = ref('')

function extractErrorMessage(error) {
  const data = error.response?.data
  if (data?.errors?.length) return data.errors.join(' / ')
  if (data?.message) return data.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

/* ขั้นที่ 1: ขอรหัสยืนยัน (ส่งไปยังอีเมล) */
async function handleSendCode() {
  errorMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'กรุณากรอกอีเมล'
    return
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value.trim())) {
    errorMessage.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }

  isLoading.value = true
  try {
    const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.value.trim() })
    if (res.data.status === 'approved') {
      toast.success('คำขอได้รับการอนุมัติแล้ว กรุณาตั้งรหัสผ่านใหม่')
      step.value = 'newPassword'
    } else {
      toast.success('ส่งคำขอสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติ')
      step.value = 'pending'
    }
  } catch (error) {
    const msg = extractErrorMessage(error)
    errorMessage.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

/* ขั้นที่ 2: ตั้งรหัสผ่านใหม่ (เมื่อแอดมินอนุมัติแล้ว) */
async function handleResetPassword() {
  errorMessage.value = ''

  if (!newPassword.value.trim() || !confirmNewPassword.value.trim()) {
    errorMessage.value = 'กรุณากรอกรหัสผ่านใหม่ให้ครบทุกช่อง'
    return
  }
  if (newPassword.value.length < 8) {
    errorMessage.value = 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน'
    return
  }

  isLoading.value = true
  try {
    await axios.post(`${API_BASE}/auth/reset-password`, {
      email: email.value.trim(),
      newPassword: newPassword.value,
      confirmPassword: confirmNewPassword.value
    })
    toast.success('ตั้งรหัสผ่านใหม่สำเร็จ')
    step.value = 'done'
  } catch (error) {
    const msg = extractErrorMessage(error)
    errorMessage.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

/* ย้อนกลับไปหน้าแรก */
function handleResendCode() {
  step.value = 'email'
  newPassword.value = ''
  confirmNewPassword.value = ''
  errorMessage.value = ''
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04140B]/60 backdrop-blur-sm font-sarabun"
      @click.self="handleClose"
    >
      <div class="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl modal-shimmer-bg">
        <!-- แสงเรืองเพิ่มมิติเลื่อมเขียวอ่อน -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-10 -right-14 w-[220px] h-[220px] rounded-full bg-[#4ADE80] opacity-30 blur-[70px]"></div>
          <div class="absolute -bottom-16 -left-10 w-[200px] h-[200px] rounded-full bg-[#04140B] opacity-70 blur-[60px]"></div>
        </div>

        <button
          type="button"
          @click="handleClose"
          class="absolute top-4 right-4 z-20 text-white/60 hover:text-white transition"
          aria-label="ปิดหน้าต่าง"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="relative z-10 p-6 sm:p-7">
          <!-- ขั้นที่ 1: กรอกอีเมล -->
          <template v-if="step === 'email'">
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 ring-1 ring-white/25">
                <KeyRound class="w-6 h-6 text-emerald-200" />
              </div>
              <h3 class="text-xl font-bold text-white">ลืมรหัสผ่าน</h3>
              <p class="text-white mt-1.5 text-sm leading-relaxed">
                กรอกอีเมลที่ใช้ลงทะเบียนไว้ ระบบจะส่งคำขอไปยังผู้ดูแลระบบเพื่อพิจารณาอนุมัติ
              </p>
            </div>

            <form class="space-y-4" @submit.prevent="handleSendCode" novalidate>
              <div>
                <label for="reset-email" class="block text-sm font-semibold text-white/90 mb-1.5">
                  อีเมล
                </label>
                <div class="relative">
                  <Mail class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    class="frosted-input w-full pl-12 pr-5 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                </div>
              </div>

              <div
                v-if="errorMessage"
                class="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-400/30 px-3.5 py-2.5"
                role="alert"
              >
                <p class="text-sm text-red-200">{{ errorMessage }}</p>
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-base font-bold text-[#072415] shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isLoading" class="w-4.5 h-4.5 animate-spin" />
                <span>{{ isLoading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอรหัสผ่าน' }}</span>
              </button>
            </form>
          </template>

          <!-- ขั้นที่ 1.5: รอการอนุมัติ -->
          <template v-else-if="step === 'pending'">
            <div class="flex flex-col items-center text-center py-2">
              <div class="w-14 h-14 rounded-full bg-amber-400/15 flex items-center justify-center mb-4 ring-1 ring-amber-300/30">
                <Loader2 class="w-8 h-8 text-amber-200 animate-spin" />
              </div>
              <h3 class="text-xl font-bold text-white mb-1.5">คำขอถูกส่งแล้ว</h3>
              <p class="text-white text-sm leading-relaxed">
                คำขอรีเซ็ตรหัสผ่านของ <span class="font-semibold">{{ email }}</span> กำลังรอการอนุมัติจากผู้ดูแลระบบ
              </p>
              <p class="text-white/70 text-sm mt-2">
                เมื่อผู้ดูแลระบบอนุมัติแล้ว คุณสามารถกลับมาที่หน้านี้ กรอกอีเมลเดิมเพื่อตั้งรหัสผ่านใหม่ได้ทันที
              </p>
              <button
                type="button"
                @click="handleClose"
                class="mt-6 w-full rounded-xl bg-white py-3 text-base font-bold text-[#072415] shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                เข้าใจแล้ว, กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </template>

          <!-- ขั้นที่ 2: ตั้งรหัสผ่านใหม่ -->
          <template v-else-if="step === 'newPassword'">
            <button
              type="button"
              @click="handleResendCode"
              class="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition"
            >
              <ArrowLeft class="w-4 h-4" />
              ย้อนกลับ
            </button>

            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 ring-1 ring-white/25">
                <Lock class="w-6 h-6 text-emerald-200" />
              </div>
              <h3 class="text-xl font-bold text-white">ตั้งรหัสผ่านใหม่</h3>
              <p class="text-white mt-1.5 text-sm leading-relaxed">
                คำขอของคุณได้รับการอนุมัติแล้ว<br/> กรุณาตั้งรหัสผ่านใหม่สำหรับ <span class="font-semibold">{{ email }}</span>
              </p>
            </div>

            <form class="space-y-4" @submit.prevent="handleResetPassword" novalidate>

              <!-- รหัสผ่านใหม่ -->
              <div>
                <label for="new-password" class="block text-sm font-semibold text-white/90 mb-1.5">
                  รหัสผ่านใหม่
                </label>
                <div class="relative">
                  <Lock class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    class="frosted-input w-full pl-12 pr-12 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                    :aria-label="showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <Eye v-if="!showNewPassword" class="w-4.5 h-4.5" />
                    <EyeOff v-else class="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <!-- ยืนยันรหัสผ่านใหม่ -->
              <div>
                <label for="confirm-new-password" class="block text-sm font-semibold text-white/90 mb-1.5">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div class="relative">
                  <Lock class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-new-password"
                    v-model="confirmNewPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    class="frosted-input w-full pl-12 pr-12 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                    :aria-label="showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <Eye v-if="!showConfirmPassword" class="w-4.5 h-4.5" />
                    <EyeOff v-else class="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <div
                v-if="errorMessage"
                class="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-400/30 px-3.5 py-2.5"
                role="alert"
              >
                <p class="text-sm text-red-200">{{ errorMessage }}</p>
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-base font-bold text-[#072415] shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isLoading" class="w-4.5 h-4.5 animate-spin" />
                <span>{{ isLoading ? 'กำลังตั้งรหัสผ่านใหม่...' : 'ตั้งรหัสผ่านใหม่' }}</span>
              </button>
            </form>
          </template>

          <!-- ขั้นที่ 3: สำเร็จ -->
          <template v-else>
            <div class="flex flex-col items-center text-center py-2">
              <div class="w-14 h-14 rounded-full bg-emerald-400/15 flex items-center justify-center mb-4 ring-1 ring-emerald-300/30">
                <CheckCircle2 class="w-8 h-8 text-emerald-200" />
              </div>
              <h3 class="text-xl font-bold text-white mb-1.5">ตั้งรหัสผ่านใหม่สำเร็จ</h3>
              <p class="text-white text-sm leading-relaxed">
                รหัสผ่านของ <span class="font-semibold">{{ email }}</span> ถูกเปลี่ยนเรียบร้อยแล้ว
                ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
              </p>
              <button
                type="button"
                @click="handleClose"
                class="mt-6 w-full rounded-xl bg-white py-3 text-base font-bold text-[#072415] shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                ไปยังหน้าเข้าสู่ระบบ
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

.font-sarabun {
  font-family: 'Sarabun', sans-serif;
}

/* พื้นหลังไล่เฉดเขียวเข้มเลื่อมเขียวอ่อน */
.modal-shimmer-bg {
  background: linear-gradient(135deg, #04140B 0%, #0B2E1C 28%, #1B5E3C 58%, #2F9E5C 82%, #4ADE80 100%);
}

/* กล่องกรอกข้อมูลสไตล์กระจกฝ้า */
.frosted-input {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 4px 18px rgba(4, 20, 11, 0.18);
}

.frosted-input:focus {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.25);
}
</style>