<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { X, Mail, User, Lock, Eye, EyeOff, Loader2, CheckCircle2, UserPlus } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const emit = defineEmits(['close', 'registered'])
const toast = useToast()

const email = ref('')
const fullName = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isDone = ref(false)
const errorMessage = ref('')

function validate() {
  if (
    !email.value.trim() ||
    !fullName.value.trim() ||
    !password.value.trim() ||
    !confirmPassword.value.trim()
  ) {
    return 'กรุณากรอกข้อมูลให้ครบทุกช่อง'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value.trim())) {
    return 'รูปแบบอีเมลไม่ถูกต้อง'
  }

  if (password.value.length < 8) {
    return 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
  }

  if (password.value !== confirmPassword.value) {
    return 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน'
  }

  return ''
}

function extractErrorMessage(error) {
  const data = error.response?.data
  if (data?.errors?.length) return data.errors.join(' / ')
  if (data?.message) return data.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

async function handleSubmit() {
  const validationError = validate()
  errorMessage.value = validationError
  if (validationError) return

  isLoading.value = true

  try {
    await axios.post(`${API_BASE}/auth/register`, {
      name: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value
    })
    toast.success('สร้างบัญชีสำเร็จ')
    isDone.value = true
    emit('registered', email.value.trim())
  } catch (error) {
    const msg = extractErrorMessage(error)
    errorMessage.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04140B]/60 backdrop-blur-sm font-sarabun overflow-y-auto"
      @click.self="handleClose"
    >
      <div class="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl modal-shimmer-bg my-8">
        <!-- แสงเรืองเพิ่มมิติเลื่อมเขียวอ่อน -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-10 -left-14 w-[220px] h-[220px] rounded-full bg-[#4ADE80] opacity-30 blur-[70px]"></div>
          <div class="absolute -bottom-16 -right-10 w-[200px] h-[200px] rounded-full bg-[#04140B] opacity-70 blur-[60px]"></div>
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
          <template v-if="!isDone">
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 ring-1 ring-white/25">
                <UserPlus class="w-6 h-6 text-emerald-200" />
              </div>
              <h3 class="text-xl font-bold text-white">สร้างบัญชี</h3>
              <p class="text-white mt-1.5 text-sm leading-relaxed">
                กรอกข้อมูลด้านล่างเพื่อสมัครใช้งานระบบบริหารครุภัณฑ์
              </p>
            </div>

            <form class="space-y-4" @submit.prevent="handleSubmit" novalidate>
              <!-- อีเมล -->
              <div>
                <label for="reg-email" class="block text-sm font-semibold text-white/90 mb-1.5">
                  อีเมล
                </label>
                <div class="relative">
                  <Mail class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    class="frosted-input w-full pl-12 pr-5 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                </div>
              </div>

              <!-- ชื่อ -->
              <div>
                <label for="reg-name" class="block text-sm font-semibold text-white/90 mb-1.5">
                  ชื่อ - นามสกุล
                </label>
                <div class="relative">
                  <User class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    v-model="fullName"
                    type="text"
                    autocomplete="name"
                    placeholder="กรอกชื่อ-นามสกุล"
                    class="frosted-input w-full pl-12 pr-5 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                </div>
              </div>

              <!-- รหัสผ่าน -->
              <div>
                <label for="reg-password" class="block text-sm font-semibold text-white/90 mb-1.5">
                  รหัสผ่าน
                </label>
                <div class="relative">
                  <Lock class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    class="frosted-input w-full pl-12 pr-12 py-3.5 rounded-xl text-[#0B2417] text-sm placeholder:text-[#0F3D26]/50 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                    :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <Eye v-if="!showPassword" class="w-4.5 h-4.5" />
                    <EyeOff v-else class="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <!-- ยืนยันรหัสผ่าน -->
              <div>
                <label for="reg-confirm-password" class="block text-sm font-semibold text-white/90 mb-1.5">
                  ยืนยันรหัสผ่าน
                </label>
                <div class="relative">
                  <Lock class="w-4.5 h-4.5 text-[#0F3D26]/70 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm-password"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
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
                <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี' }}</span>
              </button>
            </form>
          </template>

          <template v-else>
            <div class="flex flex-col items-center text-center py-2">
              <div class="w-14 h-14 rounded-full bg-emerald-400/15 flex items-center justify-center mb-4 ring-1 ring-emerald-300/30">
                <CheckCircle2 class="w-8 h-8 text-emerald-200" />
              </div>
              <h3 class="text-xl font-bold text-white mb-1.5">สร้างบัญชีสำเร็จ</h3>
              <p class="text-white text-sm leading-relaxed">
                บัญชีของ <span class="text-white font-semibold">{{ email }}</span> ถูกสร้างเรียบร้อยแล้ว
                โปรดรอผู้ดูแลระบบอนุมัติบัญชีของคุณ จึงจะสามารถเข้าสู่ระบบได้
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