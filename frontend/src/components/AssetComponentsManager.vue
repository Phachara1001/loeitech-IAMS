<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE } from '../config/api'
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'

const props = defineProps({
  assetId: {
    type: Number,
    required: true
  }
})

const toast = useToast()
const components = ref([])
const isLoading = ref(true)

const newComponent = ref({ name: '', serialNumber: '', specifications: '' })
const editingId = ref(null)
const editForm = ref({ name: '', serialNumber: '', specifications: '', status: '' })

const statusOptions = [
  { value: 'Active', label: 'ใช้งานปกติ' },
  { value: 'Broken', label: 'ชำรุด' },
  { value: 'Repairing', label: 'กำลังซ่อม' }
]

function getStatusText(status) {
  const map = {
    'Active': 'ใช้งานปกติ',
    'Broken': 'ชำรุด',
    'Repairing': 'กำลังซ่อม',
    'Scrapped': 'แทงจำหน่ายแล้ว'
  }
  return map[status] || status
}

function getStatusBadge(status) {
  switch (status) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Broken': return 'bg-red-50 text-red-700 border-red-200'
    case 'Repairing': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Scrapped': return 'bg-slate-50 text-slate-700 border-slate-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

const fetchComponents = async () => {
  isLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/assets/${props.assetId}`, { headers: authHeaders() })
    components.value = res.data.data?.components || []
  } catch (error) {
    console.error(error)
    toast.error('ไม่สามารถดึงข้อมูลอุปกรณ์ย่อยได้')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (props.assetId) {
    fetchComponents()
  }
})

const addComponent = async () => {
  if (!newComponent.value.name) return toast.error('กรุณาระบุชื่ออุปกรณ์ย่อย')
  
  try {
    const res = await axios.post(`${API_BASE}/assets/${props.assetId}/components`, newComponent.value, { headers: authHeaders() })
    components.value.push(res.data.data)
    newComponent.value = { name: '', serialNumber: '', specifications: '' }
    toast.success('เพิ่มอุปกรณ์ย่อยสำเร็จ')
  } catch (error) {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการเพิ่ม')
  }
}

const startEdit = (comp) => {
  editingId.value = comp.id
  editForm.value = { name: comp.name, serialNumber: comp.serialNumber, specifications: comp.specifications, status: comp.status }
}

const cancelEdit = () => {
  editingId.value = null
}

const saveEdit = async (id) => {
  if (!editForm.value.name) return toast.error('กรุณาระบุชื่ออุปกรณ์ย่อย')
  
  try {
    const res = await axios.put(`${API_BASE}/assets/${props.assetId}/components/${id}`, editForm.value, { headers: authHeaders() })
    const index = components.value.findIndex(c => c.id === id)
    if (index !== -1) components.value[index] = res.data.data
    editingId.value = null
    toast.success('แก้ไขสำเร็จ')
  } catch (error) {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการแก้ไข')
  }
}

const deleteComponent = async (id) => {
  if (!confirm('ยืนยันการลบอุปกรณ์ย่อยนี้?')) return
  
  try {
    await axios.delete(`${API_BASE}/assets/${props.assetId}/components/${id}`, { headers: authHeaders() })
    components.value = components.value.filter(c => c.id !== id)
    toast.success('ลบสำเร็จ')
  } catch (error) {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการลบ')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
    
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-700">
          <tr>
            <th class="px-5 py-3 font-semibold w-1/3">ชื่ออุปกรณ์ย่อย</th>
            <th class="px-5 py-3 font-semibold">Serial Number</th>
            <th class="px-5 py-3 font-semibold">สเปค / รายละเอียด</th>
            <th class="px-5 py-3 font-semibold text-center w-32">สถานะ</th>
            <th class="px-5 py-3 font-semibold text-center w-28">จัดการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr v-for="comp in components" :key="comp.id" class="hover:bg-slate-50/50 transition-colors group">
            <template v-if="editingId === comp.id">
              <td class="p-3">
                <input v-model="editForm.name" placeholder="ชื่ออุปกรณ์..." class="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30" />
              </td>
              <td class="p-3">
                <input v-model="editForm.serialNumber" placeholder="S/N" class="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30" />
              </td>
              <td class="p-3">
                <input v-model="editForm.specifications" placeholder="สเปค" class="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30" />
              </td>
              <td class="p-3">
                <select v-model="editForm.status" class="w-full border border-emerald-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </td>
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button @click="saveEdit(comp.id)" class="text-white bg-[#065f46] hover:bg-emerald-700 p-2 rounded-lg transition-colors shadow-sm" title="บันทึก">
                    <Check class="w-4 h-4" />
                  </button>
                  <button @click="cancelEdit" class="text-slate-500 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors" title="ยกเลิก">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </template>
            <template v-else>
              <td class="px-5 py-3.5 font-medium text-slate-800">{{ comp.name }}</td>
              <td class="px-5 py-3.5">
                <div v-if="comp.serialNumber" class="inline-flex items-center gap-1.5 text-slate-600 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                  <Tag class="w-3 h-3 text-slate-400" />
                  {{ comp.serialNumber }}
                </div>
                <span v-else class="text-slate-400 italic text-xs">-</span>
              </td>
              <td class="px-5 py-3.5 text-slate-500 text-sm truncate max-w-[200px]" :title="comp.specifications">{{ comp.specifications || '-' }}</td>
              <td class="px-5 py-3.5 text-center">
                <span :class="['px-2.5 py-1 text-[11px] font-semibold rounded-full border inline-flex items-center', getStatusBadge(comp.status)]">
                  {{ getStatusText(comp.status) }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button v-if="comp.status !== 'Scrapped'" @click="startEdit(comp)" class="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="แก้ไข">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button v-if="comp.status !== 'Scrapped'" @click="deleteComponent(comp.id)" class="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors" title="ลบ">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </template>
          </tr>
          
          <!-- Add New Row -->
          <tr class="bg-emerald-50/30 border-t-2 border-emerald-100/50">
            <td class="p-3">
              <input v-model="newComponent.name" placeholder="+ ระบุชื่ออุปกรณ์ย่อย..." class="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#065f46] focus:ring-1 focus:ring-[#065f46] bg-white transition-all shadow-sm" />
            </td>
            <td class="p-3">
              <input v-model="newComponent.serialNumber" placeholder="Serial Number (ถ้ามี)" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#065f46] focus:ring-1 focus:ring-[#065f46] bg-white transition-all shadow-sm" />
            </td>
            <td class="p-3">
              <input v-model="newComponent.specifications" placeholder="สเปคเพิ่มเติม..." class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#065f46] focus:ring-1 focus:ring-[#065f46] bg-white transition-all shadow-sm" />
            </td>
            <td class="p-3 text-center">
              <span class="px-2.5 py-1 text-[11px] font-semibold rounded-full border bg-slate-50 text-slate-400 border-slate-200 inline-flex items-center">
                ตั้งต้นเป็น ปกติ
              </span>
            </td>
            <td class="p-3 text-center">
              <button @click="addComponent" :disabled="!newComponent.name" class="bg-gradient-to-r from-[#065f46] to-[#047857] text-white py-2 px-3 rounded-lg hover:shadow-md transition-all w-full flex justify-center items-center gap-1.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus class="w-4 h-4" /> เพิ่ม
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
