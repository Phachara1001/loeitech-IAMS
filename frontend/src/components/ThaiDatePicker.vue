<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'date' }, // 'date' | 'datetime-local'
  placeholder: { type: String, default: 'เลือกวันที่' },
  required: { type: Boolean, default: false },
  inputClass: { type: String, default: 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/20 focus:border-[#065f46] transition bg-white' }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const popoverRef = ref(null)
const popoverStyle = ref({ top: '100%', bottom: 'auto', marginTop: '0.5rem', marginBottom: '0' })

async function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    adjustPosition()
  }
}

function adjustPosition() {
  if (!popoverRef.value) return
  const triggerRect = popoverRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top
  
  // popover height is ~420px for datetime
  if (spaceBelow < 420 && spaceAbove > spaceBelow) {
    popoverStyle.value = { bottom: '100%', top: 'auto', marginBottom: '0.5rem', marginTop: '0' }
  } else {
    popoverStyle.value = { top: '100%', bottom: 'auto', marginTop: '0.5rem', marginBottom: '0' }
  }
}

// Current view in the calendar (Month/Year)
const currentViewDate = ref(new Date())

// Selected date/time state
const selectedDate = ref(null)
const timeHours = ref('00')
const timeMinutes = ref('00')

// Thai strings
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const THAI_DAYS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']

// Initialize from modelValue
function initFromModel() {
  if (props.modelValue) {
    const d = new Date(props.modelValue)
    if (!isNaN(d.getTime())) {
      selectedDate.value = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      currentViewDate.value = new Date(d.getFullYear(), d.getMonth(), 1)
      timeHours.value = String(d.getHours()).padStart(2, '0')
      timeMinutes.value = String(d.getMinutes()).padStart(2, '0')
    }
  } else {
    selectedDate.value = null
    const now = new Date()
    currentViewDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    timeHours.value = '12'
    timeMinutes.value = '00'
  }
}

watch(() => props.modelValue, initFromModel, { immediate: true })
watch(isOpen, (val) => {
  if (val) initFromModel() // Reset view when opening
})

const currentMonthName = computed(() => THAI_MONTHS[currentViewDate.value.getMonth()])
const currentYearThai = computed(() => currentViewDate.value.getFullYear() + 543)

// Calendar generation
const calendarDays = computed(() => {
  const year = currentViewDate.value.getFullYear()
  const month = currentViewDate.value.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDayOfMonth.getDate()
  
  // getDay() gives 0 for Sunday, 1 for Monday
  // We want Monday = 0, Sunday = 6
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
  
  const days = []
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    })
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    })
  }
  
  // Next month padding
  const remaining = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    })
  }
  
  return days
})

function prevMonth() {
  currentViewDate.value = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentViewDate.value = new Date(currentViewDate.value.getFullYear(), currentViewDate.value.getMonth() + 1, 1)
}

function isSelected(dateObj) {
  if (!selectedDate.value) return false
  return dateObj.getTime() === selectedDate.value.getTime()
}

function isToday(dateObj) {
  const today = new Date()
  return dateObj.getDate() === today.getDate() && 
         dateObj.getMonth() === today.getMonth() && 
         dateObj.getFullYear() === today.getFullYear()
}

function selectDate(dateObj) {
  selectedDate.value = dateObj
  if (props.type === 'date') {
    applySelection() // Auto apply for date only
  }
}

function applySelection() {
  if (!selectedDate.value) {
    isOpen.value = false
    return
  }
  
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(selectedDate.value.getDate()).padStart(2, '0')
  
  let val = `${year}-${month}-${day}`
  
  if (props.type === 'datetime-local') {
    val += `T${timeHours.value}:${timeMinutes.value}`
  }
  
  emit('update:modelValue', val)
  isOpen.value = false
}

