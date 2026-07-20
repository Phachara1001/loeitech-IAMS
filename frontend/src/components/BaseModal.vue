<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'max-w-md' // options: max-w-sm, max-w-md, max-w-lg, max-w-xl, max-w-2xl, max-w-4xl, max-w-full
  },
  showFooter: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop & Overlay -->
    <div v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-opacity">
      <!-- Modal Panel -->
      <div class="bg-white rounded-xl shadow-xl w-full overflow-hidden flex flex-col max-h-[90vh]" :class="maxWidth"
        @click.stop>

        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <slot name="header">
            <h3 class="font-bold text-slate-800 text-lg">{{ title }}</h3>
          </slot>
          <button @click="close"
            class="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="showFooter"
          class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
          <slot name="footer">
            <button @click="close"
              class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm transition-colors">
              ปิด (Close)
            </button>
          </slot>
        </div>

      </div>
    </div>
  </Teleport>
</template>
