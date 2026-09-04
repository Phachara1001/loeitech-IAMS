<script setup>
import { ref, computed } from 'vue'
import {
  LayoutDashboard,
  PackageSearch,
  Download,
  History,
  ClipboardCheck,
  Database,
  SendToBack,
  CalendarClock,
  Recycle,
  ArrowLeftRight,
  Wrench,
  ClipboardList,
  FilePlus,
  Settings,
  Activity,
  FileText,
  CalendarCheck,
  Info
} from 'lucide-vue-next'

const currentRole = ref((localStorage.getItem('tcaims_role') || 'user').toLowerCase())
const activeTab = ref('overview')

const isStaff = computed(() => ['admin', 'staff'].includes(currentRole.value))
const isAdmin = computed(() => currentRole.value === 'admin')

// กำหนดหัวข้อตามสิทธิ์
const tabs = computed(() => {
  const list = [
    { id: 'overview', title: 'การเริ่มต้นใช้งาน', icon: Info },
    { id: 'dashboard', title: 'ภาพรวมระบบ (Dashboard)', icon: LayoutDashboard },
    { id: 'inventory', title: 'ระบบพัสดุสิ้นเปลือง', icon: PackageSearch },
    { id: 'asset', title: 'ระบบครุภัณฑ์', icon: Database },
    { id: 'borrow', title: 'ระบบยืม-คืน', icon: ArrowLeftRight },
    { id: 'repair', title: 'ระบบแจ้งซ่อม', icon: Wrench },
    { id: 'requisition', title: 'ระบบเบิกจ่าย', icon: ClipboardList }
  ]
  if (isAdmin.value) {
    list.push({ id: 'admin', title: 'ผู้ดูแลระบบ', icon: Settings })
  }
  return list
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e21] via-[#0b3d2c] to-[#0f5138] px-6 py-8 sm:px-10 sm:py-12 shadow-lg shadow-emerald-950/20">
      <div class="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl"></div>

      <div class="relative flex items-center gap-6 z-10">
        <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 shrink-0 shadow-inner">
          <FileText class="w-8 h-8 text-emerald-200" />
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">คู่มือการใช้งานระบบ (User Manual)</h1>
          <p class="text-base sm:text-lg text-emerald-100/90 font-medium max-w-2xl">
            คู่มือนี้ถูกปรับแต่งให้แสดงเฉพาะเมนูและฟังก์ชันที่คุณสามารถเข้าถึงได้ตามระดับสิทธิ์ <strong class="text-white bg-emerald-800/50 px-2 py-0.5 rounded ml-1">{{ currentRole.toUpperCase() }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar Tabs -->
      <div class="w-full md:w-72 shrink-0">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-3 space-y-1 sticky top-6">
          <button
            v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition-all',
              activeTab === tab.id 
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            ]"
          >
            <component :is="tab.icon" :class="['w-5 h-5', activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400']" />
            {{ tab.title }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 lg:p-10 min-h-[600px]">
          
          <!-- Tab 1: Overview -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">การเริ่มต้นใช้งาน</h2>
            <div class="prose prose-slate max-w-none text-slate-700">
              <p class="text-lg">ยินดีต้อนรับสู่ระบบ <strong>IT-IAMS (ระบบบริหารครุภัณฑ์และพัสดุสิ้นเปลือง แผนกเทคโนโลยีสารสนเทศ)</strong></p>
              <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg my-6">
                <h4 class="text-blue-800 font-bold m-0 flex items-center gap-2"><Info class="w-5 h-5"/> ข้อมูลระดับสิทธิ์ของคุณ</h4>
                <p class="mt-2 text-blue-900/80 mb-0">
                  คุณกำลังเข้าใช้งานในระดับสิทธิ์ <strong>{{ currentRole.toUpperCase() }}</strong> คู่มือด้านซ้ายมือจะแสดงเฉพาะระบบที่คุณมีสิทธิ์เข้าถึงเท่านั้น หากคุณมีข้อสงสัยหรือไม่สามารถเข้าถึงเมนูใดได้ โปรดติดต่อผู้ดูแลระบบ
                </p>
              </div>
              <h3>คำแนะนำเบื้องต้น</h3>
              <ul>
                <li>แถบเมนูด้านซ้าย (Sidebar) ใช้สำหรับนำทางไปยังระบบต่างๆ</li>
                <li>คลิกที่ไอคอนโปรไฟล์มุมขวาบนเพื่อ ดูข้อมูลส่วนตัว หรือ ออกจากระบบ</li>
                <li>สัญลักษณ์ <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-sm font-bold">สีเขียว</span> มักหมายถึงสถานะปกติหรือการอนุมัติ</li>
                <li>สัญลักษณ์ <span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-sm font-bold">สีแดง</span> หมายถึงสถานะชำรุด หรือไม่อนุมัติ</li>
              </ul>
            </div>
          </div>

          <!-- Tab 2: Dashboard -->
          <div v-if="activeTab === 'dashboard'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ภาพรวมระบบ (Dashboard)</h2>
            <div class="space-y-8">
              <section>
                <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <LayoutDashboard class="w-5 h-5 text-emerald-600" />
                  หน้า Dashboard
                </h3>
                <p class="text-slate-600 mb-4 leading-relaxed">
                  หน้าจอหลักจะแสดงสถิติและภาพรวมของระบบทั้งหมดแบบเรียลไทม์ 
                  <span v-if="isAdmin || isStaff">สำหรับ Admin และ Staff จะเห็นสถิติรวมของทุกแผนก รวมถึงกราฟการเบิกจ่ายและแจ้งซ่อม</span>
                  <span v-else>สำหรับ User จะเน้นแสดงรายการที่รอการดำเนินการของตนเองเป็นหลัก</span>
                </p>
                <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h4 class="font-bold text-slate-700 mb-2">สิ่งที่คุณสามารถทำได้:</h4>
                  <ul class="list-disc pl-5 space-y-2 text-slate-600">
                    <li>ดูจำนวนครุภัณฑ์/พัสดุทั้งหมดในระบบ หรือในแผนกของคุณ</li>
                    <li>ดูรายการแจ้งซ่อมและคำขอเบิก/ยืม ที่กำลังรอดำเนินการ</li>
                    <li v-if="isAdmin || isStaff">ดูสถิติมูลค่าครุภัณฑ์และกราฟสรุปการเบิกจ่ายแยกตามเดือน</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>

          <!-- Tab 3: Inventory -->
          <div v-if="activeTab === 'inventory'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ระบบพัสดุสิ้นเปลือง</h2>
            <div class="space-y-8">
              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><PackageSearch class="w-5 h-5 text-emerald-600"/> ทะเบียนพัสดุ</h3>
                <p class="text-slate-600 mb-3">แสดงรายการวัสดุ-อุปกรณ์สิ้นเปลืองทั้งหมดในสต๊อก สามารถค้นหาและดูยอดคงเหลือปัจจุบัน</p>
                <ul class="list-disc pl-5 space-y-1 text-slate-600">
                  <li v-if="isStaff">สามารถเพิ่มลบแก้ไข (Master Data) ของวัสดุได้</li>
                  <li>คลิกปุ่ม <strong>"ประวัติรายการ"</strong> เพื่อดูการเบิก-จ่ายย้อนหลังของสินค้านั้นๆ ได้แบบรายตัว (Running Balance)</li>
                </ul>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Download class="w-5 h-5 text-emerald-600"/> บันทึกรับเข้าพัสดุ</h3>
                <p class="text-slate-600 mb-4">สำหรับเจ้าหน้าที่ในการบันทึกรับของเข้าคลัง (Stock In)</p>
                <div class="relative border-l-2 border-emerald-200 ml-3 pl-6 space-y-6 mt-4">
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">1</div>
                    <h4 class="font-bold text-slate-800">เข้าสู่เมนูรับเข้า</h4>
                    <p class="text-slate-600 text-sm mt-1">ไปที่แถบเมนูด้านซ้าย เลือกเมนู <strong>"บันทึกรับเข้าพัสดุ"</strong></p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">2</div>
                    <h4 class="font-bold text-slate-800">เลือกประเภทรายการ</h4>
                    <p class="text-slate-600 text-sm mt-1">เลือกว่าเป็นการ <strong>"รับเข้าวัสดุเดิมที่มีในระบบอยู่แล้ว"</strong> หรือ <strong>"สร้างวัสดุรายการใหม่"</strong> ลงในฐานข้อมูล</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">3</div>
                    <h4 class="font-bold text-slate-800">กรอกข้อมูลการจัดซื้อ</h4>
                    <p class="text-slate-600 text-sm mt-1">ระบุจำนวนที่รับเข้า (Qty), ราคาต่อหน่วย, และรายละเอียดใบเสร็จ/ปีงบประมาณให้ครบถ้วน</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">4</div>
                    <h4 class="font-bold text-slate-800">ยืนยันการรับเข้า</h4>
                    <p class="text-slate-600 text-sm mt-1">เมื่อกดยืนยัน ระบบจะนำจำนวนพัสดุไป <span class="text-emerald-600 font-bold">บวกเพิ่มในสต๊อกให้อัตโนมัติ</span> และบันทึกประวัติการรับเข้าทันที</p>
                  </div>
                </div>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><History class="w-5 h-5 text-emerald-600"/> ประวัติเคลื่อนไหว</h3>
                <p class="text-slate-600 mb-3">ดูรายการบัญชีคุมสต๊อกทั้งหมด (Running Balance รวม) เพื่อตรวจสอบความเคลื่อนไหว IN/OUT ของสต๊อก</p>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><ClipboardCheck class="w-5 h-5 text-emerald-600"/> ตรวจสอบพัสดุประจำปี</h3>
                <p class="text-slate-600 mb-3">ระบบสำหรับนับสต๊อกสิ้นปี (Stock Check) เพื่อปรับลดยอดพัสดุที่เสื่อมสภาพหรือสูญหายให้ตรงกับความเป็นจริง</p>
              </section>
            </div>
          </div>

          <!-- Tab 4: Assets -->
          <div v-if="activeTab === 'asset'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ระบบครุภัณฑ์</h2>
            <div class="space-y-8">
              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Database class="w-5 h-5 text-emerald-600"/> ทะเบียนครุภัณฑ์</h3>
                <p class="text-slate-600 mb-3">หน้ารวมรายการครุภัณฑ์ทั้งหมด พร้อมแสดงสถานะ (ใช้งานปกติ, ส่งซ่อม, ชำรุด)</p>
                <ul class="list-disc pl-5 space-y-1 text-slate-600">
                  <li v-if="isStaff">สามารถ <strong>เพิ่มครุภัณฑ์ใหม่</strong> และพิมพ์บาร์โค้ดหรือ QR Code ได้</li>
                  <li v-if="isStaff">สามารถ <strong>แนบรูปภาพครุภัณฑ์</strong> ได้ทีละรายการ</li>
                  <li>คลิก <strong>พิมพ์รายงาน PDF / Excel</strong> เพื่อนำข้อมูลออกไปใช้งานต่อ</li>
                </ul>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><SendToBack class="w-5 h-5 text-emerald-600"/> จ่ายครุภัณฑ์ให้หน่วย</h3>
                <p class="text-slate-600 mb-4">ใช้สำหรับจัดสรรและส่งมอบครุภัณฑ์จากส่วนกลางไปยังหน่วยงานหรือบุคคลต่างๆ พร้อมบันทึกสถานที่ติดตั้ง</p>
                <div class="relative border-l-2 border-emerald-200 ml-3 pl-6 space-y-6 mt-4">
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">1</div>
                    <h4 class="font-bold text-slate-800">ค้นหาครุภัณฑ์</h4>
                    <p class="text-slate-600 text-sm mt-1">ไปที่เมนู <strong>"จ่ายครุภัณฑ์ให้หน่วย"</strong> ค้นหาและเลือกรายการครุภัณฑ์ที่ต้องการจัดสรรด้วยรหัส หรือชื่อ</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">2</div>
                    <h4 class="font-bold text-slate-800">ระบุผู้รับผิดชอบและสถานที่</h4>
                    <p class="text-slate-600 text-sm mt-1">เลือกชื่อบุคลากรผู้รับผิดชอบดูแลครุภัณฑ์ชิ้นนี้ พร้อมระบุ <strong>แผนก, อาคาร, และห้อง</strong> ที่นำไปติดตั้ง</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">3</div>
                    <h4 class="font-bold text-slate-800">อัปเดตข้อมูลอัตโนมัติ</h4>
                    <p class="text-slate-600 text-sm mt-1">หลังกดยืนยัน ระบบจะสร้าง <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">บันทึกประวัติการย้าย</span> และอัปเดตข้อมูลสถานที่ในหน้า <strong>ทะเบียนครุภัณฑ์</strong> ทันที</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><CalendarClock class="w-5 h-5 text-emerald-600"/> ประวัติซ่อม/เคลื่อนไหว (ไทม์ไลน์)</h3>
                <p class="text-slate-600 mb-3">ดูเส้นทางอายุขัยของครุภัณฑ์รายชิ้น (Life-cycle) ตั้งแต่รับเข้า โยกย้าย แจ้งซ่อม จนถึงการแทงจำหน่าย</p>
                <ul class="list-disc pl-5 space-y-1 text-slate-600">
                  <li>ค้นหาครุภัณฑ์ที่ต้องการ แล้วคลิก <strong>"ดูไทม์ไลน์"</strong></li>
                  <li>จะเห็นประวัติการทำรายการเรียงตามวันที่</li>
                  <li v-if="isStaff">สามารถเพิ่ม Log กิจกรรมบันทึกค่าซ่อม หรือประวัติแบบ Manual ได้ด้วยตนเอง</li>
                </ul>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Recycle class="w-5 h-5 text-emerald-600"/> จำหน่ายพัสดุ/ครุภัณฑ์</h3>
                <p class="text-slate-600 mb-3">ระบบบันทึกการแทงจำหน่าย (Write-off) ครุภัณฑ์ที่เสื่อมสภาพหรือหมดอายุการใช้งานแล้วออกจากระบบบัญชี</p>
              </section>
            </div>
          </div>

          <!-- Tab 5: Borrow -->
          <div v-if="activeTab === 'borrow'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ระบบยืม-คืน</h2>
            <div class="space-y-6">
              <p class="text-slate-600">ใช้สำหรับทำเรื่องยืมอุปกรณ์และครุภัณฑ์ไปใช้งานชั่วคราว</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                  <h4 class="font-bold text-slate-800 mb-3 flex items-center gap-2"><FilePlus class="w-4 h-4 text-emerald-600"/> สำหรับผู้ยืม (User)</h4>
                  <div class="relative border-l-2 border-emerald-200 ml-3 pl-5 space-y-4 mt-4">
                    <div class="relative">
                      <div class="absolute -left-[29px] top-0 bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm">1</div>
                      <h5 class="font-bold text-slate-800 text-sm">ยื่นคำขอยืมใหม่</h5>
                      <p class="text-slate-600 text-xs mt-1">กดปุ่ม <strong>+ ยื่นคำขอยืมใหม่</strong> ค้นหาและเลือกอุปกรณ์ที่ต้องการยืม</p>
                    </div>
                    <div class="relative">
                      <div class="absolute -left-[29px] top-0 bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm">2</div>
                      <h5 class="font-bold text-slate-800 text-sm">ระบุข้อมูล</h5>
                      <p class="text-slate-600 text-xs mt-1">ระบุ วันที่ต้องการยืม และ วันที่คาดว่าจะคืน พร้อมระบุเหตุผลการยืมให้ชัดเจน แล้วกดส่งคำขอ</p>
                    </div>
                    <div class="relative">
                      <div class="absolute -left-[29px] top-0 bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm">3</div>
                      <h5 class="font-bold text-slate-800 text-sm">รอรับของและคืนของ</h5>
                      <p class="text-slate-600 text-xs mt-1">รอเจ้าหน้าที่กดอนุมัติเพื่อรับของ และเมื่อใช้งานเสร็จให้นำมาคืนเพื่อให้เจ้าหน้าที่กดรับคืน</p>
                    </div>
                  </div>
                </div>
                
                <div v-if="isStaff" class="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                  <h4 class="font-bold text-emerald-800 mb-3 flex items-center gap-2"><ClipboardCheck class="w-4 h-4"/> สำหรับเจ้าหน้าที่ (Staff)</h4>
                  <div class="relative border-l-2 border-emerald-300 ml-3 pl-5 space-y-4 mt-4">
                    <div class="relative">
                      <div class="absolute -left-[29px] top-0 bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-emerald-50 shadow-sm">1</div>
                      <h5 class="font-bold text-emerald-900 text-sm">ตรวจสอบคำขอ</h5>
                      <p class="text-emerald-700 text-xs mt-1">ไปที่แท็บ <strong>รออนุมัติ</strong> พิจารณาและกดปุ่ม <span class="bg-emerald-600 text-white px-1.5 rounded">อนุมัติ</span> หรือ <span class="bg-rose-600 text-white px-1.5 rounded">ปฏิเสธ</span></p>
                    </div>
                    <div class="relative">
                      <div class="absolute -left-[29px] top-0 bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-emerald-50 shadow-sm">2</div>
                      <h5 class="font-bold text-emerald-900 text-sm">บันทึกรับคืน</h5>
                      <p class="text-emerald-700 text-xs mt-1">เมื่อผู้ยืมนำของมาคืน ให้ไปที่แท็บ <strong>กำลังยืม/รอคืน</strong> แล้วกดปุ่ม <strong>บันทึกรับคืน</strong> โดยต้องตรวจสภาพของก่อนกดยืนยัน</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 6: Repair -->
          <div v-if="activeTab === 'repair'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ระบบแจ้งซ่อม/บำรุงรักษา</h2>
            <div class="space-y-6">
              <p class="text-slate-600">หากพบอุปกรณ์ชำรุดเสียหาย สามารถทำรายการแจ้งซ่อมออนไลน์ได้ทันที</p>
              
              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2">ขั้นตอนการแจ้งซ่อม</h3>
                <div class="relative border-l-2 border-emerald-200 ml-3 pl-6 space-y-6 mt-4">
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">1</div>
                    <h4 class="font-bold text-slate-800">เลือกครุภัณฑ์ที่ชำรุด</h4>
                    <p class="text-slate-600 text-sm mt-1">เข้าเมนู <strong>แจ้งซ่อม/บำรุงรักษา</strong> กดปุ่ม แจ้งซ่อม จากนั้นเลือกครุภัณฑ์ที่ต้องการแจ้ง</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">2</div>
                    <h4 class="font-bold text-slate-800">อธิบายอาการเสีย</h4>
                    <p class="text-slate-600 text-sm mt-1">ระบุอาการที่พบโดยละเอียด และควร <strong>แนบรูปภาพประกอบ</strong> เพื่อให้ช่างประเมินความเสียหายเบื้องต้นได้</p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">3</div>
                    <h4 class="font-bold text-slate-800">ส่งเรื่องและรอผล</h4>
                    <p class="text-slate-600 text-sm mt-1">กดบันทึก สถานะจะขึ้นเป็น <span class="text-amber-600 font-bold">รอรับเรื่อง</span> เมื่อเจ้าหน้าที่ซ่อมเสร็จจะเปลี่ยนสถานะเป็น <span class="text-emerald-600 font-bold">ซ่อมสำเร็จ</span></p>
                  </div>
                </div>
              </section>

              <section v-if="isStaff">
                <h3 class="text-lg font-bold text-slate-800 mb-2">การจัดการงานซ่อม (สำหรับ Staff)</h3>
                <p class="text-slate-600 mb-3">เมื่อมีคำขอแจ้งซ่อมเข้ามา เจ้าหน้าที่สามารถเปลี่ยนสถานะงานซ่อมได้ตามลำดับดังนี้:</p>
                <div class="flex flex-wrap gap-2 text-sm font-bold">
                  <span class="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200">รอรับเรื่อง</span>
                  <span class="text-slate-400 mt-1">➔</span>
                  <span class="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200">กำลังดำเนินการซ่อม</span>
                  <span class="text-slate-400 mt-1">➔</span>
                  <span class="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">ซ่อมสำเร็จ</span>
                </div>
              </section>
            </div>
          </div>

          <!-- Tab 7: Requisition -->
          <div v-if="activeTab === 'requisition'" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">ระบบเบิกจ่ายพัสดุสิ้นเปลือง</h2>
            <div class="space-y-6">
              <p class="text-slate-600">ระบบสำหรับการเบิกวัสดุอุปกรณ์สำนักงาน (เช่น ปากกา, กระดาษ) แบบไม่ต้องส่งคืน</p>
              
              <div class="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2"><FilePlus class="w-5 h-5 text-emerald-600"/> การยื่นคำขอเบิก</h3>
                <div class="relative border-l-2 border-emerald-200 ml-3 pl-6 space-y-5 mt-4">
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">1</div>
                    <h4 class="font-bold text-slate-800">ค้นหาพัสดุ</h4>
                    <p class="text-slate-600 text-sm mt-1">ไปที่เมนู <strong>ยื่นคำขอเบิก</strong> ค้นหาสินค้า และกดปุ่ม <span class="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">เพิ่มลงตะกร้า</span></p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">2</div>
                    <h4 class="font-bold text-slate-800">ปรับจำนวนและเหตุผล</h4>
                    <p class="text-slate-600 text-sm mt-1">ระบุจำนวนที่ต้องการเบิก พิมพ์หมายเหตุ/เหตุผลการเบิกให้ชัดเจน (เช่น ใช้สำหรับงานประชุม) แล้วกด <strong>ส่งคำขอ</strong></p>
                  </div>
                </div>
              </div>

              <div v-if="isStaff" class="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <h3 class="font-bold text-emerald-800 mb-3 flex items-center gap-2"><ClipboardList class="w-5 h-5"/> การอนุมัติการเบิกจ่าย (Staff)</h3>
                <p class="text-emerald-700 mb-4 text-sm">เข้าเมนู <strong>รายการคำขอเบิก</strong> เพื่อดูบิลที่ลูกค้ายื่นเข้ามา</p>
                <div class="relative border-l-2 border-emerald-300 ml-3 pl-6 space-y-5">
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-emerald-50 shadow-sm">1</div>
                    <h4 class="font-bold text-emerald-900 text-sm">ตรวจสอบคลัง</h4>
                    <p class="text-emerald-700 text-xs mt-1">ตรวจสอบจำนวนที่ขอเบิก เทียบกับยอดคงเหลือในสต๊อก หากไม่พอหรือไม่อนุญาต ให้กด <span class="bg-rose-600 text-white px-1.5 rounded">ปฏิเสธคำขอ</span></p>
                  </div>
                  <div class="relative">
                    <div class="absolute -left-[35px] top-0 bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-emerald-50 shadow-sm">2</div>
                    <h4 class="font-bold text-emerald-900 text-sm">อนุมัติและตัดสต๊อก</h4>
                    <p class="text-emerald-700 text-xs mt-1">หากอนุมัติ ให้กดปุ่ม <strong>อนุมัติ</strong> ระบบจะ <span class="font-bold underline">ตัดสต๊อกพัสดุทันที</span> และอัปเดตประวัติการจ่ายของให้โดยอัตโนมัติ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 8: Admin (Admin Only) -->
          <div v-if="activeTab === 'admin' && isAdmin" class="space-y-6">
            <h2 class="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">คู่มือสำหรับผู้ดูแลระบบ (Admin)</h2>
            <div class="space-y-8">
              <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p class="text-amber-800 font-bold mb-0">เมนูผู้ดูแลระบบมีความสำคัญสูง การปรับเปลี่ยนข้อมูลอาจส่งผลต่อการทำงานของทั้งระบบ</p>
              </div>
              
              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Settings class="w-5 h-5 text-emerald-600"/> จัดการข้อมูลพื้นฐาน (Master Data)</h3>
                <p class="text-slate-600 mb-3">ใช้จัดการข้อมูลตั้งต้นของระบบ ได้แก่:</p>
                <ul class="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>ผู้ใช้งาน (Users):</strong> เพิ่ม/แก้ไขรหัสผ่าน และกำหนดสิทธิ์ Role</li>
                  <li><strong>แผนก/ฝ่าย (Departments):</strong> จัดการโครงสร้างองค์กร</li>
                  <li><strong>สถานที่ตั้ง (Locations):</strong> จัดการรายการห้องและอาคารที่ใช้ระบุพิกัดครุภัณฑ์</li>
                  <li><strong>หมวดหมู่ (Categories):</strong> จัดหมวดหมู่วัสดุและครุภัณฑ์เพื่อความง่ายในการค้นหา</li>
                </ul>
              </section>

              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Activity class="w-5 h-5 text-emerald-600"/> ประวัติการใช้งานระบบ (Activity Logs)</h3>
                <p class="text-slate-600 mb-3">ตรวจสอบ Audit Trail หรือร่องรอยการกระทำของผู้ใช้งานในระบบ เช่น ใครเป็นคนลบ ใครอนุมัติ เมื่อเวลาเท่าไหร่</p>
              </section>

              <section>
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><CalendarCheck class="w-5 h-5 text-emerald-600"/> ตั้งค่าปีงบประมาณ</h3>
                <p class="text-slate-600 mb-3">กำหนดช่วงเวลาปีงบประมาณปัจจุบัน สำหรับการออกรายงานประจำปีและการเริ่มรอบบัญชีใหม่</p>
              </section>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
