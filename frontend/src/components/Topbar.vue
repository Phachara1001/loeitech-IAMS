<script setup>
import { Bell, Search, User } from 'lucide-vue-next'
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
    <div class="flex items-center">
      <h1 class="text-xl font-semibold text-slate-900 hidden sm:block">
        ระบบบริหารครุภัณฑ์
      </h1>
      <div class="ml-4 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
        ปีงบประมาณ 2569
      </div>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="relative hidden md:block">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="ค้นหาด่วน..." 
          class="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
        />
      </div>
      
      <button class="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
      </button>
      
      <div class="h-8 w-px bg-slate-200 mx-2"></div>
      
      <router-link to="/profile" class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
        <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
          <User class="w-4 h-4" />
        </div>
        <div class="text-left hidden sm:block">
          <div class="text-sm font-medium text-slate-700 leading-none">Admin User</div>
          <div class="text-xs text-slate-500 mt-1">ผู้ดูแลระบบ</div>
        </div>
      </router-link>
    </div>
  </header>
</template>
