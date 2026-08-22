<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Bell, Search, User, ChevronDown, UserCircle, LogOut, X, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const isMenuOpen = ref(false)
const isLogoutModalOpen = ref(false)
const menuRef = ref(null)

// ข้อมูลผู้ใช้งานที่อัปเดตตามโปรไฟล์ (เพิ่มฟิลด์ role สำหรับใช้เช็คสิทธิ์แสดงผล)
const user = ref({
  name: 'Admin User',
  avatar: null,
  role: 'user' // ค่าเริ่มต้นเป็น user ทั่วไปเพื่อความปลอดภัย
})

const fiscalYear = ref('2569')

// เช็คว่าปัจจุบันอยู่หน้าโปรไฟล์หรือไม่
const isProfilePage = computed(() => route.path === '/profile')

function loadUserData() {
  try {
    const stored = JSON.parse(localStorage.getItem('tcaims_user') || 'null')
    if (stored) {
      if (stored.name) user.value.name = stored.name
      // ซิงค์ avatar (รองรับทั้งกรณีมีรูปภาพ หรือ null)
      user.value.avatar = stored.avatar || null
    }

    // ดึงค่า role จาก localStorage ที่ระบบบันทึกไว้ตอน Login สำเร็จ
    const storedRole = localStorage.getItem('tcaims_role')
    if (storedRole) {
      user.value.role = String(storedRole).toLowerCase() // แปลงเป็นพิมพ์เล็กเพื่อใช้เช็คเงื่อนไข
    }
  } catch (e) {
    // ignore
  }
}

function handleProfileUpdate(e) {
  if (e.detail) {
    if (e.detail.name) user.value.name = e.detail.name
    if (e.detail.avatar !== undefined) user.value.avatar = e.detail.avatar
    if (e.detail.role) user.value.role = String(e.detail.role).toLowerCase() // อัปเดตสิทธิ์แบบ Realtime
  }
}

function loadFiscalYear() {
  const stored = localStorage.getItem('tcaims_fiscal_year')
  if (stored) {
    fiscalYear.value = stored
  } else {
    fiscalYear.value = '2569'
  }
}

function handleFiscalYearUpdate(e) {
  if (e.detail && e.detail.year) {
    fiscalYear.value = e.detail.year
  }
}

// อัปเดตข้อมูลผู้ใช้ทุกครั้งที่มีการเปลี่ยน Route หน้าเว็บ
watch(() => route.path, () => {
  loadUserData()
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function goToProfile() {
  closeMenu()
  router.push('/profile')
}

function openLogoutConfirm() {
  closeMenu()
  isLogoutModalOpen.value = true
}

function cancelLogout() {
  isLogoutModalOpen.value = false
}

function confirmLogout() {
  localStorage.removeItem('tcaims_auth_token')
  localStorage.removeItem('tcaims_user')
  localStorage.removeItem('tcaims_role') // ล้างข้อมูลสิทธิ์ออกตอนออกจากระบบ
  isLogoutModalOpen.value = false
  router.push('/login')
}

// ปิดเมนูเมื่อคลิกนอกพื้นที่เมนู
function handleClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  loadUserData()
  loadFiscalYear()
  window.addEventListener('profile-updated', handleProfileUpdate)
  window.addEventListener('fiscal-year-updated', handleFiscalYearUpdate)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('profile-updated', handleProfileUpdate)
  window.removeEventListener('fiscal-year-updated', handleFiscalYearUpdate)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
    <div class="flex items-center">
      <h1 class="text-xl font-semibold text-slate-900 hidden sm:block">
        ระบบบริหารครุภัณฑ์
      </h1>
      <div class="ml-4 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 transition-all">
        ปีงบประมาณ {{ fiscalYear }}
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div class="relative hidden md:block">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาด่วน..."
          class="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
        />
      </div>

      <button class="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
      </button>

      <div class="h-8 w-px bg-slate-200 mx-2"></div>

      <!-- เมนูผู้ใช้งาน -->
      <div class="relative" ref="menuRef">
        <button
          type="button"
          @click="toggleMenu"
          class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <!-- รูปโปรไฟล์มุมขวาบน (เชื่อม dynamic กับ user.avatar) -->
          <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold overflow-hidden border border-emerald-200 shrink-0">
            <img v-if="user.avatar" :src="user.avatar" alt="รูปโปรไฟล์" class="w-full h-full object-cover" />
            <User v-else class="w-4 h-4" />
          </div>
          <div class="text-left hidden sm:block">
            <div class="text-sm font-medium text-slate-700 leading-none">{{ user.name }}</div>
            <!-- แก้ไขจุดที่ 1: แสดงประเภทสิทธิ์ตามที่ดึงมาจากฐานข้อมูลจริงแบบ Dynamic -->
            <div class="text-xs text-slate-500 mt-1">
              {{ user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'staff' ? 'เจ้าหน้าที่พัสดุ' : 'ผู้ใช้งานทั่วไป' }}
            </div>
          </div>
          <ChevronDown
            class="w-4 h-4 text-slate-400 transition-transform hidden sm:block"
            :class="{ 'rotate-180': isMenuOpen }"
          />
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="isMenuOpen"
            class="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-20"
          >
            <div class="px-3.5 py-2.5 border-b border-slate-100">
              <div class="text-sm font-medium text-slate-800 truncate">{{ user.name }}</div>
              <!-- แก้ไขจุดที่ 2: แสดงประเภทสิทธิ์ในกล่องเมนูดรอปดาวน์ตามจริงแบบ Dynamic -->
              <div class="text-xs text-slate-500 mt-0.5">
                {{ user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'staff' ? 'เจ้าหน้าที่พัสดุ' : 'ผู้ใช้งานทั่วไป' }}
              </div>
            </div>

            <button
              type="button"
              @click="goToProfile"
              class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserCircle class="w-4 h-4 text-slate-400" />
              <span>ข้อมูลส่วนตัว</span>
            </button>

            <!-- แสดงปุ่มออกจากระบบเฉพาะเมื่อ "ไม่ใช่" หน้าข้อมูลส่วนตัว (v-if="!isProfilePage") -->
            <button
              v-if="!isProfilePage"
              type="button"
              @click="openLogoutConfirm"
              class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
            >
              <LogOut class="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <!-- Modal ยืนยันการออกจากระบบ -->
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLogoutModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4"
      @click.self="cancelLogout"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          type="button"
          @click="cancelLogout"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="ปิด"
        >
          <X class="w-4 h-4" />
        </button>

        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle class="w-6 h-6 text-red-500" />
          </div>
          <h3 class="text-base font-semibold text-slate-900">ยืนยันการออกจากระบบ</h3>
          <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">
            ระบบจะออกจากบัญชีผู้ใช้ปัจจุบัน<br />คุณต้องการดำเนินการต่อหรือไม่
          </p>
        </div>

        <div class="flex items-center gap-3 mt-6">
          <button
            type="button"
            @click="cancelLogout"
            class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            @click="confirmLogout"
            class="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>