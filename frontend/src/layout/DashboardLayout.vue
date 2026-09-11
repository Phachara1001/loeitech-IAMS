<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import Topbar from '../components/Topbar.vue'

const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-800 print:block print:h-auto print:bg-white overflow-hidden relative">
    
    <!-- Mobile Overlay -->
    <Transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isMobileMenuOpen" 
        @click="closeMobileMenu"
        class="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <div 
      class="fixed inset-y-0 left-0 z-[60] lg:static lg:z-auto transition-transform duration-300 ease-in-out print:hidden flex shrink-0 h-full"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <Sidebar @close-mobile="closeMobileMenu" />
    </div>
    
    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col w-full min-w-0 overflow-hidden print:overflow-visible print:block">
      <!-- Topbar -->
      <Topbar @toggle-mobile-menu="toggleMobileMenu" class="print:hidden shrink-0" />
      
      <!-- Main Content area -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 print:overflow-visible print:p-0 print:bg-white print:block">
        <router-view />
      </main>
    </div>
  </div>
</template>
