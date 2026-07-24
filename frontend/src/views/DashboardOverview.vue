<script setup>
import { ref } from 'vue'
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-vue-next'

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const stats = [
  {
    title: 'จำนวนพัสดุทั้งหมด',
    value: '2,540',
    change: 'เพิ่มขึ้น 12% จากเดือนที่แล้ว',
    icon: Boxes,
    color: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  {
    title: 'พัสดุสิ้นเปลืองใกล้หมดคลัง',
    value: '24',
    change: 'ต้องการการสั่งซื้อเพิ่มเติม',
    icon: AlertTriangle,
    color: 'text-amber-700',
    bg: 'bg-amber-50'
  },
  {
    title: 'ครุภัณฑ์สถานะใช้งานปกติ',
    value: '892',
    change: 'ครุภัณฑ์พร้อมใช้งาน',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50'
  },
  {
    title: 'คำขอเบิกที่รอดำเนินการ',
    value: '18',
    change: 'รอการอนุมัติ 8 รายการ',
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-50'
  }
]

const recentActivities = ref([
  { id: 1, action: 'เพิ่มครุภัณฑ์ใหม่', item: 'คอมพิวเตอร์ All-in-One Dell', user: 'สมชาย ใจดี', time: '10 นาทีที่แล้ว', status: 'success' },
  { id: 2, action: 'อนุมัติเบิกจ่ายพัสดุ', item: 'กระดาษ A4 (5 รีม)', user: 'แอดมิน ระบบ', time: '1 ชั่วโมงที่แล้ว', status: 'info' },
  { id: 3, action: 'แจ้งซ่อมครุภัณฑ์', item: 'โปรเจคเตอร์ Epson EB-X05', user: 'สมศักดิ์ ช่างซ่อม', time: '3 ชั่วโมงที่แล้ว', status: 'warning' },
  { id: 4, action: 'จำหน่ายครุภัณฑ์', item: 'เก้าอี้สำนักงานชำรุด 5 ตัว', user: 'แอดมิน ระบบ', time: '1 วันที่แล้ว', status: 'danger' },
  { id: 5, action: 'รับเข้าวัสดุสิ้นเปลือง', item: 'หมึกพิมพ์ HP 85A', user: 'สมชาย ใจดี', time: '2 วันที่แล้ว', status: 'success' },
  { id: 6, action: 'ยื่นคำขอเบิกพัสดุ', item: 'แฟ้มเอกสาร (10 ชิ้น)', user: 'วิภา รักเรียน', time: '2 วันที่แล้ว', status: 'warning' },
  { id: 7, action: 'ย้ายสถานที่ติดตั้ง', item: 'แอร์ 24,000 BTU', user: 'สมศักดิ์ ช่างซ่อม', time: '3 วันที่แล้ว', status: 'info' },
])

const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'bg-emerald-50 text-emerald-700'
    case 'warning': return 'bg-amber-50 text-amber-700'
    case 'danger': return 'bg-rose-50 text-rose-700'
    case 'info':
    default: return 'bg-blue-50 text-blue-700'
  }
}

const chartData = {
  labels: ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'],
  datasets: [
    {
      label: 'ปริมาณการเบิกจ่าย (ครั้ง)',
      backgroundColor: '#047857', // Emerald 700
      borderRadius: 4,
      data: [45, 52, 38, 60, 42, 55, 38, 41, 65, 70, 0, 0] // Mock data representing current fiscal year
    }
  ]
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      titleFont: { family: 'Sarabun' },
      bodyFont: { family: 'Sarabun' }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { font: { family: 'Sarabun' } },
      grid: { borderDash: [4, 4] }
    },
    x: {
      ticks: { font: { family: 'Sarabun' } },
      grid: { display: false }
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 shrink-0">
          <Boxes class="w-6 h-6 text-emerald-200" />
        </div>
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-white">ภาพรวมระบบ (Dashboard)</h2>
          <p class="text-sm text-emerald-100/80 mt-0.5">สรุปข้อมูลภาพรวมพัสดุ ครุภัณฑ์ และปริมาณการเบิกจ่าย</p>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div v-for="(stat, index) in stats" :key="index"
        class="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-start space-x-4 transition-all hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5">
        <div :class="[stat.bg, stat.color, 'p-3 rounded-xl flex-shrink-0 ring-1 ring-black/5']">
          <component :is="stat.icon" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
          <h3 class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</h3>
          <p class="text-xs text-slate-400 mt-1">{{ stat.change }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
        <div class="px-6 py-5 border-b border-emerald-50 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <Boxes class="w-4 h-4 text-[#065f46]" />
            </div>
            <h3 class="font-bold text-slate-800 text-lg">สถิติการเบิกจ่ายพัสดุ (ปีงบประมาณ 2569)</h3>
          </div>
          <select
            class="text-sm border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46]">
            <option>พัสดุสิ้นเปลือง</option>
            <option>ครุภัณฑ์</option>
          </select>
        </div>
        <div class="p-6 h-80">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
        <div class="px-6 py-5 border-b border-emerald-50">
          <h3 class="font-bold text-slate-800 text-lg">เมนูด่วน</h3>
        </div>
        <div class="p-6 space-y-3">
          <router-link to="/inventory-receive"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <Boxes class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              รับเข้าพัสดุ
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>

          <router-link to="/asset-distribution"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <AlertTriangle class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              แจ้งซ่อม/ชำรุด
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>

          <router-link to="/requisition-management"
            class="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#065f46] hover:bg-emerald-50 hover:shadow-md transition-all group">
            <div class="flex items-center text-slate-700 group-hover:text-[#065f46] font-semibold">
              <div
                class="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mr-3 transition-all group-hover:scale-110">
                <CheckCircle2 class="w-4 h-4 text-slate-500 group-hover:text-[#065f46]" />
              </div>
              อนุมัติเบิกจ่าย
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Recent Activity Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      <div class="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-[#065f46] to-[#047857]">
        <h3 class="font-bold text-white text-lg">ประวัติกิจกรรมล่าสุดในระบบ</h3>
        <router-link to="/activity-logs"
          class="text-sm text-[#065f46] font-bold hover:shadow-md flex items-center bg-white px-3.5 py-1.5 rounded-lg shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all">
          ดูทั้งหมด
          <ArrowRight class="w-4 h-4 ml-1" />
        </router-link>
      </div>
      <div class="overflow-x-auto max-h-[55vh] overflow-y-auto no-scrollbar">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="sticky top-0 z-10">
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
              <th class="px-6 py-3.5">กิจกรรม</th>
              <th class="px-6 py-3.5">รายการ/เป้าหมาย</th>
              <th class="px-6 py-3.5">ผู้ดำเนินการ</th>
              <th class="px-6 py-3.5">เวลา</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="activity in recentActivities" :key="activity.id" class="group hover:bg-emerald-50/60 transition-colors">
              <td class="px-6 py-4 border-l-4 border-transparent group-hover:border-[#065f46] transition-colors">
                <div class="flex items-center">
                  <div class="w-2.5 h-2.5 rounded-full mr-3" :class="getStatusColor(activity.status).split(' ')[0]">
                  </div>
                  <span class="font-medium text-slate-800">{{ activity.action }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ activity.item }}</td>
              <td class="px-6 py-4 text-slate-600">{{ activity.user }}</td>
              <td class="px-6 py-4 text-slate-500">{{ activity.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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