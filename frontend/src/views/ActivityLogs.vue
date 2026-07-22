<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  ShieldAlert, 
  Database, 
  Clock, 
  User, 
  Network,
  X,
  FileCode2
} from 'lucide-vue-next'

// --- Canvas VFX: Transparent Glowing ADMIN + Matrix Rain ---
const backgroundCanvas = ref(null)
const containerRef = ref(null)
let animationId = null

const initCyberLightBackground = () => {
  const canvas = backgroundCanvas.value
  const container = containerRef.value
  if (!canvas || !container) return
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }
  resize()

  const ro = new ResizeObserver(() => resize())
  ro.observe(container)

  // Matrix Rain Setup
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*'
  const fontSize = 15
  const columns = Math.floor(canvas.width / fontSize)
  const drops = Array.from({ length: columns }, () => ({
    y: Math.random() * -100,
    speed: Math.random() * 1.5 + 1.2,
    length: Math.floor(Math.random() * 12) + 8
  }))

  const draw = () => {
    // 1. เคลียร์ Canvas พื้นหลังสว่างสดใส
    ctx.fillStyle = 'rgba(248, 250, 252, 0.28)' 
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // -------------------------------------------------------------
    // 🌧️ A. Matrix Rain (ฝนดิจิทัล)
    // -------------------------------------------------------------
    ctx.font = `bold ${fontSize}px monospace`
    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i]
      const x = i * fontSize

      for (let j = 0; j < drop.length; j++) {
        const charY = (drop.y - j) * fontSize
        if (charY > 0 && charY < canvas.height) {
          const char = chars[Math.floor(Math.random() * chars.length)]
          if (j === 0) {
            ctx.fillStyle = '#10b981'
          } else {
            ctx.fillStyle = `rgba(16, 185, 129, ${0.15 - (j / drop.length) * 0.12})`
          }
          ctx.fillText(char, x, charY)
        }
      }

      drop.y += drop.speed
      if (drop.y * fontSize > canvas.height + drop.length * fontSize && Math.random() > 0.975) {
        drop.y = 0
      }
    }

    // -------------------------------------------------------------
    // 🌟 B. Fullscreen Transparent Glowing "ADMIN"
    // -------------------------------------------------------------
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // คำนวณขนาดตัวหนังสือใหญ่ยักษ์ ขยายเกือบเต็มความกว้างจอ
    const adminFontSize = Math.min(canvas.width * 0.32, 500)
    ctx.font = `900 ${adminFontSize}px 'Impact', 'Arial Black', sans-serif`

    const text = 'ADMIN'

    // 1. แสง Neon Glow ด้านหลังตัวหนังสือ
    ctx.shadowColor = '#10b981'
    ctx.shadowBlur = 35
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'
    ctx.lineWidth = 10
    ctx.strokeText(text, 0, 0)

    // 2. เส้นขอบหลักสีเขียวนีออนคมชัด (ตัวอักษรข้างในโปร่งใส Transparent)
    ctx.shadowBlur = 10
    ctx.shadowColor = '#34d399'
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 4
    ctx.strokeText(text, 0, 0)

    // 3. เส้น Inner-Stroke เส้นสว่างสีเขียวมิ้นต์ขาว เพื่อความพรีเมียม
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#a7f3d0'
    ctx.lineWidth = 1.5
    ctx.strokeText(text, 0, 0)

    ctx.restore()

    animationId = requestAnimationFrame(draw)
  }

  draw()
}

onMounted(() => {
  initCyberLightBackground()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})

// --- Mock User & Role ---
const currentUser = ref({ name: 'สมชาย ใจดี (Admin)', role: 'Admin' })
const isAdmin = computed(() => currentUser.value.role === 'Admin')

// --- Filters & States ---
const searchQuery = ref('')
const selectedAction = ref('ALL')
const selectedTable = ref('ALL')