// Display format for the input field
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const d = new Date(props.modelValue)
  if (isNaN(d.getTime())) return ''
  
  const dateStr = d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  if (props.type === 'datetime-local') {
    const timeStr = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${dateStr} เวลา ${timeStr} น.`
  }
  return dateStr
})

// Click outside handler
function handleClickOutside(event) {
  if (popoverRef.value && !popoverRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="relative" ref="popoverRef">
    <!-- Input Trigger -->
    <div class="relative cursor-pointer" @click="toggleOpen">
      <input 
        type="text" 
        readonly
        :value="displayValue"
        :placeholder="placeholder"
        :required="required"
        :class="['cursor-pointer pr-10', inputClass]" />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
        <CalendarIcon class="w-4 h-4" />
      </div>
    </div>

    <!-- Custom Popover Calendar -->
    <div v-if="isOpen" 
      :style="popoverStyle"
      class="absolute z-50 p-5 bg-white rounded-2xl shadow-2xl border border-slate-100 w-80 select-none transform transition-all origin-top scale-100 opacity-100">
      
      <!-- Header: Month/Year and Arrows -->
      <div class="flex items-center justify-between mb-6 px-1">
        <div class="flex gap-1 font-bold text-slate-900 text-[1.05rem]">
          <select :value="currentViewDate.getMonth()" @change="(e) => { currentViewDate = new Date(currentViewDate.getFullYear(), Number(e.target.value), 1) }" class="bg-transparent focus:outline-none cursor-pointer hover:bg-slate-100 rounded px-1 pb-1">
            <option v-for="(m, i) in THAI_MONTHS" :key="i" :value="i">{{ m }}</option>
          </select>
          <select :value="currentViewDate.getFullYear()" @change="(e) => { currentViewDate = new Date(Number(e.target.value), currentViewDate.getMonth(), 1) }" class="bg-transparent focus:outline-none cursor-pointer hover:bg-slate-100 rounded px-1 pb-1 text-center">
            <option v-for="i in 101" :key="i" :value="new Date().getFullYear() - 51 + i">{{ new Date().getFullYear() - 51 + i + 543 }}</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button type="button" @click.stop="prevMonth" class="p-1 rounded hover:bg-slate-100 text-slate-800 transition-colors">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button type="button" @click.stop="nextMonth" class="p-1 rounded hover:bg-slate-100 text-slate-800 transition-colors">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Days Header -->
      <div class="grid grid-cols-7 gap-1 text-center mb-3">
        <div v-for="day in THAI_DAYS" :key="day" class="text-[13px] font-bold text-slate-800 py-1">
          {{ day }}
        </div>
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
        <div v-for="(day, idx) in calendarDays" :key="idx"
          @click.stop="selectDate(day.date)"
          class="h-10 w-10 mx-auto flex items-center justify-center rounded-lg cursor-pointer transition-all text-[15px]"
          :class="[
            isSelected(day.date) ? 'bg-[#1e293b] text-white font-bold' 
            : day.isCurrentMonth ? 'text-slate-800 hover:bg-slate-100 font-medium' 
            : 'text-slate-400 font-medium'
          ]">
          {{ day.date.getDate() }}
        </div>
      </div>

      <!-- Time Picker (Only for datetime-local) -->
      <div v-if="type === 'datetime-local'" class="mt-6 flex justify-end">
        <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-lg font-bold text-slate-900 bg-white">
          <select v-model="timeHours" class="bg-transparent focus:outline-none appearance-none cursor-pointer px-1">
            <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2, '0')">{{ String(h-1).padStart(2, '0') }}</option>
          </select>
          <span class="text-slate-400">:</span>
          <select v-model="timeMinutes" class="bg-transparent focus:outline-none appearance-none cursor-pointer px-1">
            <option v-for="m in 60" :key="m-1" :value="String(m-1).padStart(2, '0')">{{ String(m-1).padStart(2, '0') }}</option>
          </select>
        </div>
      </div>

      <!-- Action Button -->
      <div v-if="type === 'datetime-local'" class="mt-5">
        <button type="button" @click.stop="applySelection" 
          class="w-full py-3.5 bg-[#1e293b] text-white font-semibold text-[15px] rounded-xl hover:bg-slate-900 transition-colors shadow-md">
          ยืนยันวันและเวลา
        </button>
      </div>
    </div>
  </div>
</template>
