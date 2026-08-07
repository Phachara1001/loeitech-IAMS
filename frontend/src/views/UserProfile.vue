<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  User,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  LogOut,
  Package,
  AlertTriangle,
  FileText,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  UserCheck,
  Camera,
  X,
  Loader2
} from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const router = useRouter()
const toast = useToast()

// ==========================================
// 1. STATE & DATA (โหลดจาก backend จริงตอน mount)
// ==========================================
const currentUser = ref({
  id: '',
  username: '',
  name: '',
  position: '',
  email: '',
  phone: '',
  role: '',
  avatar: null
})

const isPageLoading = ref(true)
const isUploadingAvatar = ref(false)

// ตัวแปรอ้างอิงถึง <input type="file">
const fileInputRef = ref(null)

// รายการครุภัณฑ์ถือครอง
// TODO: ยังเป็น mock อยู่ เพราะยังไม่มี endpoint ดึง "ครุภัณฑ์ที่รับผิดชอบตาม user" จาก backend
// พอมี endpoint เช่น GET /api/assets/my-assets ค่อยเปลี่ยนมาดึงจริงตรงนี้
const myAssets = ref([
  {
    id: 'AST-69-0012',
    name: 'เครื่องคอมพิวเตอร์ประมวลผลสูง (All-in-One)',
    category: 'อุปกรณ์คอมพิวเตอร์',
    receivedDate: '2025-05-15',
    status: 'normal',
    serialNumber: 'SN-AIO-2025-9981'
  },
  {
    id: 'AST-68-0415',
    name: 'เครื่องพิมพ์เลเซอร์สี มัลติฟังก์ชัน',
    category: 'อุปกรณ์สำนักงาน',
    receivedDate: '2024-11-02',
    status: 'repair',
    serialNumber: 'SN-LPR-2024-1102'
  },
  {
    id: 'AST-67-0889',
    name: 'เก้าอี้ทำงานพนักพิงสูง ปรับระดับได้',
    category: 'ครุภัณฑ์สนาม/เครื่องเรือน',
    receivedDate: '2023-08-20',
    status: 'normal',
    serialNumber: 'SN-CHR-2023-0889'
  }
])

// ==========================================
// 2. MODAL STATES & FORMS
// ==========================================
const isLogoutModalOpen = ref(false)
const isEditProfileModalOpen = ref(false)
const isChangePasswordModalOpen = ref(false)
const isDetailModalOpen = ref(false)

const editProfileForm = ref({
  name: '',
  phone: '',
  position: ''
})
const isSavingProfile = ref(false)
const editProfileError = ref('')

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')
const isChangingPassword = ref(false)

const selectedAsset = ref(null)

// ==========================================
// 3. COMPUTED
// ==========================================
const totalAssets = computed(() => myAssets.value.length)
const normalAssets = computed(() => myAssets.value.filter(a => a.status === 'normal').length)
const repairAssets = computed(() => myAssets.value.filter(a => a.status === 'repair').length)

// ==========================================
// 4. API HELPERS
// ==========================================
function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

function extractErrorMessage(error) {
  const data = error.response?.data
  if (data?.errors?.length) return data.errors.join(' / ')
  if (data?.message) return data.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

// ถ้า token หมดอายุหรือไม่ถูกต้อง (401) ให้เด้งกลับไปหน้า login ทันที
function handleUnauthorized(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('tcaims_auth_token')
    localStorage.removeItem('tcaims_user')
    localStorage.removeItem('tcaims_role')
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
    router.push('/login')
    return true
  }
  return false
}

// แปลงข้อมูลจาก backend ให้เข้ากับโครงสร้างที่หน้านี้ใช้แสดงผล
function applyUserData(data) {
  currentUser.value = {
    id: data.id,
    username: data.username,
    name: data.name || data.username,
    position: data.position || 'ยังไม่ได้กำหนดตำแหน่ง',
    email: data.email,
    phone: data.phone || '-',
    role: data.role,
    avatar: data.avatarUrl || null
  }

  // เก็บแคชไว้ให้ส่วนอื่น (เช่น Topbar) แสดงชื่อ/รูปได้เร็วโดยไม่ต้องรอยิง API ใหม่
  persistUserToStorage()
}