// --- Original Table Data ---
const activityLogs = ref([
  {
    id: 1,
    user_name: 'สมชาย ใจดี (Admin)',
    action_type: 'UPDATE',
    action_th: 'แก้ไขข้อมูล',
    table_name: 'items',
    ip_address: '192.168.1.45',
    created_at: '2026-07-21 13:40:12',
    old_value: { item_code: 'IT-001', item_name: 'กระดาษ A4 80gsm', stock_qty: 15, unit: 'รีม' },
    new_value: { item_code: 'IT-001', item_name: 'กระดาษ A4 80gsm', stock_qty: 50, unit: 'รีม' }
  },
  {
    id: 2,
    user_name: 'วิภาดา พัสดุ (Staff)',
    action_type: 'INSERT',
    action_th: 'เพิ่มข้อมูล',
    table_name: 'assets',
    ip_address: '192.168.1.88',
    created_at: '2026-07-21 11:15:05',
    old_value: null,
    new_value: { asset_code: 'DUR-69-004', asset_name: 'เครื่องคอมพิวเตอร์ All-in-One', department_id: 2, status: 'Active' }
  },
  {
    id: 3,
    user_name: 'สมชาย ใจดี (Admin)',
    action_type: 'DELETE',
    action_th: 'ลบข้อมูล',
    table_name: 'users',
    ip_address: '192.168.1.45',
    created_at: '2026-07-20 16:30:00',
    old_value: { id: 9, username: 'temp_user', role: 'User', status: 'Inactive' },
    new_value: null
  },
  {
    id: 4,
    user_name: 'ประสิทธิ์ งานช่าง (Staff)',
    action_type: 'UPDATE',
    action_th: 'แก้ไขข้อมูล',
    table_name: 'assets',
    ip_address: '192.168.1.102',
    created_at: '2026-07-20 09:20:44',
    old_value: { asset_code: 'DUR-68-012', status: 'Active' },
    new_value: { asset_code: 'DUR-68-012', status: 'Repair' }
  },
  {
    id: 5,
    user_name: 'วิภาดา พัสดุ (Staff)',
    action_type: 'INSERT',
    action_th: 'เพิ่มข้อมูล',
    table_name: 'stock_transactions',
    ip_address: '192.168.1.88',
    created_at: '2026-07-19 14:05:10',
    old_value: null,
    new_value: { transaction_type: 'IN', item_id: 1, quantity: 35, created_by: 2 }
  }
])

const getActionBadgeClass = (action) => {
  switch (action) {
    case 'INSERT': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

const filteredLogs = computed(() => {
  return activityLogs.value.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.ip_address.includes(searchQuery.value)
    
    const matchesAction = selectedAction.value === 'ALL' || log.action_type === selectedAction.value
    const matchesTable = selectedTable.value === 'ALL' || log.table_name === selectedTable.value

    return matchesSearch && matchesAction && matchesTable
  })
})

const isModalOpen = ref(false)
const selectedLogData = ref(null)

const openJsonModal = (log) => {
  selectedLogData.value = log
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedLogData.value = null
}
</script>

