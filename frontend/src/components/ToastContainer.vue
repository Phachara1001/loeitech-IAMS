<script setup>
import { X } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()

const getTitle = (type) => {
  switch (type) {
    case 'success': return 'สำเร็จ!'
    case 'error': return 'ผิดพลาด!'
    case 'warning': return 'คำเตือน!'
    case 'info': return 'ช่วยเหลือ!'
    default: return 'แจ้งเตือน!'
  }
}

const getLineColor = (type) => {
  switch (type) {
    case 'success': return 'bg-[#00a859]'
    case 'error': return 'bg-[#e23654]'
    case 'warning': return 'bg-[#f0851d]'
    case 'info': return 'bg-[#0070e0]'
    default: return 'bg-slate-500'
  }
}

const getTitleColor = (type) => {
  switch (type) {
    case 'success': return 'text-[#00a859]'
    case 'error': return 'text-[#e23654]'
    case 'warning': return 'text-[#f0851d]'
    case 'info': return 'text-[#0070e0]'
    default: return 'text-slate-600'
  }
}
</script>

<template>
  <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-[340px] max-w-[calc(100vw-3rem)] print:hidden">
    <TransitionGroup enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-4 opacity-0 sm:-translate-y-0 sm:translate-x-8"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0" leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100" leave-to-class="opacity-0 translate-x-8">
      <div v-for="toast in toasts" :key="toast.id"
        class="relative flex items-center p-5 bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 pr-10 min-h-[5rem]">

        <!-- Vertical Pill Line -->
        <div
          :class="['absolute left-4 top-1/2 -translate-y-1/2 h-[38px] w-[5px] rounded-full', getLineColor(toast.type)]">
        </div>

        <!-- Content -->
        <div class="ml-4 w-full">
          <h4 :class="['text-[16px] font-bold mb-1 tracking-tight', getTitleColor(toast.type)]">{{ getTitle(toast.type)
            }}</h4>
          <p class="text-[13px] text-slate-500 font-medium leading-[1.4] pr-2">{{ toast.message }}</p>
        </div>

        <!-- Close Button -->
        <button @click="removeToast(toast.id)"
          class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-0 p-1 cursor-pointer">
          <span class="sr-only">Close</span>
          <X class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
