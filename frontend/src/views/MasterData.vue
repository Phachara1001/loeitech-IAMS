<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Building2, MapPin, Users, Plus, Pencil, Trash2, X, Check, Loader2,
  AlertTriangle, ShieldAlert, Search, ShieldCheck, UserCog, User as UserIcon, Ban, Clock
} from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const router = useRouter()
const toast = useToast()

// สิทธิ์การเข้าถึง: หน้านี้ใช้ได้เฉพาะ Admin เท่านั้น (เชื่อมกับระบบ login จริงแล้ว)
const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')
const isAdmin = computed(() => currentRole.value === 'admin')

const roleOptions = [
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'staff', label: 'เจ้าหน้าที่' },
  { value: 'user', label: 'ผู้ใช้งานทั่วไป' }
]
function roleLabel(value) {
  return roleOptions.find((r) => r.value === value)?.label || value
}
function roleBadgeStyle(value) {
  if (value === 'admin') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (value === 'staff') return 'bg-sky-50 text-sky-700 border-sky-100'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}
function roleIcon(value) {
  if (value === 'admin') return ShieldCheck
  if (value === 'staff') return UserCog
  return UserIcon
}
function roleIconColor(value) {
  if (value === 'admin') return 'text-emerald-600'
  if (value === 'staff') return 'text-sky-600'
  return 'text-slate-500'
}

// ==========================================
// API HELPERS
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

function handleUnauthorized(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('tcaims_auth_token')
    localStorage.removeItem('tcaims_user')
    localStorage.removeItem('tcaims_role')
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
    router.push('/login')
    return true
  }
  if (error.response?.status === 403) {
    toast.error('คุณไม่มีสิทธิ์ทำรายการนี้')
    return true
  }
  return false
}

/* ---------------- แท็บ: หน่วยงาน/ฝ่าย ---------------- */
const departments = ref([])
const isLoadingDepartments = ref(false)

async function fetchDepartments() {
  isLoadingDepartments.value = true
  try {
    const response = await axios.get(`${API_BASE}/departments`, { headers: authHeaders() })
    departments.value = response.data.data
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoadingDepartments.value = false
  }
}

/* ---------------- แท็บ: อาคารและห้องเรียน ---------------- */
const roomTypes = ['ห้องเรียน', 'ห้องปฏิบัติการ', 'ห้องสำนักงาน', 'ห้องเก็บพัสดุ']
const locations = ref([])
const isLoadingLocations = ref(false)

async function fetchLocations() {
  isLoadingLocations.value = true
  try {
    const response = await axios.get(`${API_BASE}/locations`, { headers: authHeaders() })
    // backend เก็บชื่อห้องเป็น field "name" แต่ฝั่งนี้ใช้ "room" เพื่อให้เข้ากับ UI เดิม
    locations.value = response.data.data.map((loc) => ({ ...loc, room: loc.name }))
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoadingLocations.value = false
  }
}

/* ---------------- แท็บ: ผู้ใช้งานระบบ ---------------- */
const users = ref([])
const isLoadingUsers = ref(false)

async function fetchUsers() {
  isLoadingUsers.value = true
  try {
    const response = await axios.get(`${API_BASE}/users`, { headers: authHeaders() })
    // backend เก็บ role เป็นตัวพิมพ์ใหญ่ (ADMIN/STAFF/USER) แปลงเป็นพิมพ์เล็กให้ตรงกับ UI เดิม
    users.value = response.data.data.map((u) => ({ ...u, role: String(u.role).toLowerCase() }))
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoadingUsers.value = false
  }
}

const userSearch = ref('')
const filteredUsers = computed(() =>
  users.value.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.value.toLowerCase())
  )
)