// ==========================================
// 5. LIFECYCLE
// ==========================================
onMounted(async () => {
  isPageLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/users/me`, { headers: authHeaders() })
    applyUserData(response.data.data)
  } catch (error) {
    if (!handleUnauthorized(error)) {
      toast.error(extractErrorMessage(error))
    }
  } finally {
    isPageLoading.value = false
  }
})

// บันทึกข้อมูลผู้ใช้ล่าสุดลง localStorage เป็นแคช และแจ้งเตือนหน้าอื่น ๆ (เช่น Topbar) ให้อัปเดตทันที
// หมายเหตุ: ใช้เป็นแคชแสดงผลเร็ว ๆ เท่านั้น ข้อมูลจริงมาจาก backend เสมอ (ดึงใหม่ทุกครั้งที่เข้าหน้านี้)
function persistUserToStorage() {
  try {
    localStorage.setItem('tcaims_user', JSON.stringify({
      name: currentUser.value.name,
      email: currentUser.value.email,
      avatar: currentUser.value.avatar
    }))
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: currentUser.value }))
  } catch (err) {
    console.warn('LocalStorage Write Warning:', err)
  }
}

// ==========================================
// 6. HANDLERS
// ==========================================

// ฟังก์ชันเปิดตัวเลือกไฟล์เมื่อคลิกที่รูป
function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// อัปโหลดรูปโปรไฟล์จริงขึ้น backend (MinIO) แล้วอัปเดตรูปที่แสดงผลด้วย URL จริงที่ได้กลับมา
async function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    toast.error('ขนาดไฟล์ต้องไม่เกิน 3MB')
    return
  }

  const formData = new FormData()
  formData.append('avatar', file)

  isUploadingAvatar.value = true
  try {
    const response = await axios.post(`${API_BASE}/users/me/avatar`, formData, {
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
    })
    applyUserData(response.data.data)
    toast.success('เปลี่ยนรูปโปรไฟล์สำเร็จ')
  } catch (error) {
    if (!handleUnauthorized(error)) {
      toast.error(extractErrorMessage(error))
    }
  } finally {
    isUploadingAvatar.value = false
    event.target.value = '' // เคลียร์ input เผื่อเลือกไฟล์เดิมซ้ำได้อีกครั้ง
  }
}

function openLogoutModal() {
  isLogoutModalOpen.value = true
}

function confirmLogout() {
  try {
    localStorage.removeItem('tcaims_auth_token')
    localStorage.removeItem('tcaims_user')
    localStorage.removeItem('tcaims_role')
  } catch (e) {}

  isLogoutModalOpen.value = false
  window.location.href = '/login'
}

function openEditProfileModal() {
  editProfileError.value = ''
  editProfileForm.value = {
    name: currentUser.value.name,
    phone: currentUser.value.phone === '-' ? '' : currentUser.value.phone,
    position: currentUser.value.position === 'ยังไม่ได้กำหนดตำแหน่ง' ? '' : currentUser.value.position
  }
  isEditProfileModalOpen.value = true
}

async function handleSaveProfile() {
  editProfileError.value = ''

  if (!editProfileForm.value.name.trim()) {
    editProfileError.value = 'กรุณากรอกชื่อ-นามสกุล'
    return
  }

  isSavingProfile.value = true
  try {
    const response = await axios.put(
      `${API_BASE}/users/me`,
      {
        name: editProfileForm.value.name.trim(),
        phone: editProfileForm.value.phone.trim(),
        position: editProfileForm.value.position.trim()
      },
      { headers: authHeaders() }
    )
    applyUserData(response.data.data)
    toast.success('บันทึกข้อมูลโปรไฟล์สำเร็จ')
    isEditProfileModalOpen.value = false
  } catch (error) {
    if (!handleUnauthorized(error)) {
      const msg = extractErrorMessage(error)
      editProfileError.value = msg
      toast.error(msg)
    }
  } finally {
    isSavingProfile.value = false
  }
}

function openChangePasswordModal() {
  passwordError.value = ''
  passwordSuccess.value = ''
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  isChangePasswordModalOpen.value = true
}

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordError.value = 'กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน'
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'
    return
  }

  isChangingPassword.value = true
  try {
    await axios.put(
      `${API_BASE}/users/me/password`,
      {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
        confirmPassword: passwordForm.value.confirmPassword
      },
      { headers: authHeaders() }
    )
    toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
    passwordSuccess.value = 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว'
    setTimeout(() => {
      isChangePasswordModalOpen.value = false
    }, 800)
  } catch (error) {
    if (!handleUnauthorized(error)) {
      const msg = extractErrorMessage(error)
      passwordError.value = msg
      toast.error(msg)
    }
  } finally {
    isChangingPassword.value = false
  }
}

function openDetailModal(asset) {
  selectedAsset.value = asset
  isDetailModalOpen.value = true
}

function handlePrintPdf() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F7F5] font-sarabun p-4 sm:p-6 lg:p-8">
    <div class="w-full space-y-6">

      <!-- ================= Loading State ================= -->
      <div v-if="isPageLoading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 class="w-8 h-8 animate-spin mb-3 text-[#1B5E3C]" />
        <p class="text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>

      <template v-else>

      <!-- ================= 1. HEADER PROFILE ================= -->
      <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl">
        <!-- Background Mesh Gradient -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]"></div>
          <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]"></div>
          <div class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]"></div>
        </div>

        <div class="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            
            <!-- ================= ส่วนอัปโหลด/เปลี่ยนรูปโปรไฟล์ ================= -->
            <div
              class="relative group cursor-pointer"
              :class="{ 'pointer-events-none opacity-70': isUploadingAvatar }"
              @click="triggerFileInput"
              title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
            >
              <!-- Glow Effect -->
              <div class="absolute -inset-2 bg-gradient-to-r from-[#1B5E3C] via-[#288252] to-[#0F3D26] rounded-full blur-md opacity-80 animate-spin-slow"></div>
              
              <!-- Input File (Hidden) -->
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="handleAvatarChange" 
              />

              <!-- กรณีมีรูปภาพแล้ว -->
              <img 
                v-if="currentUser.avatar"
                :src="currentUser.avatar" 
                alt="โปรไฟล์ผู้ใช้" 
                class="relative w-24 h-24 rounded-full object-cover ring-4 ring-white/50 shadow-2xl bg-white"
              />

              <!-- กรณีไม่มีรูป (แสดงช่องว่าง + ไอคอนรูปภาพ) -->
              <div 
                v-else
                class="relative w-24 h-24 rounded-full ring-4 ring-white/50 shadow-2xl bg-emerald-950/80 border-2 border-dashed border-emerald-400/50 flex flex-col items-center justify-center text-emerald-300 hover:bg-emerald-900 transition"
              >
                <User class="w-8 h-8 opacity-70" />
                <span class="text-[10px] font-medium mt-1 opacity-90">เพิ่มรูปภาพ</span>
              </div>

              <!-- Overlay ตอนกำลังอัปโหลด -->
              <div v-if="isUploadingAvatar" class="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center z-20">
                <Loader2 class="w-6 h-6 text-emerald-300 animate-spin" />
              </div>

              <!-- Overlay ตอน Hover ว่า "เปลี่ยนรูป" -->
              <div v-else class="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-xs font-semibold backdrop-blur-[2px] z-20">
                <Camera class="w-5 h-5 mb-0.5 text-emerald-300" />
                <span>{{ currentUser.avatar ? 'เปลี่ยนรูป' : 'เลือกรูป' }}</span>
              </div>
            </div>
            <!-- ======================================================== -->

            <div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 class="text-2xl sm:text-3xl font-bold text-white">{{ currentUser.name }}</h1>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                  <ShieldCheck class="w-3.5 h-3.5 text-emerald-300" />
                  สิทธิ์: {{ currentUser.role }}
                </span>
              </div>
              <p class="text-emerald-100/90 text-base font-medium flex items-center justify-center sm:justify-start gap-2">
                <Building2 class="w-4 h-4 text-emerald-300 shrink-0" />
                {{ currentUser.position }}
              </p>
            </div>
          </div>

          <!-- ปุ่มแก้ไขโปรไฟล์ & ออกจากระบบ -->
          <div class="flex items-center gap-3 shrink-0">
            <button
              @click="openEditProfileModal"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition backdrop-blur-md shadow-sm"
            >
              <UserCheck class="w-4 h-4 text-emerald-300" />
              <span>แก้ไขโปรไฟล์</span>
            </button>

            <button
              @click="openLogoutModal"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-sm font-semibold transition backdrop-blur-md shadow-sm"
            >
              <LogOut class="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        <div class="relative z-10 bg-black/20 border-t border-white/10 px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-emerald-100/80">
          <div class="flex items-center gap-2">
            <Mail class="w-4 h-4 text-emerald-300 shrink-0" />
            <span>อีเมล: {{ currentUser.email }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Phone class="w-4 h-4 text-emerald-300 shrink-0" />
            <span>เบอร์โทรศัพท์: {{ currentUser.phone }}</span>
          </div>
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-emerald-300 shrink-0" />
            <span>ชื่อผู้ใช้งาน: {{ currentUser.username }}</span>
            
            <button 
              @click="openChangePasswordModal"
              title="เปลี่ยนรหัสผ่าน"
              class="ml-2 p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-400/30 text-emerald-200 hover:text-white border border-emerald-400/30 transition flex items-center gap-1 text-xs"
            >
              <KeyRound class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">เปลี่ยนรหัสผ่าน</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= 2. STATS ================= -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-500">ถือครองทั้งหมด</p>
            <p class="text-3xl font-bold text-[#072415] mt-1">{{ totalAssets }} <span class="text-sm font-normal text-slate-500">รายการ</span></p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center">
            <Package class="w-6 h-6" />
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-500">สถานะปกติ</p>
            <p class="text-3xl font-bold text-emerald-600 mt-1">{{ normalAssets }} <span class="text-sm font-normal text-slate-500">รายการ</span></p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="w-6 h-6" />
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-500">อยู่ระหว่างแจ้งชำรุด/ซ่อม</p>
            <p class="text-3xl font-bold text-amber-600 mt-1">{{ repairAssets }} <span class="text-sm font-normal text-slate-500">รายการ</span></p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- ================= 3. TABLE ================= -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 class="text-xl font-bold text-[#072415] flex items-center gap-2">
              <Package class="w-5 h-5 text-[#1B5E3C]" />
              รายการครุภัณฑ์ที่รับผิดชอบหลักในปัจจุบัน
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">เชื่อมโยงข้อมูลจากตาราง asset_distributions</p>
          </div>

          <button
            @click="handlePrintPdf"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition"
          >
            <Printer class="w-4 h-4 text-slate-500" />
            <span>พิมพ์ใบรับรองการครอบครอง</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                <th class="py-3.5 px-4">รหัสครุภัณฑ์ / ชื่อรายการ</th>
                <th class="py-3.5 px-4">หมวดหมู่</th>
                <th class="py-3.5 px-4">วันที่รับมอบ</th>
                <th class="py-3.5 px-4 text-center">สถานะ</th>
                <th class="py-3.5 px-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="asset in myAssets" :key="asset.id" class="hover:bg-slate-50/80 transition">
                <td class="py-4 px-4">
                  <p class="font-bold text-slate-800">{{ asset.name }}</p>
                  <p class="text-xs text-slate-500 font-mono mt-0.5">{{ asset.id }} · SN: {{ asset.serialNumber }}</p>
                </td>
                <td class="py-4 px-4 text-slate-600">{{ asset.category }}</td>
                <td class="py-4 px-4 text-slate-600 whitespace-nowrap">{{ asset.receivedDate }}</td>
                <td class="py-4 px-4 text-center whitespace-nowrap">
                  <span 
                    v-if="asset.status === 'normal'"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" /> ปกติ
                  </span>
                  <span 
                    v-else-if="asset.status === 'repair'"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                  >
                    <Clock class="w-3.5 h-3.5" /> แจ้งซ่อม/ชำรุด
                  </span>
                </td>
                <td class="py-4 px-4 text-right whitespace-nowrap">
                  <button
                    @click="openDetailModal(asset)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#1B5E3C] hover:text-[#072415] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    ดูข้อมูล
                  </button>
                </td>
              </tr>

              <tr v-if="myAssets.length === 0">
                <td colspan="5" class="py-12 text-center text-slate-400">
                  <Package class="w-10 h-10 mx-auto mb-2 opacity-40" />
                  ไม่พบรายการครุภัณฑ์ที่คุณถือครองในขณะนี้
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      </template>

    </div>

    <!-- MODAL LOGOUT -->
    <div v-if="isLogoutModalOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center relative">
        <div class="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <LogOut class="w-7 h-7" />
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">ยืนยันการออกจากระบบ</h3>
        <p class="text-sm text-slate-500 mb-6">คุณต้องการออกจากระบบใช่หรือไม่?</p>
        
        <div class="flex items-center gap-3">
          <button 
            @click="isLogoutModalOpen = false"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            ยกเลิก
          </button>
          <button 
            @click="confirmLogout"
            class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition shadow-md shadow-red-600/20"
          >
            ยืนยันออกจากระบบ
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CHANGE PASSWORD -->
    <div v-if="isChangePasswordModalOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 class="text-lg font-bold text-[#072415] flex items-center gap-2">
            <KeyRound class="w-5 h-5 text-[#1B5E3C]" />
            เปลี่ยนรหัสผ่านใหม่
          </h3>
          <button @click="isChangePasswordModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="passwordError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <XCircle class="w-4 h-4 shrink-0" />
          <span>{{ passwordError }}</span>
        </div>

        <div v-if="passwordSuccess" class="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ passwordSuccess }}</span>
        </div>

        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านปัจจุบัน</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                class="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
              />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Eye v-if="!showCurrentPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านใหม่</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                class="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
              />
              <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Eye v-if="!showNewPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                class="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button 
              type="button"
              @click="isChangePasswordModalOpen = false"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              :disabled="isChangingPassword"
              class="flex-1 py-2.5 rounded-xl bg-[#072415] hover:bg-[#0F3D26] text-white text-sm font-bold shadow-md transition disabled:opacity-70"
            >
              {{ isChangingPassword ? 'กำลังบันทึก...' : 'ยืนยันเปลี่ยนรหัส' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EDIT PROFILE -->
    <div v-if="isEditProfileModalOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 class="text-lg font-bold text-[#072415] flex items-center gap-2">
            <UserCheck class="w-5 h-5 text-[#1B5E3C]" />
            แก้ไขข้อมูลโปรไฟล์
          </h3>
          <button @click="isEditProfileModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="editProfileError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <XCircle class="w-4 h-4 shrink-0" />
          <span>{{ editProfileError }}</span>
        </div>

        <form @submit.prevent="handleSaveProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
            <input
              v-model="editProfileForm.name"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              v-model="editProfileForm.phone"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">ตำแหน่งงาน</label>
            <input
              v-model="editProfileForm.position"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]/20 focus:border-[#1B5E3C]"
            />
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button 
              type="button"
              @click="isEditProfileModalOpen = false"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              :disabled="isSavingProfile"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#072415] hover:bg-[#0F3D26] text-white text-sm font-bold shadow-md transition disabled:opacity-70"
            >
              <Loader2 v-if="isSavingProfile" class="w-4 h-4 animate-spin" />
              <span>{{ isSavingProfile ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DETAIL -->
    <div v-if="isDetailModalOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <h3 class="text-lg font-bold text-[#072415] mb-4 border-b border-slate-100 pb-2">รายละเอียดครุภัณฑ์</h3>
        
        <div v-if="selectedAsset" class="space-y-3 text-sm">
          <div>
            <p class="text-xs text-slate-400">ชื่อรายการ</p>
            <p class="font-bold text-slate-800 text-base">{{ selectedAsset.name }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-slate-400">รหัสครุภัณฑ์</p>
              <p class="font-mono text-slate-700">{{ selectedAsset.id }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Serial Number</p>
              <p class="font-mono text-slate-700">{{ selectedAsset.serialNumber }}</p>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400">หมวดหมู่</p>
            <p class="text-slate-700">{{ selectedAsset.category }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">วันที่ได้รับครอบครอง</p>
            <p class="text-slate-700">{{ selectedAsset.receivedDate }}</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button 
            @click="isDetailModalOpen = false"
            class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
          >
            ปิดหน้าต่าง
          </button>
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

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 16s linear infinite;
}
</style>