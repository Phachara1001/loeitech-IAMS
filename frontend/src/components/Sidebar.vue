<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  PackageSearch, Download, History,
  Database, SendToBack, CalendarClock,
  ClipboardList, FilePlus,
  Settings, Activity, FileText,
  Recycle, ClipboardCheck, ArrowLeftRight, Wrench, CalendarCheck, Users, X
} from 'lucide-vue-next'

const emit = defineEmits(['close-mobile'])
const route = useRoute()

// สิทธิ์การเข้าถึงเมนู: ดึงจาก role จริงที่ตั้งไว้ตอน login (admin/staff/user)
const currentRole = ref(localStorage.getItem('tcaims_role') || 'user')

const menuGroups = [
  {
    title: 'ภาพรวมระบบ',
    items: [
      { name: 'หน้าแรก', path: '/', icon: LayoutDashboard, roles: ['admin', 'staff', 'user'] },
    ]
  },
  {
    title: 'ระบบพัสดุสิ้นเปลือง',
    items: [
      { name: 'ทะเบียนพัสดุ', path: '/inventory-stock', icon: PackageSearch, roles: ['admin', 'staff', 'user'] },
      { name: 'บันทึกรับเข้าพัสดุ', path: '/inventory-receive', icon: Download, roles: ['admin', 'staff'] },
      { name: 'ประวัติเคลื่อนไหว', path: '/inventory-history', icon: History, roles: ['admin', 'staff'] },
      { name: 'ตรวจสอบพัสดุประจำปี', path: '/inventory-check', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    ]
  },
  {
    title: 'ระบบครุภัณฑ์',
    items: [
      { name: 'ทะเบียนครุภัณฑ์', path: '/asset-list', icon: Database, roles: ['admin', 'staff', 'user'] },
      { name: 'จ่ายครุภัณฑ์ให้หน่วย', path: '/asset-distribution', icon: SendToBack, roles: ['admin', 'staff'] },
      { name: 'ประวัติซ่อม/เคลื่อนย้าย', path: '/asset-timeline', icon: CalendarClock, roles: ['admin', 'staff', 'user'] },
      { name: 'จำหน่ายพัสดุ/ครุภัณฑ์', path: '/asset-disposal', icon: Recycle, roles: ['admin', 'staff'] },
    ]
  },
  {
    title: 'ระบบยืม-คืน และแจ้งซ่อม',
    items: [
      { name: 'ยืม-คืนพัสดุ/ครุภัณฑ์', path: '/borrow-return', icon: ArrowLeftRight, roles: ['admin', 'staff', 'user'] },
      { name: 'แจ้งซ่อม/บำรุงรักษา', path: '/maintenance-repair', icon: Wrench, roles: ['admin', 'staff', 'user'] },
    ]
  },
  {
    title: 'ระบบเบิกจ่าย',
    items: [
      { name: 'รายการคำขอเบิก', path: '/requisition-management', icon: ClipboardList, roles: ['admin', 'staff', 'user'] },
      { name: 'ยื่นคำขอเบิก', path: '/new-requisition', icon: FilePlus, roles: ['admin', 'staff', 'user'] },
    ]
  },
  {
    title: 'ผู้ดูแลระบบ',
    items: [
      { name: 'จัดการข้อมูลพื้นฐาน', path: '/master-data', icon: Settings, roles: ['admin'] },
      { name: 'ประวัติการใช้งานระบบ', path: '/activity-logs', icon: Activity, roles: ['admin'] },
      { name: 'ออกรายงาน/ส่งออก', path: '/report-export', icon: FileText, roles: ['admin', 'staff'] },
      { name: 'ตั้งค่าปีงบประมาณ', path: '/fiscal-year-settings', icon: CalendarCheck, roles: ['admin'] },
    ]
  },
  {
    title: 'เกี่ยวกับระบบ',
    items: [
      { name: 'คู่มือการใช้งาน', path: '/manual', icon: FileText, roles: ['admin', 'staff', 'user'] },
      { name: 'ทีมผู้พัฒนาระบบ', path: '/team', icon: Users, roles: ['admin', 'staff', 'user'] }
    ]
  }
]

// กรองเมนูตามสิทธิ์: เอาเฉพาะ item ที่ role ปัจจุบันมีสิทธิ์เห็น
// และซ่อนทั้งกลุ่มถ้าไม่มี item เหลือให้แสดงเลยสักอัน (กันหัวข้อกลุ่มลอยเปล่า ๆ)
const visibleMenuGroups = computed(() => {
  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole.value))
    }))
    .filter((group) => group.items.length > 0)
})

const isActive = (path) => {
  if (path === '/' && route.path !== '/') return false
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-64 bg-emerald-800 text-slate-100 flex flex-col transition-all duration-300">
    <div class="py-4 flex items-center justify-between px-5 border-b border-emerald-700/50 text-white tracking-wide shrink-0">
      <div class="flex items-center">
        <div class="w-12 h-12 mr-3 flex items-center justify-center text-white shrink-0">
          <img src="../../public/logo1.png" class="w-full h-full object-contain" />
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-xl leading-tight">IT-IAMS</span>
          <span class="text-[10px] text-emerald-200 leading-tight mt-1">ระบบบริหารครุภัณฑ์</span>
          <span class="text-[10px] text-emerald-200 leading-tight">แผนกเทคโนโลยีสารสนเทศ</span>
        </div>
      </div>
      
      <!-- Close button for mobile -->
      <button @click="emit('close-mobile')" class="p-2 lg:hidden rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- เพิ่มคลาสสำหรับซ่อน Scrollbar แท็บเลื่อนข้างซ้าย -->
    <div class="py-4 flex-1 overflow-y-auto space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-for="(group, idx) in visibleMenuGroups" :key="idx" class="px-2">
        <div class="px-4 mb-2 text-xs font-semibold text-emerald-300/80 uppercase tracking-wider">
          {{ group.title }}
        </div>
        <nav class="space-y-1">
          <router-link v-for="item in group.items" :key="item.path" :to="item.path"
            @click="emit('close-mobile')"
            class="flex items-center px-3 py-2.5 rounded-lg transition-colors group relative"
            :class="isActive(item.path) ? 'bg-emerald-700 text-white font-medium shadow-sm' : 'hover:bg-emerald-700 hover:text-white text-slate-200'">
            <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0 transition-colors"
              :class="isActive(item.path) ? 'text-emerald-100' : 'text-emerald-300/70 group-hover:text-white'" />
            <span class="truncate text-sm">{{ item.name }}</span>

            <div v-if="isActive(item.path)" class="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-md"></div>
          </router-link>
        </nav>
      </div>
    </div>

    <div class="p-4 border-t border-emerald-700/50">
      <div class="flex items-center space-x-3 text-sm">
        <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
        <span class="text-emerald-200">&copy; IT_LOEITECH</span>
      </div>
    </div>
  </aside>
</template>