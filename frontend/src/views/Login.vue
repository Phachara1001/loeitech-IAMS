<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, Eye, EyeOff, AlertCircle, Package, Boxes, ClipboardList, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

function handleSubmit() {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน'
    return
  }

  isLoading.value = true

  // TODO: เชื่อมต่อ API ยืนยันตัวตนจริงในภายหลัง (ตอนนี้ mock ไปก่อน)
  setTimeout(() => {
    isLoading.value = false

    // mock: ยอมรับทุก username/password ที่กรอกครบ
    localStorage.setItem('tcaims_auth_token', 'mock-token')
    localStorage.setItem('tcaims_user', JSON.stringify({ name: username.value }))

    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  }, 900)
}

function handleForgotPassword() {
  // TODO: เชื่อมต่อ flow ลืมรหัสผ่านจริงในภายหลัง
  console.log('forgot password clicked')
}
</script>

<template>
  <div class="min-h-screen w-full flex bg-white font-sarabun">
    <!-- ฝั่งซ้าย: แผงข้อมูลระบบ (ซ่อนบนจอมือถือ) -->
    <div class="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-[#0F3D26] via-[#1B5E3C] to-[#2F8B57]">
      <!-- ลวดลายไอคอนครุภัณฑ์ ทำเป็นกริดจาง ๆ แทนสัญลักษณ์การจัดเก็บพัสดุ -->
      <div class="absolute inset-0 opacity-[0.08] pointer-events-none">
        <div class="grid grid-cols-6 gap-10 p-10 -rotate-6 scale-125">
          <Boxes v-for="n in 30" :key="n" class="w-10 h-10 text-white" stroke-width="1.25" />
        </div>
      </div>

      <div class="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
        <div class="flex flex-col items-center text-center">
          <img src="/logo1.png" alt="ตราสัญลักษณ์วิทยาลัย" class="w-20 h-20 rounded-full object-cover ring-2 ring-white/40 mb-3" />
          <p class="text-sm font-medium text-white/80">ระบบสารสนเทศเพื่อการบริหารสถานศึกษา</p>
          <p class="text-lg font-semibold">วิทยาลัยเทคนิค</p>
        </div>

        <div class="max-w-md">
          <p class="text-base font-medium tracking-wide text-emerald-200 mb-3">ระบบบริหารครุภัณฑ์</p>
          <h1 class="text-3xl xl:text-4xl font-bold leading-snug mb-4">
            บริหารจัดการครุภัณฑ์<br />ของสถานศึกษาอย่างเป็นระบบ
          </h1>
          <p class="text-white/75 text-base leading-relaxed">
            บันทึก ติดตาม ตรวจนับ และตรวจสอบสถานะครุภัณฑ์ได้ครบถ้วนในที่เดียว
            ลดความซ้ำซ้อนของเอกสาร และตรวจสอบย้อนหลังได้ทุกขั้นตอน
          </p>

          <div class="flex items-center gap-6 mt-8 text-white/80">
            <div class="flex items-center gap-2 text-base">
              <ClipboardList class="w-5 h-5" />
              <span>บันทึกครุภัณฑ์</span>
            </div>
            <div class="flex items-center gap-2 text-base">
              <Package class="w-5 h-5" />
              <span>ตรวจนับประจำปี</span>
            </div>
          </div>
        </div>

        <p class="text-sm text-white/60">© {{ new Date().getFullYear() }} วิทยาลัยเทคนิค · งานพัสดุ</p>
      </div>
    </div>

    <!-- ฝั่งขวา: ฟอร์มเข้าสู่ระบบ -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 bg-[#F6FAF7]">
      <div class="w-full max-w-md">
        <!-- หัวข้อ (โลโก้แสดงเฉพาะจอมือถือ เพราะเดสก์ท็อปมีโลโก้อยู่ในพาเนลซ้ายแล้ว) -->
        <div class="flex flex-col items-center text-center mb-10 lg:items-start lg:text-left">
          <img src="/logo1.png" alt="ตราสัญลักษณ์วิทยาลัย" class="w-20 h-20 rounded-full object-cover ring-4 ring-[#1B5E3C]/15 mb-4 lg:hidden" />
          <h2 class="text-4xl font-bold text-[#0F3D26]">เข้าสู่ระบบ</h2>
          <p class="text-lg text-slate-500 mt-2">ระบบบริหารครุภัณฑ์ · วิทยาลัยเทคนิค</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit" novalidate>
          <!-- ชื่อผู้ใช้ -->
          <div>
            <label for="username" class="block text-lg font-semibold text-slate-700 mb-2">
              ชื่อผู้ใช้งาน
            </label>
            <div class="relative">
              <User class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="username"
                v-model="username"
                type="text"
                autocomplete="username"
                placeholder="กรอกชื่อผู้ใช้งาน"
                class="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C] transition"
              />
            </div>
          </div>

          <!-- รหัสผ่าน -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-lg font-semibold text-slate-700">
                รหัสผ่าน
              </label>
              <button
                type="button"
                @click="handleForgotPassword"
                class="text-base font-medium text-[#1B5E3C] hover:text-[#0F3D26] hover:underline underline-offset-2"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div class="relative">
              <Lock class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                class="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C] transition"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- ข้อความแสดงข้อผิดพลาด -->
          <div
            v-if="errorMessage"
            class="flex items-start gap-2.5 rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3.5"
            role="alert"
          >
            <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p class="text-base text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- ปุ่มยืนยัน -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1B5E3C] py-4 text-xl font-semibold text-white hover:bg-[#164B30] active:bg-[#0F3D26] transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
          </button>
        </form>

        <p class="text-base text-slate-500 text-center lg:text-left mt-10">
          พบปัญหาการเข้าใช้งาน ติดต่องานพัสดุ วิทยาลัยเทคนิค
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

.font-sarabun {
  font-family: 'Sarabun', sans-serif;
}
</style>