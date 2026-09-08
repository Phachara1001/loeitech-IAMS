<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import Topbar from '../components/Topbar.vue'
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-800 print:block print:h-auto print:bg-white">
    <!-- Sidebar -->
    <Sidebar class="print:hidden" />
    
    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
      <!-- Topbar -->
      <Topbar class="print:hidden" />
      
      <!-- Main Content area -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 print:overflow-visible print:p-0 print:bg-white print:block">
        <router-view />
      </main>
    </div>
  </div>
</template>
