<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  PackageSearch, Download, History,
  Database, SendToBack, CalendarClock,
  ClipboardList, FilePlus,
  Settings, Activity, FileText
} from 'lucide-vue-next'

const route = useRoute()

const menuGroups = [
  {
    title: 'ภาพรวมระบบ',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'ระบบพัสดุสิ้นเปลือง',
    items: [
      { name: 'ทะเบียนพัสดุ', path: '/inventory-stock', icon: PackageSearch },
      { name: 'บันทึกรับเข้าพัสดุ', path: '/inventory-receive', icon: Download },
      { name: 'ประวัติเคลื่อนไหว', path: '/inventory-history', icon: History },
    ]
  },
  {
    title: 'ระบบครุภัณฑ์',
    items: [
      { name: 'ทะเบียนครุภัณฑ์', path: '/asset-list', icon: Database },
      { name: 'จ่ายครุภัณฑ์ให้หน่วย', path: '/asset-distribution', icon: SendToBack },
      { name: 'ประวัติซ่อม/เคลื่อนย้าย', path: '/asset-timeline', icon: CalendarClock },
    ]
  },
  {
    title: 'ระบบเบิกจ่าย',
    items: [
      { name: 'รายการคำขอเบิก', path: '/requisition-management', icon: ClipboardList },
      { name: 'ยื่นคำขอเบิก', path: '/new-requisition', icon: FilePlus },
    ]
  },
  {
    title: 'ผู้ดูแลระบบ',
    items: [
      { name: 'จัดการข้อมูลพื้นฐาน', path: '/master-data', icon: Settings },
      { name: 'ประวัติการใช้งานระบบ', path: '/activity-logs', icon: Activity },
      { name: 'ออกรายงาน/ส่งออก', path: '/report-export', icon: FileText },
    ]
  }
]

const isActive = (path) => {
  if (path === '/' && route.path !== '/') return false
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-64 bg-emerald-800 text-slate-100 flex flex-col transition-all duration-300">
    <div
      class="h-16 flex items-center px-6 border-b border-emerald-700/50 text-white font-bold text-lg tracking-wide shrink-0">
      <div class="w-8 h-8 rounded bg-emerald-600 mr-3 flex items-center justify-center text-white">
        <Database :size="20" />
      </div>
      TCAIMS
    </div>

    <div class="py-4 flex-1 overflow-y-auto space-y-6">
      <div v-for="(group, idx) in menuGroups" :key="idx" class="px-2">
        <div class="px-4 mb-2 text-xs font-semibold text-emerald-300/80 uppercase tracking-wider">
          {{ group.title }}
        </div>
        <nav class="space-y-1">
          <router-link v-for="item in group.items" :key="item.path" :to="item.path"
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
        <span class="text-emerald-200">System Online</span>
      </div>
    </div>
  </aside>
</template>
