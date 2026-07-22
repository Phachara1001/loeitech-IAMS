<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, SlidersHorizontal, Plus, History, Pencil, Trash2,
  Package, AlertTriangle, X, Check, Loader2, Boxes, ChevronDown
} from 'lucide-vue-next'

const router = useRouter()

// สิทธิ์การเข้าถึง: ดูข้อมูลได้ทุก role (admin, staff, user) / เพิ่ม-แก้ไข-ลบ ได้เฉพาะ admin, staff
// TODO: เชื่อมกับระบบยืนยันตัวตนจริง เช่น decode role จาก JWT หรือข้อมูลผู้ใช้หลัง login
// ตอนนี้ดึงจาก localStorage ไปก่อน (เซ็ตตอน login) ถ้ายังไม่มีค่า ให้ default เป็น 'user' (สิทธิ์น้อยสุด ปลอดภัยไว้ก่อน)
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canManage = computed(() => ['admin', 'staff'].includes(currentRole.value))

const categories = ['กระดาษ', 'หมึกพิมพ์', 'เครื่องเขียน', 'อุปกรณ์ทำความสะอาด']

// ข้อมูล mock (ยังไม่เชื่อม backend/database จริง)
const items = ref([
  { id: 'CS-0001', name: 'กระดาษ A4 80 แกรม', category: 'กระดาษ', unit: 'รีม', quantity: 42, minThreshold: 20 },
  { id: 'CS-0002', name: 'กระดาษ A3 80 แกรม', category: 'กระดาษ', unit: 'รีม', quantity: 8, minThreshold: 10 },
  { id: 'CS-0003', name: 'หมึกพิมพ์ Canon 728 (ดำ)', category: 'หมึกพิมพ์', unit: 'ตลับ', quantity: 15, minThreshold: 5 },
  { id: 'CS-0004', name: 'หมึกพิมพ์ HP 682 (สี)', category: 'หมึกพิมพ์', unit: 'ตลับ', quantity: 0, minThreshold: 3 },
  { id: 'CS-0005', name: 'ปากกาลูกลื่นสีน้ำเงิน', category: 'เครื่องเขียน', unit: 'กล่อง', quantity: 30, minThreshold: 10 },
  { id: 'CS-0006', name: 'ลวดเสียบกระดาษเบอร์ 1', category: 'เครื่องเขียน', unit: 'กล่อง', quantity: 6, minThreshold: 8 },
  { id: 'CS-0007', name: 'แฟ้มเอกสาร 2 ห่วง', category: 'เครื่องเขียน', unit: 'เล่ม', quantity: 24, minThreshold: 10 },
  { id: 'CS-0008', name: 'น้ำยาล้างกระจก', category: 'อุปกรณ์ทำความสะอาด', unit: 'ขวด', quantity: 12, minThreshold: 5 }
])

// ค้นหา + กรอง
const searchQuery = ref('')
const selectedCategory = ref('all')

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'all' || item.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