async function updateUserRole(user, newRole) {
  const previousRole = user.role
  user.role = newRole // อัปเดตหน้าจอทันที (optimistic) แล้วค่อยยืนยันกับ backend

  try {
    await axios.put(`${API_BASE}/users/${user.id}`, { role: newRole }, { headers: authHeaders() })
    toast.success(`เปลี่ยนสิทธิ์ของ ${user.name} เป็น "${roleLabel(newRole)}" สำเร็จ`)
  } catch (error) {
    user.role = previousRole // ย้อนกลับถ้า backend ปฏิเสธ
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  }
}

/* ---------------- อนุมัติ / ไม่อนุมัติ บัญชีที่สมัครเข้ามารออนุมัติ ---------------- */
const accountStatusLabel = { ACTIVE: 'ใช้งานได้', PENDING: 'รออนุมัติ', REJECTED: 'ไม่อนุมัติ' }
const accountStatusStyle = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100'
}
const pendingUsersCount = computed(() => users.value.filter((u) => u.accountStatus === 'PENDING').length)

const approvingUserId = ref(null)

async function approveUser(user) {
  approvingUserId.value = user.id
  try {
    await axios.patch(`${API_BASE}/users/${user.id}/approve`, {}, { headers: authHeaders() })
    user.accountStatus = 'ACTIVE'
    toast.success(`อนุมัติบัญชีของ ${user.name} เรียบร้อยแล้ว`)
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    approvingUserId.value = null
  }
}

async function rejectUser(user) {
  approvingUserId.value = user.id
  try {
    await axios.patch(`${API_BASE}/users/${user.id}/reject`, {}, { headers: authHeaders() })
    user.accountStatus = 'REJECTED'
    toast.info(`บันทึกการไม่อนุมัติบัญชีของ ${user.name} แล้ว`)
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    approvingUserId.value = null
  }
}

/* ---------------- โหลดข้อมูลทั้งหมดตอนเข้าหน้า ---------------- */
onMounted(() => {
  if (!isAdmin.value) return
  fetchDepartments()
  fetchLocations()
  fetchUsers()
})

/* ---------------- การจัดการแท็บ ---------------- */
const tabs = [
  { key: 'departments', label: 'หน่วยงาน/ฝ่าย', icon: Building2, color: 'text-[#065f46]', chip: 'bg-emerald-50 ring-emerald-100' },
  { key: 'locations', label: 'อาคารและห้องเรียน', icon: MapPin, color: 'text-amber-600', chip: 'bg-amber-50 ring-amber-100' },
  { key: 'users', label: 'ผู้ใช้งานระบบ', icon: Users, color: 'text-sky-600', chip: 'bg-sky-50 ring-sky-100' }
]
const activeTab = ref('departments')

/* ---------------- ป็อปอัปเลือกประเภทข้อมูลที่จะเพิ่ม ---------------- */
const isChooserOpen = ref(false)
function openAddChooser() {
  isChooserOpen.value = true
}
function closeAddChooser() {
  isChooserOpen.value = false
}
function chooseAddType(tabKey) {
  activeTab.value = tabKey
  isChooserOpen.value = false
  openAddForm()
}

/* ---------------- ฟอร์ม เพิ่ม/แก้ไข (ใช้ร่วมกันสำหรับหน่วยงาน/อาคาร-ห้อง/ผู้ใช้งาน) ---------------- */
const isFormOpen = ref(false)
const isEditMode = ref(false)
const isSaving = ref(false)
const formError = ref('')
const form = ref({})

function openAddForm() {
  isEditMode.value = false
  formError.value = ''
  if (activeTab.value === 'departments') form.value = { code: '', name: '' }
  else if (activeTab.value === 'locations') form.value = { building: '', room: '', type: roomTypes[0] }
  else form.value = { name: '', email: '', role: 'user' }
  isFormOpen.value = true
}

