<script setup>
import { ref, computed } from 'vue'
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
  X
} from 'lucide-vue-next'
import BaseModal from '../components/BaseModal.vue'

// Mock Data
const assets = ref([
  { id: 1, seq: '561-001', name: 'รถยนต์โดยสารตู้ 15 ที่นั่ง', code: '2310-004-0002', serial: 'กข-9146', status: 'Active', department: 'ช่างยนต์', image: null },
  { id: 2, seq: '561-002', name: 'เครื่องกลึงยันศูนย์', code: '3320-015-0012', serial: 'LATHE-2023-01', status: 'Repaired', department: 'ช่างกลโรงงาน', image: 'https://placehold.co/400x300/e2e8f0/475569?text=LATHE' },
  { id: 3, seq: '561-003', name: 'คอมพิวเตอร์ประมวลผลสูง', code: '7420-001-0045', serial: 'DELL-P-9901', status: 'Active', department: 'เทคโนโลยีสารสนเทศ', image: null },
  { id: 4, seq: '561-004', name: 'เครื่องปรับอากาศ 24,000 BTU', code: '4120-010-0089', serial: 'AC-SAMS-002', status: 'Active', department: 'ห้องสมุด', image: null },
  { id: 5, seq: '561-005', name: 'โปรเจคเตอร์แบบโต้ตอบ', code: '7410-005-0021', serial: 'EPSON-INT-04', status: 'Broken', department: 'ช่างไฟฟ้า', image: null },
  { id: 6, seq: '561-006', name: 'เครื่องพิมพ์ 3 มิติ', code: '7420-025-0003', serial: '3DP-CREALITY-01', status: 'Active', department: 'ช่างกลโรงงาน', image: null },
  { id: 7, seq: '561-007', name: 'โต๊ะปฏิบัติการอิเล็กทรอนิกส์', code: '7110-010-0044', serial: 'TB-ELEC-11', status: 'Active', department: 'ช่างอิเล็กทรอนิกส์', image: null },
  { id: 8, seq: '561-008', name: 'เครื่องเชื่อมไฟฟ้า (TIG)', code: '3439-005-0018', serial: 'WELD-TIG-005', status: 'Repaired', department: 'ช่างเชื่อมโลหะ', image: null },
])

const searchQuery = ref('')
const statusFilter = ref('')

