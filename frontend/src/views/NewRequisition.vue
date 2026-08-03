<script setup>
import { ref, reactive, computed } from 'vue'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  PackageSearch,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
  Boxes,
  ClipboardList,
  ChevronRight,
  RotateCcw
} from 'lucide-vue-next'

// ==========================================
// 1. ข้อมูลคลังพัสดุสิ้นเปลือง (Mock Data - ยังไม่มี backend)
// ==========================================
const categories = ['ทั้งหมด', 'เครื่องเขียน', 'วัสดุสำนักงาน', 'วัสดุคอมพิวเตอร์', 'ความสะอาด', 'ไฟฟ้า']

const supplies = ref([
  { id: 'SUP-001', name: 'กระดาษ A4 80 แกรม', category: 'วัสดุสำนักงาน', unit: 'รีม', stock: 42 },
  { id: 'SUP-002', name: 'ปากกาลูกลื่นสีน้ำเงิน', category: 'เครื่องเขียน', unit: 'ด้าม', stock: 120 },
  { id: 'SUP-003', name: 'แฟ้มสันกว้าง 3 นิ้ว', category: 'วัสดุสำนักงาน', unit: 'เล่ม', stock: 8 },
  { id: 'SUP-004', name: 'ผงหมึกเครื่องถ่ายเอกสาร', category: 'วัสดุคอมพิวเตอร์', unit: 'กล่อง', stock: 0 },
  { id: 'SUP-005', name: 'คลิปหนีบกระดาษเบอร์ 1', category: 'เครื่องเขียน', unit: 'กล่อง', stock: 65 },
  { id: 'SUP-006', name: 'ลวดเย็บกระดาษเบอร์ 10', category: 'เครื่องเขียน', unit: 'กล่อง', stock: 30 },
  { id: 'SUP-007', name: 'แบตเตอรี่ AA อัลคาไลน์', category: 'ไฟฟ้า', unit: 'คู่', stock: 4 },
  { id: 'SUP-008', name: 'น้ำยาทำความสะอาดกระจก', category: 'ความสะอาด', unit: 'ขวด', stock: 18 },
  { id: 'SUP-009', name: 'ถุงขยะดำขนาด 30x40 นิ้ว', category: 'ความสะอาด', unit: 'แพ็ค', stock: 25 },
  { id: 'SUP-010', name: 'หมึกพิมพ์ Inkjet สีดำ', category: 'วัสดุคอมพิวเตอร์', unit: 'ตลับ', stock: 6 },
  { id: 'SUP-011', name: 'แผ่น CD-R เปล่า', category: 'วัสดุคอมพิวเตอร์', unit: 'แผ่น', stock: 50 },
  { id: 'SUP-012', name: 'สมุดบันทึกปกแข็ง A5', category: 'เครื่องเขียน', unit: 'เล่ม', stock: 22 },
  { id: 'SUP-013', name: 'เทปใส 1 นิ้ว', category: 'เครื่องเขียน', unit: 'ม้วน', stock: 40 },
  { id: 'SUP-014', name: 'ปลั๊กพ่วง 4 ช่อง 3 เมตร', category: 'ไฟฟ้า', unit: 'อัน', stock: 3 }
])

// ==========================================
// 2. ค้นหา / กรองหมวดหมู่
// ==========================================
const searchQuery = ref('')
const activeCategory = ref('ทั้งหมด')

const filteredSupplies = computed(() => {
  return supplies.value.filter((item) => {
    const matchCategory = activeCategory.value === 'ทั้งหมด' || item.category === activeCategory.value
    const matchSearch = item.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
    return matchCategory && matchSearch
  })
})

// จำนวนที่กำลังเลือกไว้ในการ์ดแต่ละใบ (ก่อนกดเพิ่มลงตะกร้า)
const pickQty = reactive({})
function getPickQty(item) {
  return pickQty[item.id] ?? 1
}
function adjustPickQty(item, delta) {
  const current = getPickQty(item)
  const next = Math.min(Math.max(current + delta, 1), Math.max(item.stock, 1))
  pickQty[item.id] = next
}

// ==========================================
// 3. ระบบตะกร้าคำขอเบิก
// ==========================================
const cart = ref([])
const itemNotices = reactive({}) // ข้อความแจ้งเตือนชั่วคราวรายชิ้น (เช่น เกินสต็อก)

