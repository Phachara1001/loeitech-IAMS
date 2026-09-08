<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ClipboardList, Search, RefreshCw, CheckCircle2, AlertTriangle,
  PackageCheck, PackageX, Loader2, ChevronDown, Save, RotateCcw,
  ShieldAlert, Filter, Package, X
} from 'lucide-vue-next'
import * as inventoryApi from '../services/inventoryApi.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

// =============================================
// สิทธิ์การเข้าถึง
// =============================================
const currentRole = ref(localStorage.getItem('tcaims_role') || 'admin')
const canAccess = computed(() => ['admin', 'staff'].includes(currentRole.value))

// =============================================
// โหลดรายการวัสดุจาก API
// =============================================
const allItems = ref([])
const isLoading = ref(false)
const loadError = ref('')

async function fetchItems() {
  isLoading.value = true
  loadError.value = ''
  try {
    const data = await inventoryApi.getItems()
    allItems.value = data.map(item => ({
      ...item,
      // ค่าที่กรอกเพื่อตรวจนับ (เริ่มต้นจากจำนวนในระบบ)
      actualQty: item.quantity,
      // สถานะการตรวจนับของแต่ละรายการ
      checkStatus: 'pending',  // pending | saved | saving
      remark: '',
      isDirty: false // เปลี่ยนค่าแล้วหรือยัง
    }))
  } catch (err) {
    loadError.value = err.message || 'ไม่สามารถโหลดข้อมูลได้'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchItems)

// =============================================
// ค้นหา + กรองตามหมวด + กรองตามสถานะ
// =============================================
const searchQuery = ref('')
const selectedCategory = ref('all')
const filterStatus = ref('all') // all | checked | unchecked

const categories = computed(() => {
  const cats = [...new Set(allItems.value.map(i => i.category).filter(Boolean))]
  return cats.sort()
})

const filteredItems = computed(() => {
  return allItems.value.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = selectedCategory.value === 'all' || item.category === selectedCategory.value
    const matchStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'checked' && item.checkStatus === 'saved') ||
      (filterStatus.value === 'unchecked' && item.checkStatus !== 'saved')
    return matchSearch && matchCat && matchStatus
  })
})

// =============================================
// สถิติความคืบหน้า
// =============================================
const progress = computed(() => {
  const total = allItems.value.length
  const done = allItems.value.filter(i => i.checkStatus === 'saved').length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, percent }
})

// =============================================
// อัปเดต isDirty เมื่อ actualQty เปลี่ยน (ใช้ v-model.number แล้ว)
// =============================================
function onActualQtyInput(item) {
  // ป้องกัน null/NaN
  if (item.actualQty === null || item.actualQty === undefined || isNaN(item.actualQty)) {
    item.actualQty = 0
  }
  if (item.actualQty < 0) item.actualQty = 0
  // mark dirty เมื่อค่าต่างจากในระบบ หรือ status เป็น saved แต่เปลี่ยนใหม่
  item.isDirty = item.actualQty !== item.quantity
  if (item.checkStatus === 'saved' && item.isDirty) {
    item.checkStatus = 'pending'
  }
}

// diff สี
function diffClass(item) {
  const diff = (item.actualQty ?? 0) - item.quantity
  if (diff > 0) return 'text-emerald-600 font-semibold'
  if (diff < 0) return 'text-red-500 font-semibold'
  return 'text-slate-400'
}
function diffLabel(item) {
  const diff = (item.actualQty ?? 0) - item.quantity
  if (diff > 0) return `+${diff}`
  if (diff === 0) return '–'
  return `${diff}`
}

