<script setup>
import { Users, Facebook, Instagram } from 'lucide-vue-next'

const teamMembers = [
  {
    name: 'ครูพิชญะ พรมลา',
    position: 'ผู้บริหารระบบ',
    level: 'หัวหน้าแผนกเทคโนโลยีสารสนเทศ',
    image: '/team/ครูพิชญะ พรมลา.png',
    bgColor: 'bg-blue-500',
    isLeader: true,
    imageWidth: '200%',
    facebook: { name: 'Aump Pchy', link: 'https://www.facebook.com/Aump.Pichaya' },
    instagram: { name: 'aump.pchy', link: 'https://www.instagram.com/aump.pchy' }
  },
  {
    name: 'นางสาวณัฐรัตน์ เอี่ยมรัตน์',
    position: 'ผู้พัฒนาระบบ',
    level: 'นักศึกษาฝึกงาน',
    image: '/team/ณัฐรัตน์ เอี่ยมรัตน์.png',
    bgColor: 'bg-amber-400',
    facebook: { name: 'Nattarat Aiamrat', link: 'https://www.facebook.com/nattharat.aiamrat' },
    instagram: { name: 'sxlapaokubei_ei', link: 'https://www.instagram.com/sxlapaokubei_ei/' }
  },
  {
    name: 'นายพชร เพียซ้าย',
    position: 'ผู้พัฒนาระบบ / ผู้ควบคุม',
    level: 'ครูฝึกสอน',
    image: '/team/พชร เพียซ้าย.png',
    bgColor: 'bg-emerald-400',
    facebook: { name: 'Phachara Phiasai', link: 'https://www.facebook.com/phachara.piasai.2025' },
    instagram: { name: 'ppphachara_', link: 'https://www.instagram.com/ppphachara_/' }
  },
  {
    name: 'นายภคิน เชื้อบุญมี',
    position: 'ผู้พัฒนาระบบ',
    level: 'นักศึกษาฝึกงาน',
    image: '/team/ภคิน เชื้อบุญมี.png',
    bgColor: 'bg-rose-400',
    facebook: { name: 'Phakin Chueaboonmee', link: 'https://www.facebook.com/ker7964' },
    instagram: { name: '_mcker_', link: 'https://www.instagram.com/_mcker_/' }
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#F4F7F5] font-sarabun p-4 sm:p-6 lg:p-8">
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12 md:p-16 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-extrabold text-[#072415] mb-6 tracking-tight">ทีมผู้พัฒนาระบบ</h1>
        <p class="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          ระบบสารสนเทศเพื่อการบริหารจัดการครุภัณฑ์และพัสดุสิ้นเปลือง พัฒนาและออกแบบโดยนักศึกษาฝึกงาน
          แผนกเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเลย
        </p>
      </div>

      <!-- Team Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-28 mt-24">
        <div v-for="(member, index) in teamMembers" :key="index"
          class="flex flex-col items-center text-center group cursor-pointer w-full"
          :class="member.isLeader ? 'sm:col-span-2 md:col-span-3 max-w-sm mx-auto' : ''">
          <!-- Image Container (Perfect Square) -->
          <!-- clip-path allows top, left, right overflow but clips the bottom to match the rounded corners -->
          <div
            class="relative w-full aspect-[4/3] mb-8 mt-8 origin-bottom transition-transform duration-500 group-hover:scale-105"
            style="clip-path: inset(-50% -50% 0 -50% round 0 0 2.5rem 2.5rem); -webkit-clip-path: inset(-50% -50% 0 -50% round 0 0 2.5rem 2.5rem);">
            <!-- Colored Background Box -->
            <div class="absolute inset-0 w-full h-full rounded-[2.5rem]" :class="member.bgColor">
            </div>

            <!-- Image (Popping out & Larger) -->
            <!-- Scales slightly more than the container on hover for a 3D effect -->
            <img :src="member.image" :alt="member.name"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 h-auto max-w-none max-h-[140%] object-contain object-bottom transition-transform duration-500 origin-bottom group-hover:scale-105 z-10"
              :style="`width: ${member.imageWidth || '125%'}; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.25));`" />
          </div>

          <!-- Info -->
          <h3 class="text-2xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-pink-600">{{ member.name
            }}</h3>
          <p class="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6">{{ member.position }}
            &nbsp;•&nbsp; {{ member.level }}</p>

          <!-- Social Media Buttons -->
          <div class="flex flex-col gap-3 items-center w-full max-w-[220px]">
            <!-- Facebook -->
            <a v-if="member.facebook" :href="member.facebook.link" target="_blank" @click.stop
              class="group/btn relative flex items-center h-10 w-full rounded-full overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:scale-105 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/30">

              <!-- Expanding Background -->
              <div
                class="absolute inset-y-0 left-[-10%] w-[35%] bg-slate-200 transition-all duration-300 ease-out -skew-x-12 group-hover/btn:w-[120%] group-hover/btn:bg-[#1877F2]">
              </div>

              <!-- Icon -->
              <div
                class="relative z-10 w-12 flex items-center justify-center pl-1 text-slate-500 group-hover/btn:text-white transition-colors duration-300">
                <Facebook class="w-4 h-4" />
              </div>

              <!-- Text -->
              <div
                class="relative z-10 flex-1 px-2 text-left font-bold text-[13px] text-slate-600 group-hover/btn:text-white transition-colors duration-300 truncate">
                {{ member.facebook.name }}
              </div>
            </a>

            <!-- Instagram -->
            <a v-if="member.instagram" :href="member.instagram.link" target="_blank" @click.stop
              class="group/btn relative flex items-center h-10 w-full rounded-full overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:scale-105 hover:border-transparent hover:shadow-lg hover:shadow-pink-500/30">

              <!-- Expanding Background -->
              <div
                class="absolute inset-y-0 left-[-10%] w-[35%] bg-slate-200 transition-all duration-300 ease-out -skew-x-12 group-hover/btn:w-[120%] group-hover/btn:bg-gradient-to-r group-hover/btn:from-[#833ab4] group-hover/btn:via-[#fd1d1d] group-hover/btn:to-[#fcb045]">
              </div>

              <!-- Icon -->
              <div
                class="relative z-10 w-12 flex items-center justify-center pl-1 text-slate-500 group-hover/btn:text-white transition-colors duration-300">
                <Instagram class="w-4 h-4" />
              </div>

              <!-- Text -->
              <div
                class="relative z-10 flex-1 px-2 text-left font-bold text-[13px] text-slate-600 group-hover/btn:text-white transition-colors duration-300 truncate">
                {{ member.instagram.name }}
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

.font-sarabun {
  font-family: 'Sarabun', sans-serif;
}
</style>