function flashNotice(id, message) {
  itemNotices[id] = message
  setTimeout(() => {
    if (itemNotices[id] === message) delete itemNotices[id]
  }, 2500)
}

function addToCart(item) {
  if (item.stock <= 0) return
  const qty = getPickQty(item)
  const existing = cart.value.find((c) => c.id === item.id)

  if (existing) {
    const total = existing.qty + qty
    if (total > item.stock) {
      existing.qty = item.stock
      flashNotice(item.id, `ปรับจำนวนให้ไม่เกินคงเหลือ (${item.stock} ${item.unit})`)
    } else {
      existing.qty = total
    }
  } else {
    cart.value.push({
      id: item.id,
      name: item.name,
      unit: item.unit,
      stock: item.stock,
      icon: item.icon,
      qty: Math.min(qty, item.stock)
    })
  }
  pickQty[item.id] = 1
}

function removeFromCart(id) {
  cart.value = cart.value.filter((c) => c.id !== id)
  delete itemNotices[id]
}

function stepCartQty(cartItem, delta) {
  const next = cartItem.qty + delta
  if (next < 1) return
  if (next > cartItem.stock) {
    flashNotice(cartItem.id, `คงเหลือในคลังเพียง ${cartItem.stock} ${cartItem.unit}`)
    return
  }
  cartItem.qty = next
}

function onCartQtyInput(cartItem, event) {
  const raw = Number(event.target.value)
  if (!Number.isFinite(raw) || raw < 1) {
    cartItem.qty = 1
    return
  }
  if (raw > cartItem.stock) {
    cartItem.qty = cartItem.stock
    flashNotice(cartItem.id, `จำนวนเกินคงเหลือ ระบบปรับเป็น ${cartItem.stock} ${cartItem.unit} ให้อัตโนมัติ`)
  } else {
    cartItem.qty = Math.floor(raw)
  }
}

const totalCartItems = computed(() => cart.value.length)
const totalCartQty = computed(() => cart.value.reduce((sum, c) => sum + c.qty, 0))

// ==========================================
// 4. เหตุผลการเบิกใช้ + การส่งคำขอ
// ==========================================
const reason = ref('')
const REASON_MIN_LENGTH = 10
const touchedSubmit = ref(false)

const reasonError = computed(() => {
  if (!touchedSubmit.value) return ''
  if (!reason.value.trim()) return 'กรุณากรอกเหตุผลในการเบิกใช้'
  if (reason.value.trim().length < REASON_MIN_LENGTH) return `กรุณาระบุเหตุผลอย่างน้อย ${REASON_MIN_LENGTH} ตัวอักษร`
  return ''
})

const cartError = computed(() => {
  if (!touchedSubmit.value) return ''
  if (cart.value.length === 0) return 'กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ'
  return ''
})

const isSubmitting = ref(false)
const submitted = ref(false)
const requestCode = ref('')
const submittedSummary = ref([])
const submittedReason = ref('')

function handleSubmit() {
  touchedSubmit.value = true
  if (cart.value.length === 0 || reasonError.value || cartError.value) return

  isSubmitting.value = true
  setTimeout(() => {
    requestCode.value = `REQ-2569-${String(Math.floor(1000 + Math.random() * 9000))}`
    submittedSummary.value = cart.value.map((c) => ({ ...c }))
    submittedReason.value = reason.value.trim()
    isSubmitting.value = false
    submitted.value = true
  }, 900)
}

