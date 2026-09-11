<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertTriangle,
  Loader2,
  Printer
} from 'lucide-vue-next'
import ThaiDatePicker from '../components/ThaiDatePicker.vue'
import BaseModal from '../components/BaseModal.vue'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'
import PrintAssetListTemplate from '../components/PrintAssetListTemplate.vue'

const router = useRouter()
const toast = useToast()

// สิทธิ์การเข้าถึง: ดูข้อมูลได้ทุก role / แก้ไขสถานะ, อัปโหลดรูป, แก้ไขข้อมูล, ลบ ได้เฉพาะ Admin, Staff
const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')
const canManage = computed(() => ['admin', 'staff'].includes(currentRole.value))
const isAdmin = computed(() => currentRole.value === 'admin')

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
  return false
}

const assets = ref([])
const isLoading = ref(true)

const fetchAssets = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/assets`, { headers: authHeaders() })
    assets.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching assets:', error)
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAssets()
})

const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('name') // name, unitPrice
const sortOrder = ref('asc') // asc, desc

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const filteredAssets = computed(() => {
  let result = assets.value.filter(asset => {
    const matchesSearch = (asset.name || '').includes(searchQuery.value) ||
      (asset.seq || '').includes(searchQuery.value) ||
      (asset.referenceCode || '').includes(searchQuery.value) ||
      (asset.serialNumber || '').includes(searchQuery.value)

    const matchesStatus = statusFilter.value === '' || asset.status === statusFilter.value

    return matchesSearch && matchesStatus
  })

  // Sorting
  result.sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '')
    } else if (sortBy.value === 'unitPrice') {
      comparison = (a.unitPrice || 0) - (b.unitPrice || 0)
    }
    
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

const getStatusBadge = (status) => {
  switch (status) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Repaired': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Broken': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Scrapped': return 'bg-rose-100 text-rose-800 border-rose-300'
    default: return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'Active': return 'ใช้งานปกติ'
    case 'Repaired': return 'ส่งซ่อม'
    case 'Broken': return 'ชำรุด'
    case 'Scrapped': return 'แทงจำหน่าย'
    default: return status
  }
}

const formatThaiDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Modals State
const showImageModal = ref(false)
const showStatusModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedAsset = ref(null)
const tempStatus = ref('')
const tempAsset = ref({
  seq: '', name: '', category: '', referenceCode: '', serialNumber: '', department: '',
  brand: '', acquiredDate: '', acquisitionMethod: '', budgetType: '', unitPrice: 0, specifications: '', remark: ''
})

const openImageModal = (asset) => {
  selectedAsset.value = asset
  showImageModal.value = true
}

const openStatusModal = (asset) => {
  selectedAsset.value = asset
  tempStatus.value = asset.status
  showStatusModal.value = true
}

const saveStatus = async () => {
  if (selectedAsset.value) {
    try {
      // Prepare full update data to pass backend validation
      const { id, createdAt, updatedAt, ...updateData } = selectedAsset.value
      updateData.status = tempStatus.value

      await axios.put(`${API_BASE}/assets/${selectedAsset.value.id}`, updateData, { headers: authHeaders() })
      selectedAsset.value.status = tempStatus.value
      showStatusModal.value = false
      toast.success('เปลี่ยนสถานะครุภัณฑ์สำเร็จ')
    } catch (error) {
      console.error('Error updating status:', error)
      if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
    }
  }
}

// Image Upload State
const fileInput = ref(null)
const isUploadingImage = ref(false)

const triggerFileUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !selectedAsset.value) return

  isUploadingImage.value = true
  try {
    const uploadData = new FormData()
    uploadData.append('image', file)

    // Upload to MinIO
    const uploadResponse = await axios.post(`${API_BASE}/assets/upload`, uploadData, {
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
    })

    const imageUrl = uploadResponse.data.data.imageUrl

    // Prepare full update data to pass backend validation
    const { id, createdAt, updatedAt, ...updateData } = selectedAsset.value
    updateData.image = imageUrl

    // Update the asset in database
    await axios.put(`${API_BASE}/assets/${selectedAsset.value.id}`, updateData, { headers: authHeaders() })

    // Update local state
    selectedAsset.value.image = imageUrl

    // Refresh main list to show new image thumbnail
    await fetchAssets()
    toast.success('เปลี่ยนรูปภาพสำเร็จ')
  } catch (error) {
    console.error('Error uploading image:', error)
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isUploadingImage.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const openEditModal = (asset) => {
  selectedAsset.value = asset

  // Format date for input type="datetime-local"
  let formattedDate = ''
  if (asset.acquiredDate) {
    const d = new Date(asset.acquiredDate)
    formattedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
  }

  tempAsset.value = { ...asset, acquiredDate: formattedDate }
  showEditModal.value = true
}

const saveEdit = async () => {
  try {
    const { id, createdAt, updatedAt, ...updateData } = tempAsset.value
    if (updateData.acquiredDate) {
      updateData.acquiredDate = new Date(updateData.acquiredDate).toISOString()
    }
    await axios.put(`${API_BASE}/assets/${selectedAsset.value.id}`, updateData, { headers: authHeaders() })

    // Refresh list
    await fetchAssets()
    showEditModal.value = false
    toast.success('แก้ไขข้อมูลครุภัณฑ์สำเร็จ')
  } catch (error) {
    console.error('Error updating asset:', error)
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  }
}

const openDeleteModal = (asset) => {
  selectedAsset.value = asset
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    await axios.delete(`${API_BASE}/assets/${selectedAsset.value.id}`, { headers: authHeaders() })
    assets.value = assets.value.filter(a => a.id !== selectedAsset.value.id)
    showDeleteModal.value = false
    toast.success('ลบข้อมูลครุภัณฑ์สำเร็จ')
  } catch (error) {
    console.error('Error deleting asset:', error)
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  }
}

const isExporting = ref(false)

const handleExport = async () => {
  isExporting.value = true
  try {
    const response = await axios.post(
      `${API_BASE}/reports/export`,
      {
        reportKeys: ['asset_register'],
        format: 'excel',
        filters: {}
      },
      { responseType: 'blob', headers: authHeaders() }
    )

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `asset-list-${Date.now()}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)

    toast.success('ส่งออก Excel สำเร็จ')
  } catch (error) {
    console.error('Export error:', error)
    if (!handleUnauthorized(error)) toast.error('ไม่สามารถส่งออกข้อมูลได้')
  } finally {
    isExporting.value = false
  }
}

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="print:hidden space-y-6 relative">
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl">
      </div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl">
      </div>

      <div class="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
            <ImageIcon class="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-white">บัญชีคุมเลขครุภัณฑ์</h2>
            <p class="text-sm text-emerald-100/80 mt-0.5">จัดการทะเบียนครุภัณฑ์รายชิ้น รูปภาพ และปรับปรุงสถานะ</p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="handlePrint"
            class="px-4 py-2.5 bg-white/10 backdrop-blur-sm ring-1 ring-white/20 rounded-xl text-white hover:bg-white/20 font-semibold flex items-center transition-all shadow-sm">
            <Printer class="w-4 h-4 mr-2 text-emerald-200" /> พิมพ์รายงาน PDF
          </button>
          <button @click="handleExport" :disabled="isExporting"
            class="px-4 py-2.5 bg-white/10 backdrop-blur-sm ring-1 ring-white/20 rounded-xl text-white hover:bg-white/20 font-semibold flex items-center transition-all shadow-sm disabled:opacity-50">
            <Loader2 v-if="isExporting" class="w-4 h-4 mr-2 animate-spin text-emerald-200" />
            <Download v-else class="w-4 h-4 mr-2 text-emerald-200" />
            {{ isExporting ? 'กำลังส่งออก...' : 'พิมพ์เอกสาร Excel' }}
          </button>
          <button v-if="canManage" @click="router.push('/new-asset')"
            class="px-4 py-2.5 bg-white text-[#065f46] rounded-xl hover:bg-emerald-50 font-bold flex items-center shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus class="w-4 h-4 mr-2" /> เพิ่มครุภัณฑ์
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-emerald-50 bg-emerald-50/20 flex flex-col xl:flex-row justify-between gap-4">
        <!-- Search -->
        <div class="relative w-full xl:w-72 shrink-0">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อ, เลขลำดับ, ทะเบียน..."
            class="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] text-slate-900" />
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto xl:justify-end">
          <!-- Status Filter -->
          <div class="relative w-full sm:w-40 shrink-0">
            <select v-model="statusFilter"
              class="w-full appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
              <option value="">ทุกสถานะ</option>
              <option value="Active">ใช้งานปกติ</option>
              <option value="Repaired">ส่งซ่อม</option>
              <option value="Broken">ชำรุด</option>
              <option value="Scrapped">แทงจำหน่าย</option>
            </select>
            <Filter class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <!-- Sort By -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative w-full sm:w-40 shrink-0">
              <select v-model="sortBy"
                class="w-full appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
                <option value="name">เรียงตามชื่อ</option>
                <option value="unitPrice">เรียงตามราคา</option>
              </select>
              <Filter class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <!-- Sort Order Button -->
            <button
              @click="toggleSortOrder"
              class="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0 w-11"
              :title="sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'"
            >
              <svg v-if="sortOrder === 'asc'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h4"/><path d="M11 8h7"/><path d="M11 12h10"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto max-h-[65vh] overflow-y-auto no-scrollbar">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
              <th class="px-6 py-3.5 text-center font-semibold text-[11px] uppercase tracking-wide text-emerald-50">
                รูปภาพ</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">เลขลำดับครุภัณฑ์
              </th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อพัสดุ /
                เลขพัสดุหลัก</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ข้อมูลจัดซื้อ
              </th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">แผนก/หน่วยงาน
              </th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">สถานะ</th>
              <th class="px-6 py-3.5 text-center font-semibold text-[11px] uppercase tracking-wide text-emerald-50">
                จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="asset in filteredAssets" :key="asset.id" class="group hover:bg-emerald-50/60 transition-colors">
              <td
                class="px-6 py-4 text-center border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">
                <button @click="openImageModal(asset)"
                  class="w-12 h-12 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-100 hover:ring-2 hover:ring-[#065f46]/50 hover:shadow-md transition-all mx-auto group/img"
                  :title="asset.image ? 'ดูรูปภาพ' : 'เพิ่มรูปภาพ'">
                  <img v-if="asset.image" :src="asset.image" class="w-full h-full object-cover" />
                  <ImageIcon v-else class="w-5 h-5 text-slate-400 group-hover/img:text-[#065f46]" />
                </button>
              </td>
              <td class="px-6 py-4">
                <span class="font-medium text-slate-700">{{ asset.seq }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ asset.name }}</div>
                <div class="text-xs text-slate-500 mt-0.5" v-if="asset.brand">ยี่ห้อ: {{ asset.brand }}</div>
                <div class="text-xs text-slate-500 mt-0.5">{{ asset.referenceCode }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-800">฿{{ asset.unitPrice?.toLocaleString() || '-' }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ formatThaiDate(asset.acquiredDate) }} ({{
                  asset.budgetType }})</div>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ asset.department }}</td>
              <td class="px-6 py-4">
                <button v-if="canManage" @click="openStatusModal(asset)"
                  :class="['px-2.5 py-1 text-xs font-medium rounded-full border hover:shadow-md transition-shadow cursor-pointer flex items-center', getStatusBadge(asset.status)]"
                  title="คลิกเพื่อเปลี่ยนสถานะ">
                  {{ getStatusText(asset.status) }}
                  <Edit class="w-3 h-3 ml-1 opacity-50" />
                </button>
                <span v-else
                  :class="['px-2.5 py-1 text-xs font-medium rounded-full border inline-flex items-center', getStatusBadge(asset.status)]">
                  {{ getStatusText(asset.status) }}
                </span>
              </td>
              <td v-if="canManage" class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-1.5">
                  <button @click="openEditModal(asset)"
                    class="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title="แก้ไขข้อมูล">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="openDeleteModal(asset)"
                    class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title="ลบ">
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title="เมนูเพิ่มเติม">
                    <MoreVertical class="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td v-else class="px-6 py-4 text-center text-slate-300 text-xs">
                ดูอย่างเดียว
              </td>
            </tr>
            <tr v-if="filteredAssets.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                <div v-if="isLoading" class="flex flex-col items-center justify-center space-y-3">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065f46]"></div>
                  <span>กำลังดึงข้อมูลครุภัณฑ์...</span>
                </div>
                <span v-else>ไม่พบข้อมูลที่ค้นหา หรือยังไม่มีข้อมูลในระบบ</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="p-4 border-t border-emerald-50 bg-white flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
        <div class="mb-4 sm:mb-0">
          แสดง {{ filteredAssets.length > 0 ? 1 : 0 }} ถึง {{ filteredAssets.length }} จาก {{ assets.length }} รายการ
        </div>
        <div class="flex items-center space-x-1">
          <button class="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed"
            disabled>ก่อนหน้า</button>
          <button
            class="px-3 py-1.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#065f46] to-[#047857] shadow-sm">1</button>
          <button
            class="px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg text-slate-700 transition-colors">2</button>
          <button
            class="px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg text-slate-700 transition-colors">ถัดไป</button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <BaseModal v-model="showImageModal" title="รูปภาพครุภัณฑ์" maxWidth="max-w-lg">
      <div class="mb-4">
        <div class="text-sm font-medium text-slate-700">{{ selectedAsset?.name }}</div>
        <div class="text-xs text-slate-500">เลขลำดับ: {{ selectedAsset?.seq }}</div>
      </div>

      <div v-if="selectedAsset?.image"
        class="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative group">
        <img :src="selectedAsset.image" class="max-w-full max-h-64 object-contain" />
        <div v-if="isUploadingImage"
          class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065f46]"></div>
        </div>
      </div>

      <div v-else-if="isAdmin" @click="triggerFileUpload"
        class="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors cursor-pointer group relative">
        <div v-if="isUploadingImage"
          class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065f46]"></div>
        </div>
        <UploadCloud class="w-10 h-10 text-slate-400 group-hover:text-[#065f46] mb-3" />
        <p class="text-sm font-medium text-slate-700">คลิกเพื่ออัปโหลดไฟล์รูปภาพ</p>
        <p class="text-xs text-slate-500 mt-1">บันทึกผ่าน MinIO Storage (JPG, PNG)</p>
      </div>

      <div v-else
        class="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50">
        <ImageIcon class="w-10 h-10 text-slate-400 mb-3" />
        <p class="text-sm font-medium text-slate-500">ยังไม่มีรูปภาพครุภัณฑ์</p>
      </div>

      <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageUpload" />

      <template #footer>
        <button @click="showImageModal = false"
          class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
          ปิด
        </button>
        <button v-if="selectedAsset?.image && isAdmin" @click="triggerFileUpload" :disabled="isUploadingImage"
          class="px-4 py-2 bg-gradient-to-r from-[#065f46] to-[#047857] text-white rounded-lg font-semibold text-sm flex items-center shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <UploadCloud class="w-4 h-4 mr-2" /> {{ isUploadingImage ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปภาพ' }}
        </button>
      </template>
    </BaseModal>

    <!-- Status Modal -->
    <BaseModal v-model="showStatusModal" title="ปรับปรุงสถานะครุภัณฑ์" maxWidth="max-w-sm">
      <div class="space-y-4">
        <div>
          <div class="text-sm font-medium text-slate-700">{{ selectedAsset?.name }}</div>
          <div class="text-xs text-slate-500">เลขลำดับ: {{ selectedAsset?.seq }}</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">เลือกสถานะใหม่</label>
          <select v-model="tempStatus"
            class="w-full border border-slate-300 rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
            <option value="Active">ใช้งานปกติ</option>
            <option value="Repaired">ส่งซ่อม</option>
            <option value="Broken">ชำรุด</option>
            <option value="Scrapped">แทงจำหน่าย</option>
          </select>
        </div>
      </div>

      <template #footer>
        <button @click="showStatusModal = false"
          class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
          ยกเลิก
        </button>
        <button @click="saveStatus"
          class="px-4 py-2 bg-gradient-to-r from-[#065f46] to-[#047857] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">
          บันทึกสถานะ
        </button>
      </template>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal v-model="showEditModal" title="แก้ไขข้อมูลครุภัณฑ์" maxWidth="max-w-3xl">
      <div class="space-y-4 max-h-[70vh] overflow-y-auto px-2 no-scrollbar">
        <!-- ข้อมูลทั่วไป -->
        <h3 class="font-bold text-slate-800 text-sm border-b pb-1">1. ข้อมูลทั่วไป</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เลขลำดับครุภัณฑ์</label>
            <input v-model="tempAsset.seq" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อพัสดุ</label>
            <input v-model="tempAsset.name" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่/ประเภท</label>
            <select v-model="tempAsset.category"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
              <option value="ครุภัณฑ์สำนักงาน">ครุภัณฑ์สำนักงาน</option>
              <option value="ครุภัณฑ์การศึกษา">ครุภัณฑ์การศึกษา</option>
              <option value="ครุภัณฑ์ยานพาหนะและขนส่ง">ครุภัณฑ์ยานพาหนะและขนส่ง</option>
              <option value="ครุภัณฑ์คอมพิวเตอร์">ครุภัณฑ์คอมพิวเตอร์</option>
              <option value="ครุภัณฑ์งานบ้านงานครัว">ครุภัณฑ์งานบ้านงานครัว</option>
              <option value="ครุภัณฑ์ก่อสร้าง">ครุภัณฑ์ก่อสร้าง</option>
            </select>
          </div>
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">แผนก/หน่วยงานครอบครอง</label>
            <input v-model="tempAsset.department" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
        </div>

        <!-- ข้อมูลจำเพาะ -->
        <h3 class="font-bold text-slate-800 text-sm border-b pb-1 mt-4">2. ข้อมูลจำเพาะ</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ/รุ่น</label>
            <input v-model="tempAsset.brand" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เลขทะเบียน/Serial</label>
            <input v-model="tempAsset.serialNumber" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">คุณสมบัติ/สเปค</label>
            <textarea v-model="tempAsset.specifications" rows="2"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]"></textarea>
          </div>
        </div>

        <!-- ข้อมูลจัดซื้อและแหล่งเงิน -->
        <h3 class="font-bold text-slate-800 text-sm border-b pb-1 mt-4">3. ข้อมูลจัดซื้อและแหล่งเงิน</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">วันที่ได้มา</label>
            <ThaiDatePicker v-model="tempAsset.acquiredDate" type="datetime-local"
              inputClass="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] bg-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">วิธีการได้มา</label>
            <select v-model="tempAsset.acquisitionMethod"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
              <option value="ตกลงราคา">ตกลงราคา</option>
              <option value="สอบราคา">สอบราคา</option>
              <option value="ประกวดราคา">ประกวดราคา</option>
              <option value="งบประมาณ">งบประมาณ</option>
              <option value="บำรุงการศึกษา">บำรุงการศึกษา</option>
              <option value="ประกวดราคา e-bidding">ประกวดราคา e-bidding</option>
              <option value="วิธีเฉพาะเจาะจง">วิธีเฉพาะเจาะจง</option>
              <option value="รับบริจาค / รับมอบ">รับบริจาค / รับมอบ</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">แหล่งเงิน</label>
            <select v-model="tempAsset.budgetType"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
              <option value="เงินงบประมาณ">เงินงบประมาณ</option>
              <option value="เงินนอกงบประมาณ">เงินนอกงบประมาณ</option>
              <option value="เงินรายได้สถานศึกษา">เงินรายได้สถานศึกษา</option>
              <option value="เงินบริจาค">เงินบริจาค</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
            <input v-model="tempAsset.unitPrice" type="number"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div class="sm:col-span-2 lg:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">หมายเลขพัสดุหลัก / รหัสอ้างอิง</label>
            <input v-model="tempAsset.referenceCode" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
        </div>

        <!-- เพิ่มเติม -->
        <h3 class="font-bold text-slate-800 text-sm border-b pb-1 mt-4">4. เพิ่มเติม</h3>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
          <textarea v-model="tempAsset.remark" rows="2"
            class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]"></textarea>
        </div>
      </div>

      <template #footer>
        <button @click="showEditModal = false"
          class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
          ยกเลิก
        </button>
        <button @click="saveEdit"
          class="px-4 py-2 bg-gradient-to-r from-[#065f46] to-[#047857] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">
          บันทึกการแก้ไข
        </button>
      </template>
    </BaseModal>

    <!-- Delete Modal -->
    <BaseModal v-model="showDeleteModal" title="ยืนยันการลบข้อมูล" maxWidth="max-w-sm">
      <div class="py-4 text-center">
        <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 class="w-6 h-6 text-rose-600" />
        </div>
        <h4 class="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบ?</h4>
        <p class="text-slate-500 text-sm">
          คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{{ selectedAsset?.name }}</strong>?<br>
          <span class="text-rose-500 text-xs mt-1 block">การกระทำนี้ไม่สามารถกู้คืนได้</span>
        </p>
      </div>

      <template #footer>
        <button @click="showDeleteModal = false"
          class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
          ยกเลิก
        </button>
        <button @click="confirmDelete"
          class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm flex justify-center items-center">
          <Trash2 class="w-4 h-4 mr-2" /> ลบข้อมูล
        </button>
      </template>
    </BaseModal>
  </div>

  <!-- Print Template Container -->
  <div class="hidden print:block">
    <PrintAssetListTemplate :assets="filteredAssets" />
  </div>
</template>

<style>
/* ใช้กับกล่องตารางที่เลื่อนภายในตัวเอง (เช่นตอนข้อมูลเยอะ) ให้เลื่อนได้ปกติแต่ไม่โชว์แถบเลื่อน */
.no-scrollbar {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE / Edge เก่า */
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Edge (Chromium) */
}
</style>