<template>
  <div ref="containerRef" class="relative w-full min-h-screen p-4 md:p-6 bg-slate-50 space-y-6 overflow-hidden">
    
    <!-- 1. Heavy VFX Canvas Background -->
    <canvas ref="backgroundCanvas" class="absolute inset-0 pointer-events-none z-0 opacity-100"></canvas>

    <!-- 2. Neon Ambient Glows -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-emerald-200/25 rounded-full blur-[150px] pointer-events-none z-0"></div>

    <!-- 3. UI Components -->
    <div class="relative z-10 space-y-6">

      <!-- Access Denied State -->
      <div v-if="!isAdmin" class="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div class="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-1">ไม่มีสิทธิ์เข้าถึงข้อมูล</h2>
        <p class="text-slate-500 text-sm mb-6">
          หน้านี้อนุญาตให้เฉพาะผู้ดูแลระบบ (Admin) เข้าถึงเพื่อตรวจสอบประวัติการใช้งานระบบเท่านั้น
        </p>
        <button 
          @click="currentUser.role = 'Admin'" 
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          สลับสิทธิ์เป็น Admin (เพื่อทดสอบ)
        </button>
      </div>

      <!-- Main Activity Log UI -->
      <template v-else>
        
        <!-- Header Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <History class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800">ประวัติการใช้งานระบบ (Activity Logs)</h1>
              <p class="text-xs text-slate-500">ตรวจสอบและติดตามการทำรายการข้อมูลย้อนหลังทั้งหมด</p>
            </div>
          </div>

          <!-- Dev Role Switcher Button -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">สิทธิ์ปัจจุบัน: <strong class="text-slate-700">{{ currentUser.role }}</strong></span>
            <button 
              @click="currentUser.role = 'Staff'" 
              class="px-2.5 py-1 text-xs bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
            >
              สลับเป็น Staff
            </button>
          </div>
        </div>

        <!-- Search Bar & Filters -->
        <div class="bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          
          <!-- Search Box -->
          <div class="relative w-full md:w-80">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="ค้นหาชื่อผู้ใช้, ตาราง หรือ IP..."
              class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Filter class="w-4 h-4 text-slate-400 shrink-0" />
              <select 
                v-model="selectedAction"
                class="w-full sm:w-auto text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">ประเภทคำสั่งทั้งหมด</option>
                <option value="INSERT">เพิ่มข้อมูล (INSERT)</option>
                <option value="UPDATE">แก้ไขข้อมูล (UPDATE)</option>
                <option value="DELETE">ลบข้อมูล (DELETE)</option>
              </select>
            </div>

            <div class="w-full sm:w-auto">
              <select 
                v-model="selectedTable"
                class="w-full sm:w-auto text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">ตารางทั้งหมด</option>
                <option value="items">items</option>
                <option value="assets">assets</option>
                <option value="stock_transactions">stock_transactions</option>
                <option value="users">users</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white/90 backdrop-blur rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 font-semibold uppercase tracking-wider">
                  <th class="py-3.5 px-6">วัน-เวลา</th>
                  <th class="py-3.5 px-6">ผู้ทำการรายการ</th>
                  <th class="py-3.5 px-6 text-center">ประเภทคำสั่ง</th>
                  <th class="py-3.5 px-6 text-center">ตารางที่เกี่ยวข้อง</th>
                  <th class="py-3.5 px-6 text-center">IP ADDRESS</th>
                  <th class="py-3.5 px-6 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                
                <tr 
                  v-for="log in filteredLogs" 
                  :key="log.id"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <!-- Timestamp -->
                  <td class="py-4 px-6 text-slate-700 whitespace-nowrap">
                    <div class="flex items-center gap-2 text-xs">
                      <Clock class="w-4 h-4 text-slate-400" />
                      <span>{{ log.created_at }}</span>
                    </div>
                  </td>

                  <!-- User -->
                  <td class="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap">
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                        <User class="w-3.5 h-3.5" />
                      </div>
                      <span>{{ log.user_name }}</span>
                    </div>
                  </td>

                  <!-- Action Badge -->
                  <td class="py-4 px-6 text-center whitespace-nowrap">
                    <div class="flex justify-center">
                      <span 
                        :class="[
                          'inline-flex items-center justify-center min-w-[110px] px-3 py-1 text-xs font-medium rounded-lg border',
                          getActionBadgeClass(log.action_type)
                        ]"
                      >
                        {{ log.action_th }}
                      </span>
                    </div>
                  </td>

                  <!-- Table Badge -->
                  <td class="py-4 px-6 whitespace-nowrap">
                    <div class="flex justify-center">
                      <span class="inline-flex items-center gap-1.5 min-w-[120px] px-3 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-mono justify-center">
                        <Database class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{{ log.table_name }}</span>
                      </span>
                    </div>
                  </td>

                  <!-- IP Address -->
                  <td class="py-4 px-6 text-slate-600 font-mono text-xs whitespace-nowrap">
                    <div class="flex items-center justify-center gap-1.5">
                      <Network class="w-3.5 h-3.5 text-slate-400" />
                      <span>{{ log.ip_address }}</span>
                    </div>
                  </td>

                  <!-- Detail Button -->
                  <td class="py-4 px-6 text-center whitespace-nowrap">
                    <button 
                      @click="openJsonModal(log)"
                      class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      <span>เปรียบเทียบค่า (JSON)</span>
                    </button>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="filteredLogs.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <History class="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p class="text-sm">ไม่พบข้อมูลประวัติการใช้งานที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

      </template>

    </div>

    <!-- Modal Inspection -->
    <div 
      v-if="isModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <div class="bg-white w-full max-w-3xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-2 text-slate-800 font-bold">
            <FileCode2 class="w-5 h-5 text-emerald-600" />
            <h3>รายละเอียดการเปลี่ยนแปลงข้อมูล (Log ID: #{{ selectedLogData?.id }})</h3>
          </div>
          <button 
            @click="closeModal" 
            class="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 block">ผู้ทำรายการ:</span>
              <span class="font-semibold text-slate-700">{{ selectedLogData?.user_name }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">คำสั่ง:</span>
              <span class="font-semibold text-slate-700">{{ selectedLogData?.action_th }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">ตาราง:</span>
              <span class="font-semibold text-slate-700 font-mono">{{ selectedLogData?.table_name }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">เวลา:</span>
              <span class="font-semibold text-slate-700">{{ selectedLogData?.created_at }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                ค่าเดิม (Old Value)
              </span>
              <div class="bg-slate-900 text-rose-300 font-mono text-xs p-3 rounded-lg overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.old_value">{{ JSON.stringify(selectedLogData.old_value, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลเดิม -
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                ค่าใหม่ (New Value)
              </span>
              <div class="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-lg overflow-x-auto min-h-[160px]">
                <pre v-if="selectedLogData?.new_value">{{ JSON.stringify(selectedLogData.new_value, null, 2) }}</pre>
                <div v-else class="h-full flex items-center justify-center text-slate-500 italic">
                  - ไม่มีข้อมูลใหม่ -
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            @click="closeModal" 
            class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>

  </div>
</template>