function startNewRequest() {
  cart.value = []
  reason.value = ''
  touchedSubmit.value = false
  submitted.value = false
  requestCode.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] font-sarabun p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER ================= -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20">
        <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

        <div class="relative">
          <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-200/60 mb-2">
            <span>เบิกพัสดุ</span>
            <ChevronRight class="w-3.5 h-3.5" />
            <span class="text-emerald-100 font-semibold">ยื่นคำขอใหม่</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
              <ClipboardList class="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-white">ยื่นคำขอเบิกพัสดุสิ้นเปลือง</h1>
              <p class="text-sm text-emerald-100/80 mt-0.5">เลือกรายการที่ต้องการเบิกใช้ ระบุจำนวน แล้วบันทึกเหตุผลเพื่อส่งคำขอ</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <!-- ================= 1. รายการพัสดุ (Catalog) ================= -->
        <div class="lg:col-span-2 space-y-4">

          <!-- ค้นหา + กรองหมวดหมู่ -->
          <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 space-y-3">
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาชื่อพัสดุ..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition-all"
              />
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                v-for="cat in categories"
                :key="cat"
                type="button"
                @click="activeCategory = cat"
                class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                :class="activeCategory === cat
                  ? 'bg-[#065f46] border-[#065f46] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#065f46]/40 hover:text-[#065f46]'"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- ตารางการ์ดรายการพัสดุ -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="item in filteredSupplies"
              :key="item.id"
              class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3 transition-shadow hover:shadow-md hover:border-emerald-200"
              :class="item.stock <= 0 ? 'opacity-60' : ''"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="w-11 h-11 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center shrink-0">
                  <Boxes class="w-5 h-5" />
                </div>
                <span
                  class="text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                  :class="item.stock <= 0
                    ? 'bg-red-50 text-red-600'
                    : item.stock <= 5
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-[#065f46]'"
                >
                  {{ item.stock <= 0 ? 'หมดสต็อก' : `คงเหลือ ${item.stock} ${item.unit}` }}
                </span>
              </div>

              <div>
                <p class="text-sm font-semibold text-[#0f172a] leading-snug">{{ item.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ item.category }}</p>
              </div>

              <div class="mt-auto flex items-center gap-2 pt-1">
                <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
                  <button
                    type="button"
                    :disabled="item.stock <= 0"
                    @click="adjustPickQty(item, -1)"
                    class="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus class="w-3.5 h-3.5" />
                  </button>
                  <span class="w-8 text-center text-sm font-semibold text-[#0f172a]">{{ item.stock <= 0 ? 0 : getPickQty(item) }}</span>
                  <button
                    type="button"
                    :disabled="item.stock <= 0"
                    @click="adjustPickQty(item, 1)"
                    class="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus class="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  :disabled="item.stock <= 0"
                  @click="addToCart(item)"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                  :class="item.stock <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'"
                >
                  <ShoppingCart class="w-3.5 h-3.5" />
                  เพิ่มลงตะกร้า
                </button>
              </div>

              <p v-if="itemNotices[item.id]" class="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertCircle class="w-3 h-3 shrink-0" />
                {{ itemNotices[item.id] }}
              </p>
            </div>

            <!-- ไม่พบรายการ -->
            <div v-if="filteredSupplies.length === 0" class="sm:col-span-2 xl:col-span-3 py-16 flex flex-col items-center text-slate-400 bg-white rounded-2xl border border-emerald-100">
              <PackageSearch class="w-10 h-10 mb-2 opacity-50" />
              <p class="text-sm">ไม่พบรายการพัสดุที่ค้นหา</p>
            </div>
          </div>
        </div>

        <!-- ================= 2. ตะกร้าคำขอเบิก (Cart) ================= -->
        <div class="lg:sticky lg:top-6">
          <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">

            <!-- ------- สถานะ: ส่งคำขอสำเร็จ ------- -->
            <div v-if="submitted" class="p-6 flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-emerald-50 text-[#065f46] flex items-center justify-center mb-4">
                <CheckCircle2 class="w-7 h-7" />
              </div>
              <h3 class="text-lg font-bold text-[#0f172a]">ส่งคำขอเบิกพัสดุแล้ว</h3>
              <p class="text-sm text-slate-500 mt-1">เลขที่คำขอของคุณคือ</p>
              <p class="text-xl font-bold text-[#065f46] mt-1 font-mono">{{ requestCode }}</p>

              <div class="w-full mt-5 space-y-2 text-left bg-slate-50 rounded-xl p-3.5">
                <div v-for="s in submittedSummary" :key="s.id" class="flex items-center justify-between text-xs">
                  <span class="text-slate-600 truncate pr-2">{{ s.name }}</span>
                  <span class="font-semibold text-[#0f172a] shrink-0">{{ s.qty }} {{ s.unit }}</span>
                </div>
                <div class="pt-2 mt-1 border-t border-slate-200 text-xs text-slate-500">
                  <span class="font-semibold text-slate-600">เหตุผล:</span> {{ submittedReason }}
                </div>
              </div>

              <p class="text-xs text-slate-400 mt-4">คำขอจะถูกส่งให้ผู้มีสิทธิ์อนุมัติตรวจสอบต่อไป</p>

              <button
                type="button"
                @click="startNewRequest"
                class="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw class="w-4 h-4" />
                ยื่นคำขอใหม่
              </button>
            </div>

            <!-- ------- Status: เลือกรายการ ------- -->
            <template v-else>
              <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 class="text-base font-bold text-[#0f172a] flex items-center gap-2">
                  <ShoppingCart class="w-4.5 h-4.5 text-[#065f46]" />
                  ตะกร้าคำขอเบิก
                </h2>
                <span v-if="totalCartItems > 0" class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#065f46]">
                  {{ totalCartItems }} รายการ · {{ totalCartQty }} ชิ้น
                </span>
              </div>

              <!-- ตะกร้าว่าง -->
              <div v-if="cart.length === 0" class="px-5 py-10 flex flex-col items-center text-center text-slate-400">
                <Boxes class="w-9 h-9 mb-2 opacity-50" />
                <p class="text-sm">ยังไม่มีรายการในตะกร้า</p>
                <p class="text-xs mt-0.5">เลือกพัสดุจากรายการด้านซ้ายเพื่อเพิ่มลงตะกร้า</p>
              </div>

              <!-- รายการในตะกร้า -->
              <div v-else class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                <div v-for="c in cart" :key="c.id" class="p-3.5 flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-emerald-50 text-[#065f46] flex items-center justify-center shrink-0">
                    <Boxes class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-[#0f172a] truncate">{{ c.name }}</p>
                    <p class="text-[11px] text-slate-400">คงเหลือในคลัง {{ c.stock }} {{ c.unit }}</p>

                    <div class="flex items-center gap-2 mt-2">
                      <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button type="button" @click="stepCartQty(c, -1)" class="w-6 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                          <Minus class="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          :value="c.qty"
                          @change="onCartQtyInput(c, $event)"
                          min="1"
                          :max="c.stock"
                          class="w-10 text-center text-sm font-semibold text-[#0f172a] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button type="button" @click="stepCartQty(c, 1)" class="w-6 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                          <Plus class="w-3 h-3" />
                        </button>
                      </div>
                      <span class="text-xs text-slate-400">{{ c.unit }}</span>
                    </div>
                    <p v-if="itemNotices[c.id]" class="text-[11px] text-amber-600 flex items-center gap-1 mt-1.5">
                      <AlertCircle class="w-3 h-3 shrink-0" />
                      {{ itemNotices[c.id] }}
                    </p>
                  </div>
                  <button type="button" @click="removeFromCart(c.id)" class="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p v-if="cartError" class="px-4 pt-3 text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                {{ cartError }}
              </p>

              <!-- เหตุผลการเบิกใช้ -->
              <div class="p-4 border-t border-slate-100 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600">เหตุผลในการเบิกใช้งาน <span class="text-red-500">*</span></label>
                <textarea
                  v-model="reason"
                  rows="3"
                  placeholder="เช่น เบิกทดแทนวัสดุที่ใช้หมดในหน่วยงาน..."
                  class="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-[#0f172a] resize-none focus:outline-none focus:ring-2 transition-all"
                  :class="reasonError
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-[#065f46]/20 focus:border-[#065f46]'"
                ></textarea>
                <div class="flex items-center justify-between">
                  <p v-if="reasonError" class="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                    {{ reasonError }}
                  </p>
                  <span v-else></span>
                  <span class="text-[11px] text-slate-400 shrink-0">{{ reason.trim().length }}/{{ REASON_MIN_LENGTH }}+</span>
                </div>
              </div>

              <!-- ปุ่มส่งคำขอ -->
              <div class="p-4 pt-0">
                <button
                  type="button"
                  :disabled="isSubmitting"
                  @click="handleSubmit"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
                >
                  <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                  <Send v-else class="w-4 h-4" />
                  {{ isSubmitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเบิกพัสดุ' }}
                </button>
              </div>
            </template>
          </div>
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
</style>