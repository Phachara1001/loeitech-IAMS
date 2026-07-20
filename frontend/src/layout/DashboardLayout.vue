<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import Topbar from '../components/Topbar.vue'
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-800">
    <!-- Sidebar -->
    <Sidebar />
    
    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <Topbar />
      
      <!-- Main Content area -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