function openEditForm(item) {
  isEditMode.value = true
  formError.value = ''
  form.value = { ...item }
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function validateForm() {
  if (activeTab.value === 'departments') {
    if (!form.value.code?.trim() || !form.value.name?.trim()) return 'กรุณากรอกรหัสและชื่อหน่วยงาน/ฝ่ายให้ครบถ้วน'
  } else if (activeTab.value === 'locations') {
    if (!form.value.building?.trim() || !form.value.room?.trim()) return 'กรุณากรอกอาคารและห้องให้ครบถ้วน'
  } else {
    if (!form.value.name?.trim() || !form.value.email?.trim()) return 'กรุณากรอกชื่อและอีเมลให้ครบถ้วน'
  }
  return ''
}

async function saveForm() {
  const error = validateForm()
  if (error) {
    formError.value = error
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    if (activeTab.value === 'departments') {
      const payload = { code: form.value.code.trim(), name: form.value.name.trim() }
      if (isEditMode.value) {
        await axios.put(`${API_BASE}/departments/${form.value.id}`, payload, { headers: authHeaders() })
      } else {
        await axios.post(`${API_BASE}/departments`, payload, { headers: authHeaders() })
      }
      await fetchDepartments()
    } else if (activeTab.value === 'locations') {
      // ฝั่งนี้ใช้ "room" แต่ backend เก็บเป็น "name"
      const payload = { building: form.value.building.trim(), name: form.value.room.trim(), type: form.value.type }
      if (isEditMode.value) {
        await axios.put(`${API_BASE}/locations/${form.value.id}`, payload, { headers: authHeaders() })
      } else {
        await axios.post(`${API_BASE}/locations`, payload, { headers: authHeaders() })
      }
      await fetchLocations()
    } else {
      const payload = { name: form.value.name.trim(), email: form.value.email.trim(), role: form.value.role }
      if (isEditMode.value) {
        await axios.put(`${API_BASE}/users/${form.value.id}`, payload, { headers: authHeaders() })
      } else {
        await axios.post(`${API_BASE}/users`, payload, { headers: authHeaders() })
      }
      await fetchUsers()
    }

    toast.success(isEditMode.value ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ')
    if (!isEditMode.value && activeTab.value === 'users') {
      toast.info('ระบบได้ส่งอีเมลเชิญตั้งรหัสผ่านไปให้ผู้ใช้งานใหม่แล้ว')
    }
    isFormOpen.value = false
  } catch (error) {
    if (!handleUnauthorized(error)) {
      const msg = extractErrorMessage(error)
      formError.value = msg
      toast.error(msg)
    }
  } finally {
    isSaving.value = false
  }
}

/* ---------------- ลบรายการ ---------------- */
const itemToDelete = ref(null)
const isDeleting = ref(false)

function confirmDelete(item) {
  itemToDelete.value = item
}
function cancelDelete() {
  itemToDelete.value = null
}

async function deleteItem() {
  isDeleting.value = true
  try {
    if (activeTab.value === 'departments') {
      await axios.delete(`${API_BASE}/departments/${itemToDelete.value.id}`, { headers: authHeaders() })
      await fetchDepartments()
    } else if (activeTab.value === 'locations') {
      await axios.delete(`${API_BASE}/locations/${itemToDelete.value.id}`, { headers: authHeaders() })
      await fetchLocations()
    } else {
      await axios.delete(`${API_BASE}/users/${itemToDelete.value.id}`, { headers: authHeaders() })
      await fetchUsers()
    }
    toast.success('ลบข้อมูลสำเร็จ')
    itemToDelete.value = null
  } catch (error) {
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isDeleting.value = false
  }
}

const deleteItemLabel = computed(() => {
  if (!itemToDelete.value) return ''
  if (activeTab.value === 'departments') return itemToDelete.value.name
  if (activeTab.value === 'locations') return `${itemToDelete.value.building} - ${itemToDelete.value.room}`
  return itemToDelete.value.name
})
</script>

<template>
  <div class="p-6 lg:p-8 w-full">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <Building2 class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">จัดการข้อมูลพื้นฐานระบบ</h1>
          <p class="text-sm text-emerald-100/80 mt-0.5">หน่วยงาน/ฝ่าย, อาคารและห้องเรียน, และผู้ใช้งานระบบ</p>
        </div>
      </div>
    </div>

    <!-- กันสิทธิ์: เฉพาะ Admin เท่านั้น -->
    <div v-if="!isAdmin" class="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center text-center">
      <div class="w-14 h-14 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
        <ShieldAlert class="w-7 h-7 text-red-500" />
      </div>
      <h2 class="text-lg font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p class="text-sm text-slate-500 mt-1.5 max-w-sm">
        หน้าจัดการข้อมูลพื้นฐานระบบใช้ได้เฉพาะผู้ใช้งานระดับ "ผู้ดูแลระบบ" เท่านั้น
        กรุณาติดต่อผู้ดูแลระบบหากคุณจำเป็นต้องใช้งานส่วนนี้
      </p>
    </div>

    <template v-else>
      <!-- แท็บ: segmented control พร้อมไอคอนสี + ช่องค้นหา (เฉพาะแท็บผู้ใช้งาน) + ปุ่มเพิ่มข้อมูล -->
      <div class="flex items-center gap-2 bg-white rounded-2xl border border-emerald-100 shadow-sm p-2 mb-6 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0',
            activeTab === tab.key
              ? 'bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          ]"
        >
          <span
            :class="[
              'w-6 h-6 rounded-lg flex items-center justify-center ring-1 shrink-0',
              activeTab === tab.key ? 'bg-white/15 ring-white/20' : `${tab.chip} ring-1`
            ]"
          >
            <component :is="tab.icon" :class="['w-3.5 h-3.5', activeTab === tab.key ? 'text-white' : tab.color]" />
          </span>
          {{ tab.label }}
        </button>

        <!-- ช่องค้นหา: โผล่มาแทรกเฉพาะตอนอยู่แท็บผู้ใช้งานระบบ -->
        <div v-if="activeTab === 'users'" class="relative flex-1 min-w-[160px]">
          <Search class="w-4 h-4 text-[#065f46] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="userSearch"
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-emerald-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
          />
        </div>

        <button
          type="button"
          @click="openAddChooser"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0 ml-auto"
        >
          <Plus class="w-4 h-4" />
          เพิ่มข้อมูล
        </button>
      </div>

      <!-- ===== แท็บ: หน่วยงาน/ฝ่าย ===== -->
      <div v-if="activeTab === 'departments'" class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-emerald-50 bg-emerald-50/20">
          <p class="text-sm text-slate-500">ทั้งหมด <span class="font-bold text-[#065f46]">{{ departments.length }}</span> หน่วยงาน/ฝ่าย</p>
          <Loader2 v-if="isLoadingDepartments" class="w-4 h-4 text-[#065f46] animate-spin" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รหัส</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อหน่วยงาน/ฝ่าย</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="dept in departments" :key="dept.id" class="group hover:bg-emerald-50/60 transition-colors">
                <td class="px-4 py-3 text-slate-500 font-mono text-xs border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ dept.code }}</td>
                <td class="px-4 py-3 text-slate-800 font-medium">{{ dept.name }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1.5">
                    <button type="button" @click="openEditForm(dept)" title="แก้ไข" class="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button type="button" @click="confirmDelete(dept)" title="ลบ" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="departments.length === 0">
                <td colspan="3" class="px-4 py-12 text-center text-slate-400">ยังไม่มีข้อมูลหน่วยงาน/ฝ่าย</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== แท็บ: อาคารและห้องเรียน ===== -->
      <div v-else-if="activeTab === 'locations'" class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-emerald-50 bg-emerald-50/20">
          <p class="text-sm text-slate-500">ทั้งหมด <span class="font-bold text-[#065f46]">{{ locations.length }}</span> รายการ</p>
          <Loader2 v-if="isLoadingLocations" class="w-4 h-4 text-[#065f46] animate-spin" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">อาคาร</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ห้อง</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ประเภทห้อง</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="loc in locations" :key="loc.id" class="group hover:bg-emerald-50/60 transition-colors">
                <td class="px-4 py-3 text-slate-800 font-medium border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ loc.building }}</td>
                <td class="px-4 py-3 text-slate-600">{{ loc.room }}</td>
                <td class="px-4 py-3">
                  <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">{{ loc.type }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1.5">
                    <button type="button" @click="openEditForm(loc)" title="แก้ไข" class="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button type="button" @click="confirmDelete(loc)" title="ลบ" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="locations.length === 0">
                <td colspan="4" class="px-4 py-12 text-center text-slate-400">ยังไม่มีข้อมูลอาคาร/ห้อง</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== แท็บ: ผู้ใช้งานระบบ ===== -->
      <div v-else class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-emerald-50 bg-emerald-50/20">
          <div class="flex items-center gap-3">
            <p class="text-sm text-slate-500">ทั้งหมด <span class="font-bold text-[#065f46]">{{ filteredUsers.length }}</span> ผู้ใช้งาน</p>
            <span v-if="pendingUsersCount > 0" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              <Clock class="w-3 h-3" />
              รออนุมัติ {{ pendingUsersCount }} บัญชี
            </span>
          </div>
          <Loader2 v-if="isLoadingUsers" class="w-4 h-4 text-[#065f46] animate-spin" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อ-นามสกุล</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">อีเมล</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">สถานะบัญชี</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ระดับสิทธิ์</th>
                <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in filteredUsers" :key="user.id" class="group hover:bg-emerald-50/60 transition-colors">
                <td class="px-4 py-3 text-slate-800 font-medium border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ user.name }}</td>
                <td class="px-4 py-3 text-slate-500">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border', accountStatusStyle[user.accountStatus] || accountStatusStyle.ACTIVE]">
                    {{ accountStatusLabel[user.accountStatus] || user.accountStatus }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="relative inline-flex items-center">
                    <component :is="roleIcon(user.role)" class="w-3.5 h-3.5 absolute left-2.5 pointer-events-none z-10" :class="roleIconColor(user.role)" />
                    <select
                      :value="user.role"
                      @change="updateUserRole(user, $event.target.value)"
                      :class="['rounded-full border text-xs font-semibold pl-8 pr-7 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 appearance-none cursor-pointer transition-shadow hover:shadow-md', roleBadgeStyle(user.role)]"
                    >
                      <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                    </select>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1.5">
                    <template v-if="user.accountStatus === 'PENDING'">
                      <button
                        type="button"
                        :disabled="approvingUserId === user.id"
                        @click="approveUser(user)"
                        title="อนุมัติบัญชี"
                        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all disabled:opacity-60"
                      >
                        <Loader2 v-if="approvingUserId === user.id" class="w-3.5 h-3.5 animate-spin" />
                        <Check v-else class="w-3.5 h-3.5" />
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        :disabled="approvingUserId === user.id"
                        @click="rejectUser(user)"
                        title="ไม่อนุมัติ"
                        class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-60"
                      >
                        <Ban class="w-4 h-4" />
                      </button>
                    </template>
                    <button type="button" @click="openEditForm(user)" title="แก้ไข" class="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button type="button" @click="confirmDelete(user)" title="ลบ" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="px-4 py-12 text-center text-slate-400">ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal เลือกประเภทข้อมูลที่ต้องการเพิ่ม -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isChooserOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4"
        @click.self="closeAddChooser"
      >
        <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-900/5 w-full max-w-sm relative overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-[#065f46] via-emerald-400 to-[#065f46]"></div>
          <div class="p-6">
            <button type="button" @click="closeAddChooser" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all" aria-label="ปิด">
              <X class="w-4 h-4" />
            </button>

            <h3 class="text-lg font-bold text-slate-900 mb-1">คุณต้องการเพิ่มอะไร?</h3>
            <p class="text-sm text-slate-500 mb-5">เลือกประเภทข้อมูลที่ต้องการเพิ่มใหม่</p>

            <div class="space-y-2.5">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                @click="chooseAddType(tab.key)"
                class="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50/60 hover:shadow-md transition-all text-left group"
              >
                <span :class="['w-10 h-10 rounded-xl flex items-center justify-center ring-1 shrink-0 transition-transform group-hover:scale-110', tab.chip]">
                  <component :is="tab.icon" :class="['w-5 h-5', tab.color]" />
                </span>
                <span class="flex-1">
                  <span class="block text-sm font-semibold text-slate-800">{{ tab.label }}</span>
                  <span class="block text-xs text-slate-400 mt-0.5">
                    {{ tab.key === 'departments' ? 'เพิ่มหน่วยงานหรือฝ่ายใหม่' : tab.key === 'locations' ? 'เพิ่มอาคารหรือห้องใหม่' : 'เพิ่มผู้ใช้งานระบบใหม่' }}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal เพิ่ม/แก้ไข -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isFormOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4"
        @click.self="closeForm"
      >
        <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-900/5 w-full max-w-md relative overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-[#065f46] via-emerald-400 to-[#065f46]"></div>
          <div class="p-6">
          <button type="button" @click="closeForm" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all" aria-label="ปิด">
            <X class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
              <Pencil v-if="isEditMode" class="w-5 h-5" />
              <Plus v-else class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">
              {{ isEditMode ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่' }} ·
              {{ tabs.find((t) => t.key === activeTab)?.label }}
            </h3>
          </div>

          <div class="space-y-4">
            <!-- ฟอร์ม: หน่วยงาน/ฝ่าย -->
            <template v-if="activeTab === 'departments'">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">รหัสหน่วยงาน</label>
                <input v-model="form.code" type="text" placeholder="เช่น DPT-05" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ชื่อหน่วยงาน/ฝ่าย</label>
                <input v-model="form.name" type="text" placeholder="เช่น งานพัสดุ" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
            </template>

            <!-- ฟอร์ม: อาคารและห้องเรียน -->
            <template v-else-if="activeTab === 'locations'">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">อาคาร</label>
                <input v-model="form.building" type="text" placeholder="เช่น อาคาร 1" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ห้อง</label>
                <input v-model="form.room" type="text" placeholder="เช่น 101 หรือ คลังพัสดุกลาง" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ประเภทห้อง</label>
                <select v-model="form.type" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                  <option v-for="t in roomTypes" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
            </template>

            <!-- ฟอร์ม: ผู้ใช้งานระบบ -->
            <template v-else>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                <input v-model="form.name" type="text" placeholder="เช่น สมชาย ใจดี" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">อีเมล</label>
                <input v-model="form.email" type="email" placeholder="เช่น name@loeitc.ac.th" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ระดับสิทธิ์</label>
                <select v-model="form.role" class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition">
                  <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
            </template>

            <div v-if="formError" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
              <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-600">{{ formError }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button type="button" @click="closeForm" class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              ยกเลิก
            </button>
            <button
              type="button"
              :disabled="isSaving"
              @click="saveForm"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-[#065f46] to-[#047857] text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              บันทึก
            </button>
          </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal ยืนยันการลบ -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="itemToDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-red-900/5 w-full max-w-sm relative overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500"></div>
          <div class="p-6">
          <button type="button" @click="cancelDelete" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all" aria-label="ปิด">
            <X class="w-4 h-4" />
          </button>

          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
              <AlertTriangle class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-base font-semibold text-slate-900">ยืนยันการลบรายการ</h3>
            <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">
              ต้องการลบ "{{ deleteItemLabel }}" ใช่หรือไม่<br />การลบไม่สามารถย้อนกลับได้
            </p>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button type="button" @click="cancelDelete" class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              ยกเลิก
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="deleteItem"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              <span>{{ isDeleting ? 'กำลังลบ...' : 'ลบรายการ' }}</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>