// =============================================
// บันทึกผลตรวจนับทีละรายการ
// =============================================
async function saveItem(item) {
  item.checkStatus = 'saving'
  try {
    await inventoryApi.adjustItemQty(item.id, {
      actualQty: item.actualQty,
      remark: item.remark || null,
      operatorName: localStorage.getItem('tcaims_name') || 'เจ้าหน้าที่'
    })
    // อัปเดตค่าในระบบ
    item.quantity = item.actualQty
    item.isDirty = false
    item.checkStatus = 'saved'
    toast.success(`บันทึกผลตรวจนับ "${item.name}" สำเร็จ`)
  } catch (err) {
    item.checkStatus = 'pending'
    toast.error(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
  }
}

// รีเซ็ตค่ากลับเป็นจำนวนในระบบ
function resetItem(item) {
  item.actualQty = item.quantity
  item.isDirty = false
  item.remark = ''
  if (item.checkStatus === 'saved') item.checkStatus = 'pending'
}

// =============================================
// บันทึกทั้งหมดที่ยังไม่ได้บันทึก
// =============================================
const isSavingAll = ref(false)
async function saveAll() {
  const pending = filteredItems.value.filter(i => i.checkStatus !== 'saved')
  if (pending.length === 0) {
    toast.success('ทุกรายการบันทึกเรียบร้อยแล้ว')
    return
  }
  isSavingAll.value = true
  let success = 0
  for (const item of pending) {
    try {
      await inventoryApi.adjustItemQty(item.id, {
        actualQty: item.actualQty,
        remark: item.remark || null,
        operatorName: localStorage.getItem('tcaims_name') || 'เจ้าหน้าที่'
      })
      item.quantity = item.actualQty
      item.isDirty = false
      item.checkStatus = 'saved'
      success++
    } catch {
      // ข้ามไปรายการถัดไป
    }
  }
  isSavingAll.value = false
  toast.success(`บันทึกผลตรวจนับสำเร็จ ${success}/${pending.length} รายการ`)
}
</script>

<template>
  <div class="p-4 lg:p-6 w-full space-y-5">

    <!-- Header Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-6 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>
      <div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
            <ClipboardList class="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">ตรวจนับวัสดุในคลัง</h1>
            <p class="text-sm text-emerald-100/70 mt-0.5">กรอกจำนวนที่นับได้จริง แล้วกดบันทึกทีละรายการ หรือบันทึกทั้งหมดพร้อมกัน</p>
          </div>
        </div>
        <!-- ปุ่มบันทึกทั้งหมด -->
        <button
          v-if="canAccess"
          type="button"
          :disabled="isSavingAll || isLoading"
          @click="saveAll"
          class="flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/20 transition-all disabled:opacity-60 shrink-0"
        >
          <Loader2 v-if="isSavingAll" class="w-4 h-4 animate-spin" />
          <PackageCheck v-else class="w-4 h-4" />
          {{ isSavingAll ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด' }}
        </button>
      </div>
    </div>

    <!-- ไม่มีสิทธิ์ -->
    <div v-if="!canAccess" class="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center text-center">
      <div class="w-14 h-14 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
        <ShieldAlert class="w-7 h-7 text-red-500" />
      </div>
      <h2 class="text-base font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p class="text-sm text-slate-500 mt-1.5 max-w-xs">สงวนสิทธิ์สำหรับผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น</p>
    </div>

    <template v-else>

      <!-- แถบความคืบหน้า + สรุป -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <!-- Stats -->
          <div class="flex items-center gap-5 flex-1">
            <div class="text-center">
              <p class="text-2xl font-bold text-slate-800">{{ progress.total }}</p>
              <p class="text-xs text-slate-500 mt-0.5">รายการทั้งหมด</p>
            </div>
            <div class="w-px h-10 bg-slate-100"></div>
            <div class="text-center">
              <p class="text-2xl font-bold text-emerald-600">{{ progress.done }}</p>
              <p class="text-xs text-slate-500 mt-0.5">ตรวจนับแล้ว</p>
            </div>
            <div class="w-px h-10 bg-slate-100"></div>
            <div class="text-center">
              <p class="text-2xl font-bold text-amber-500">{{ progress.total - progress.done }}</p>
              <p class="text-xs text-slate-500 mt-0.5">ยังไม่ได้ตรวจ</p>
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="flex-1 min-w-0">
            <div class="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>ความคืบหน้า</span>
              <span class="font-semibold text-slate-700">{{ progress.percent }}%</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progress.percent === 100 ? 'bg-emerald-500' : 'bg-[#065f46]'"
                :style="{ width: progress.percent + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- แถบค้นหา + กรอง -->
      <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- ค้นหา -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อหรือรหัสวัสดุ..."
              class="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition"
            />
          </div>
          <!-- กรองหมวดหมู่ -->
          <div class="relative">
            <Filter class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              v-model="selectedCategory"
              class="pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition appearance-none cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <!-- กรองสถานะ -->
          <div class="flex gap-2">
            <button
              v-for="opt in [{ val: 'all', label: 'ทั้งหมด' }, { val: 'unchecked', label: 'ยังไม่ได้ตรวจ' }, { val: 'checked', label: 'ตรวจแล้ว' }]"
              :key="opt.val"
              @click="filterStatus = opt.val"
              :class="[
                'px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all',
                filterStatus === opt.val
                  ? 'bg-[#065f46] text-white border-[#065f46] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              ]"
            >{{ opt.label }}</button>
          </div>
          <!-- Refresh -->
          <button
            @click="fetchItems"
            :disabled="isLoading"
            class="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#065f46] hover:border-[#065f46] transition disabled:opacity-50"
            title="โหลดข้อมูลใหม่"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-16 flex flex-col items-center gap-3">
        <Loader2 class="w-8 h-8 text-[#065f46] animate-spin" />
        <p class="text-sm text-slate-500">กำลังโหลดรายการวัสดุ...</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center gap-3">
        <PackageX class="w-10 h-10 text-red-400" />
        <p class="text-sm font-medium text-red-600">{{ loadError }}</p>
        <button @click="fetchItems" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition">ลองใหม่</button>
      </div>

      <!-- ตารางตรวจนับ -->
      <div v-else class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">

        <!-- ไม่มีข้อมูล -->
        <div v-if="filteredItems.length === 0" class="py-16 flex flex-col items-center gap-3 text-slate-400">
          <Package class="w-10 h-10" />
          <p class="text-sm">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
        </div>

        <!-- ตาราง -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gradient-to-r from-[#065f46] to-[#047857] text-left">
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-32">รหัสวัสดุ</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50">ชื่อวัสดุ</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-28 text-center">จำนวนในระบบ</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-36 text-center">จำนวนที่นับได้จริง</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-20 text-center">ผลต่าง</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-44">หมายเหตุ</th>
                <th class="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50 w-28 text-center">สถานะ / บันทึก</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredItems"
                :key="item.id"
                :class="[
                  'group transition-colors',
                  item.checkStatus === 'saved'
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                    : 'hover:bg-slate-50/70'
                ]"
              >
                <!-- รหัส -->
                <td class="px-4 py-3">
                  <span class="font-mono text-xs text-slate-400">{{ item.sku }}</span>
                </td>

                <!-- ชื่อ + หมวด -->
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800 leading-tight">{{ item.name }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ item.category }} · {{ item.unit }}</p>
                </td>

                <!-- จำนวนในระบบ -->
                <td class="px-4 py-3 text-center">
                  <span class="text-slate-700 font-semibold">{{ item.quantity }}</span>
                  <span class="text-xs text-slate-400 ml-1">{{ item.unit }}</span>
                </td>

                <!-- จำนวนที่นับได้จริง -->
                <td class="px-4 py-3 text-center">
                  <input
                    v-model.number="item.actualQty"
                    type="number"
                    min="0"
                    :disabled="item.checkStatus === 'saving'"
                    @input="onActualQtyInput(item)"
                    class="w-24 text-center px-2 py-1.5 rounded-lg border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#065f46]/20"
                    :class="[
                      item.checkStatus === 'saved' && !item.isDirty
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : item.isDirty
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-white text-slate-700',
                      'disabled:opacity-60 disabled:cursor-not-allowed'
                    ]"
                  />
                </td>

                <!-- ผลต่าง -->
                <td class="px-4 py-3 text-center">
                  <span :class="diffClass(item)" class="text-sm font-mono">{{ diffLabel(item) }}</span>
                </td>

                <!-- หมายเหตุ -->
                <td class="px-4 py-3">
                  <input
                    v-model="item.remark"
                    type="text"
                    placeholder="หมายเหตุ (ถ้ามี)"
                    :disabled="item.checkStatus === 'saving'"
                    class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition placeholder-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </td>

                <!-- สถานะ / ปุ่ม -->
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1.5">

                    <!-- กำลังบันทึก -->
                    <template v-if="item.checkStatus === 'saving'">
                      <Loader2 class="w-4 h-4 text-[#065f46] animate-spin" />
                      <span class="text-xs text-slate-400">บันทึก...</span>
                    </template>

                    <!-- บันทึกแล้ว และไม่มีการแก้ไขใหม่ -->
                    <template v-else-if="item.checkStatus === 'saved' && !item.isDirty">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 class="w-3 h-3" />
                        บันทึกแล้ว
                      </span>
                      <button
                        @click="resetItem(item)"
                        class="p-1 rounded text-slate-400 hover:text-amber-500 transition"
                        title="แก้ไขใหม่"
                      >
                        <RotateCcw class="w-3.5 h-3.5" />
                      </button>
                    </template>

                    <!-- pending หรือ dirty (รอบันทึก / แก้ไขใหม่) -->
                    <template v-else>
                      <button
                        @click="saveItem(item)"
                        :class="[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-all',
                          item.isDirty
                            ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-md'
                            : 'bg-[#065f46] hover:bg-[#047857] hover:shadow-md'
                        ]"
                      >
                        <Save class="w-3 h-3" />
                        {{ item.isDirty ? 'บันทึก*' : 'บันทึก' }}
                      </button>
                      <button
                        v-if="item.isDirty"
                        @click="resetItem(item)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="ยกเลิกการแก้ไข"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </template>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer สรุป -->
        <div v-if="filteredItems.length > 0" class="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>แสดง {{ filteredItems.length }} จาก {{ allItems.length }} รายการ</span>
          <span>
            ตรวจนับแล้ว
            <span class="font-semibold text-emerald-600">{{ progress.done }}</span>
            /
            <span class="font-semibold text-slate-700">{{ progress.total }}</span>
            รายการ
          </span>
        </div>
      </div>

    </template>
  </div>
</template>