function statusOf(item) {
  if (item.quantity === 0) return { label: 'หมดสต๊อก', style: 'bg-red-50 text-red-700 border-red-100' }
  if (item.quantity <= item.minThreshold) return { label: 'ใกล้หมด', style: 'bg-amber-50 text-amber-700 border-amber-100' }
  return { label: 'ปกติ', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
}

const summary = computed(() => ({
  total: items.value.length,
  low: items.value.filter((i) => i.quantity > 0 && i.quantity <= i.minThreshold).length,
  empty: items.value.filter((i) => i.quantity === 0).length
}))

// ดูประวัติ Running Balance
function goToHistory(item) {
  router.push({ name: 'InventoryHistory', query: { itemId: item.id, itemName: item.name } })
}

// เพิ่ม / แก้ไข
const isFormOpen = ref(false)
const isEditMode = ref(false)
const isSaving = ref(false)
const formError = ref('')
const form = ref({ id: '', name: '', category: categories[0], unit: '', quantity: 0, minThreshold: 0 })

function openAddForm() {
  isEditMode.value = false
  formError.value = ''
  form.value = { id: '', name: '', category: categories[0], unit: '', quantity: 0, minThreshold: 0 }
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

function saveForm() {
  if (!form.value.name.trim() || !form.value.unit.trim()) {
    formError.value = 'กรุณากรอกชื่อพัสดุและหน่วยนับให้ครบถ้วน'
    return
  }

  isSaving.value = true
  formError.value = ''

  // TODO: เชื่อมต่อ API บันทึกข้อมูลจริงในภายหลัง
  setTimeout(() => {
    if (isEditMode.value) {
      const index = items.value.findIndex((i) => i.id === form.value.id)
      if (index !== -1) items.value[index] = { ...form.value }
    } else {
      const nextNumber = items.value.length + 1
      items.value.push({
        ...form.value,
        id: `CS-${String(nextNumber).padStart(4, '0')}`
      })
    }
    isSaving.value = false
    isFormOpen.value = false
  }, 500)
}

// ลบรายการ
const itemToDelete = ref(null)

function confirmDelete(item) {
  itemToDelete.value = item
}

function cancelDelete() {
  itemToDelete.value = null
}

function deleteItem() {
  items.value = items.value.filter((i) => i.id !== itemToDelete.value.id)
  itemToDelete.value = null
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20 mb-6">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
            <Boxes class="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white">ทะเบียนพัสดุสิ้นเปลือง</h1>
            <p class="text-sm text-emerald-100/80 mt-0.5">รายการพัสดุสิ้นเปลืองทั้งหมด เช่น กระดาษ หมึกพิมพ์ เครื่องเขียน</p>
          </div>
        </div>

        <button
          v-if="canManage"
          type="button"
          @click="openAddForm"
          class="flex items-center gap-2 rounded-xl bg-white text-[#065f46] px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:bg-emerald-50 hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
        >
          <Plus class="w-4 h-4" />
          เพิ่มพัสดุใหม่
        </button>
      </div>
    </div>

    <!-- สรุปภาพรวม -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-emerald-200 transition-all">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100">
          <Boxes class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-bold text-slate-900">{{ summary.total }}</p>
          <p class="text-sm text-slate-500">รายการทั้งหมด</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-amber-200 transition-all">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center ring-1 ring-amber-100">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-bold text-slate-900">{{ summary.low }}</p>
          <p class="text-sm text-slate-500">ใกล้หมด</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-red-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-red-200 transition-all">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-100">
          <Package class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-bold text-slate-900">{{ summary.empty }}</p>
          <p class="text-sm text-slate-500">หมดสต๊อก</p>
        </div>
      </div>
    </div>

    <!-- ตาราง -->
    <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <!-- Toolbar: ค้นหา + กรอง -->
      <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-emerald-50 bg-emerald-50/20">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาด้วยชื่อหรือรหัสพัสดุ..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
          />
        </div>

        <div class="relative sm:w-56">
          <SlidersHorizontal class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            v-model="selectedCategory"
            class="w-full appearance-none pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
          >
            <option value="all">ทุกประเภท</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <!-- ตารางข้อมูล -->
      <div class="overflow-x-auto max-h-[65vh] overflow-y-auto no-scrollbar">
        <table class="w-full text-sm">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">รหัส</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ชื่อพัสดุ</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">ประเภท</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">คงเหลือ</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">หน่วยนับ</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50">สถานะ</th>
              <th class="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wide text-emerald-50 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in filteredItems" :key="item.id" class="group hover:bg-emerald-50/60 transition-colors">
              <td class="px-4 py-3 text-slate-500 font-mono text-xs border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">{{ item.id }}</td>
              <td class="px-4 py-3 text-slate-800 font-medium">{{ item.name }}</td>
              <td class="px-4 py-3 text-slate-500">{{ item.category }}</td>
              <td class="px-4 py-3 text-right text-slate-800 font-semibold">{{ item.quantity.toLocaleString() }}</td>
              <td class="px-4 py-3 text-slate-500">{{ item.unit }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm', statusOf(item).style]">
                  {{ statusOf(item).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="goToHistory(item)"
                    title="ดูประวัติ Running Balance"
                    class="p-2 rounded-lg text-slate-500 hover:text-[#065f46] hover:bg-emerald-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                  >
                    <History class="w-4 h-4" />
                  </button>
                  <template v-if="canManage">
                    <button
                      type="button"
                      @click="openEditForm(item)"
                      title="แก้ไข"
                      class="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      @click="confirmDelete(item)"
                      title="ลบ"
                      class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:scale-110 active:scale-95 transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>

            <tr v-if="filteredItems.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                ไม่พบรายการพัสดุที่ตรงกับเงื่อนไขการค้นหา
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
        แสดง {{ filteredItems.length }} จาก {{ items.length }} รายการ
      </div>
    </div>

    <!-- Modal เพิ่ม/แก้ไขพัสดุ -->
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
          <button
            type="button"
            @click="closeForm"
            class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"
            aria-label="ปิด"
          >
            <X class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center ring-1 ring-emerald-100 shrink-0">
              <Pencil v-if="isEditMode" class="w-5 h-5" />
              <Plus v-else class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">
              {{ isEditMode ? 'แก้ไขข้อมูลพัสดุ' : 'เพิ่มพัสดุใหม่' }}
            </h3>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">ชื่อพัสดุ</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="เช่น กระดาษ A4 80 แกรม"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ประเภท</label>
                <select
                  v-model="form.category"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
                >
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">หน่วยนับ</label>
                <input
                  v-model="form.unit"
                  type="text"
                  placeholder="เช่น รีม, ตลับ"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">จำนวนคงเหลือ</label>
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="0"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">จุดสั่งซื้อขั้นต่ำ</label>
                <input
                  v-model.number="form.minThreshold"
                  type="number"
                  min="0"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
                />
              </div>
            </div>

            <div v-if="formError" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
              <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-600">{{ formError }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button
              type="button"
              @click="closeForm"
              class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
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
          <button
            type="button"
            @click="cancelDelete"
            class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"
            aria-label="ปิด"
          >
            <X class="w-4 h-4" />
          </button>

          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
              <AlertTriangle class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-base font-semibold text-slate-900">ยืนยันการลบรายการ</h3>
            <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">
              ต้องการลบ "{{ itemToDelete?.name }}" ออกจากทะเบียนพัสดุใช่หรือไม่<br />การลบไม่สามารถย้อนกลับได้
            </p>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button
              type="button"
              @click="cancelDelete"
              class="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              @click="deleteItem"
              class="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              ลบรายการ
            </button>
          </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* ซ่อนแถบเลื่อนของหน้าเว็บ (ยังเลื่อนได้ปกติด้วยเมาส์/นิ้ว) เพื่อไม่ให้ความกว้างหน้าจอขยับตอนเนื้อหายาวเกิน viewport
   หมายเหตุ: style นี้ไม่ใส่ scoped เพราะต้องมีผลกับทั้งหน้าเว็บ (html) ไม่ใช่แค่ component นี้
   แนะนำให้ย้ายไปไว้ใน global stylesheet ของโปรเจกต์ (เช่น src/style.css หรือ src/assets/main.css) แทน
   เพื่อให้มีผลกับทุกหน้าตั้งแต่โหลดแอปครั้งแรก ไม่ใช่แค่ตอนเปิดหน้านี้ */
html {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE / Edge เก่า */
}
html::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge (Chromium) */
}

/* ใช้กับกล่องตารางที่เลื่อนภายในตัวเอง (เช่นตอนข้อมูลเยอะ) ให้เลื่อนได้ปกติแต่ไม่โชว์แถบเลื่อน */
.no-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE / Edge เก่า */
}
.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge (Chromium) */
}
</style>