const filteredAssets = computed(() => {
  return assets.value.filter(asset => {
    const matchesSearch = asset.name.includes(searchQuery.value) ||
      asset.seq.includes(searchQuery.value) ||
      asset.code.includes(searchQuery.value) ||
      asset.serial.includes(searchQuery.value)

    const matchesStatus = statusFilter.value === '' || asset.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
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

// Modals State
const showImageModal = ref(false)
const showStatusModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedAsset = ref(null)
const tempStatus = ref('')
const tempAsset = ref({})

const openImageModal = (asset) => {
  selectedAsset.value = asset
  showImageModal.value = true
}

const openStatusModal = (asset) => {
  selectedAsset.value = asset
  tempStatus.value = asset.status
  showStatusModal.value = true
}

const saveStatus = () => {
  if (selectedAsset.value) {
    selectedAsset.value.status = tempStatus.value
  }
  showStatusModal.value = false
}

const openEditModal = (asset) => {
  selectedAsset.value = asset
  tempAsset.value = { ...asset }
  showEditModal.value = true
}

const saveEdit = () => {
  const index = assets.value.findIndex(a => a.id === selectedAsset.value.id)
  if (index !== -1) {
    assets.value[index] = { ...tempAsset.value }
  }
  showEditModal.value = false
}

const openDeleteModal = (asset) => {
  selectedAsset.value = asset
  showDeleteModal.value = true
}

const confirmDelete = () => {
  assets.value = assets.value.filter(a => a.id !== selectedAsset.value.id)
  showDeleteModal.value = false
}
</script>

<template>
  <div class="space-y-6 relative">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
            <ImageIcon class="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-white">บัญชีคุมเลขครุภัณฑ์</h2>
            <p class="text-sm text-emerald-100/80 mt-0.5">จัดการทะเบียนครุภัณฑ์รายชิ้น รูปภาพ และปรับปรุงสถานะ</p>
          </div>
        </div>
        <div class="flex space-x-3 shrink-0">
          <button
            class="px-4 py-2.5 bg-white/10 backdrop-blur-sm ring-1 ring-white/20 rounded-xl text-white hover:bg-white/20 font-semibold flex items-center transition-all shadow-sm">
            <Download class="w-4 h-4 mr-2 text-emerald-200" /> ส่งออก Excel
          </button>
          <button
            class="px-4 py-2.5 bg-white text-[#065f46] rounded-xl hover:bg-emerald-50 font-bold flex items-center shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus class="w-4 h-4 mr-2" /> เพิ่มครุภัณฑ์
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-emerald-50 bg-emerald-50/20 flex flex-col sm:flex-row justify-between gap-4">
        <div class="relative w-full sm:w-72">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อ, เลขลำดับ, ทะเบียน..."
            class="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] text-slate-900" />
        </div>

        <div class="flex items-center space-x-3">
          <div class="relative">
            <select v-model="statusFilter"
              class="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
              <option value="">ทุกสถานะ</option>
              <option value="Active">ใช้งานปกติ</option>
              <option value="Repaired">ส่งซ่อม</option>
              <option value="Broken">ชำรุด</option>
              <option value="Scrapped">แทงจำหน่าย</option>
            </select>
            <Filter class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto max-h-[65vh] overflow-y-auto no-scrollbar">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
              <th class="px-6 py-3.5 text-center font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รูปภาพ</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">เลขลำดับครุภัณฑ์</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อพัสดุ / เลขพัสดุหลัก</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">เลขทะเบียน/Serial</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">แผนก/หน่วยงาน</th>
              <th class="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">สถานะ</th>
              <th class="px-6 py-3.5 text-center font-semibold text-[11px] uppercase tracking-wide text-emerald-50">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="asset in filteredAssets" :key="asset.id" class="group hover:bg-emerald-50/60 transition-colors">
              <td class="px-6 py-4 text-center border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">
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
                <div class="text-xs text-slate-500 mt-0.5">{{ asset.code }}</div>
              </td>
              <td class="px-6 py-4 text-slate-500">{{ asset.serial }}</td>
              <td class="px-6 py-4 text-slate-600">{{ asset.department }}</td>
              <td class="px-6 py-4">
                <button @click="openStatusModal(asset)"
                  :class="['px-2.5 py-1 text-xs font-medium rounded-full border hover:shadow-md transition-shadow cursor-pointer flex items-center', getStatusBadge(asset.status)]"
                  title="คลิกเพื่อเปลี่ยนสถานะ">
                  {{ getStatusText(asset.status) }}
                  <Edit class="w-3 h-3 ml-1 opacity-50" />
                </button>
              </td>
              <td class="px-6 py-4 text-center">
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
                  <button class="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title="เมนูเพิ่มเติม">
                    <MoreVertical class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAssets.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                ไม่พบข้อมูลที่ค้นหา
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
          <button class="px-3 py-1.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#065f46] to-[#047857] shadow-sm">1</button>
          <button class="px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg text-slate-700 transition-colors">2</button>
          <button class="px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg text-slate-700 transition-colors">ถัดไป</button>
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
        class="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
        <img :src="selectedAsset.image" class="max-w-full max-h-64 object-contain" />
      </div>

      <div v-else
        class="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors cursor-pointer group">
        <UploadCloud class="w-10 h-10 text-slate-400 group-hover:text-[#065f46] mb-3" />
        <p class="text-sm font-medium text-slate-700">คลิกเพื่ออัปโหลดไฟล์รูปภาพ</p>
        <p class="text-xs text-slate-500 mt-1">บันทึกผ่าน MinIO Storage (JPG, PNG)</p>
      </div>

      <template #footer>
        <button @click="showImageModal = false"
          class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
          ปิด
        </button>
        <button v-if="selectedAsset?.image"
          class="px-4 py-2 bg-gradient-to-r from-[#065f46] to-[#047857] text-white rounded-lg font-semibold text-sm flex items-center shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">
          <UploadCloud class="w-4 h-4 mr-2" /> เปลี่ยนรูปภาพ
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
    <BaseModal v-model="showEditModal" title="แก้ไขข้อมูลครุภัณฑ์" maxWidth="max-w-xl">
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เลขลำดับครุภัณฑ์</label>
            <input v-model="tempAsset.seq" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เลขทะเบียน/Serial</label>
            <input v-model="tempAsset.serial" type="text"
              class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อพัสดุ</label>
          <input v-model="tempAsset.name" type="text"
            class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">หมายเลขพัสดุหลัก</label>
          <input v-model="tempAsset.code" type="text"
            class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">แผนก/หน่วยงาน</label>
          <input v-model="tempAsset.department" type="text"
            class="w-full border border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
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
</template>

<style>
/* ใช้กับกล่องตารางที่เลื่อนภายในตัวเอง (เช่นตอนข้อมูลเยอะ) ให้เลื่อนได้ปกติแต่ไม่โชว์แถบเลื่อน */
.no-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE / Edge เก่า */
}
.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge (Chromium) */
}
</style>