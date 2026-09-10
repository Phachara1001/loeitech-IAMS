<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  PackagePlus,
  Calendar,
  Tag,
  Wallet,
  Boxes,
  Calculator,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  FolderPlus,
  Image as ImageIcon,
  UploadCloud,
  X,
  PlusCircle,
  Hash,
  Barcode,
  Computer,
  Wrench,
  ChevronLeft,
  Loader2,
  ShoppingCart
} from 'lucide-vue-next'
import ThaiDatePicker from '../components/ThaiDatePicker.vue'
import { useToast } from '../composables/useToast'
import { API_BASE } from '../config/api'

const router = useRouter()
const toast = useToast()

function authHeaders() {
  const token = localStorage.getItem('tcaims_auth_token')
  return { Authorization: `Bearer ${token}` }
}

function extractErrorMessage(error) {
  const data = error.response?.data
  if (data?.errors?.length) return data.errors.join(' / ')
  if (data?.message) return data.message
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

function handleUnauthorized(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('tcaims_auth_token')
    localStorage.removeItem('tcaims_user')
    localStorage.removeItem('tcaims_role')
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
    router.push('/login')
    return true
  }
  return false
}

// ชื่อผู้ใช้งานที่ login อยู่ (ดึงจากแคชที่บันทึกไว้ตอน login จริง ไม่ใช่ mock)
const currentUserName = computed(() => {
  try {
    const cached = JSON.parse(localStorage.getItem('tcaims_user') || 'null')
    return cached?.name || 'ผู้ใช้งาน'
  } catch {
    return 'ผู้ใช้งาน'
  }
})

// --- Form State ---
const now = new Date()
const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)

const formData = ref({
  // ข้อมูลทั่วไป
  seq: '',
  name: '',
  category: 'ครุภัณฑ์สำนักงาน',
  department: 'ส่วนกลาง',

  // ข้อมูลทางเทคนิค
  brand: '',
  serialNumber: '',
  specifications: '',

  // ข้อมูลการจัดซื้อ
  acquiredDate: todayStr,
  acquisitionMethod: 'ตกลงราคา',
  budgetType: 'เงินงบประมาณ',
  referenceCode: '',
  unitPrice: 0,
  qty: 1, // ปกติครุภัณฑ์ลงทะเบียนทีละ 1 ชิ้นต่อ 1 หมายเลข แต่ทำเผื่อไว้

  // อื่นๆ
  remark: ''
})

const imageFile = ref(null)
const imagePreview = ref(null)

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
}

const isSubmitting = ref(false)
const showSuccessModal = ref(false)
const newAssetSeq = ref('')

const handleSaveAsset = async () => {
  if (!formData.value.name.trim()) return

  isSubmitting.value = true

  try {
    let imageUrl = null

    // Upload image first if exists
    if (imageFile.value) {
      const uploadData = new FormData()
      uploadData.append('image', imageFile.value)

      const uploadResponse = await axios.post(`${API_BASE}/assets/upload`, uploadData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
      })
      imageUrl = uploadResponse.data.data.imageUrl
    }

    // Prepare payload
    const payload = { ...formData.value }
    if (imageUrl) {
      payload.image = imageUrl
    }
    if (payload.acquiredDate) {
      payload.acquiredDate = new Date(payload.acquiredDate).toISOString()
    }

    // Send to backend API
    const response = await axios.post(`${API_BASE}/assets`, payload, { headers: authHeaders() })

    // Set returned data to display in success modal
    newAssetSeq.value = response.data.data.seq
    showSuccessModal.value = true
    toast.success('บันทึกข้อมูลครุภัณฑ์เรียบร้อยแล้ว')
  } catch (error) {
    console.error('Error saving asset:', error)
    if (!handleUnauthorized(error)) toast.error(extractErrorMessage(error))
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/asset-list')
}

const resetFormAndContinue = () => {
  showSuccessModal.value = false
  formData.value = {
    seq: '',
    name: '',
    category: 'ครุภัณฑ์สำนักงาน',
    department: 'แผนกเทคโนโลยีสารสนเทศ',
    brand: '',
    serialNumber: '',
    specifications: '',
    acquiredDate: todayStr,
    acquisitionMethod: 'ตกลงราคา',
    budgetType: 'เงินงบประมาณ',
    referenceCode: '',
    unitPrice: 0,
    qty: 1,
    remark: ''
  }
  clearImage()
}
</script>

<template>
  <div class="min-h-screen bg-slate-100/80 text-slate-800 p-4 sm:p-6 md:p-8 font-sans space-y-6">

    <div class="w-full space-y-6 max-w-auto mx-auto">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-[#072415] text-white shadow-xl print:hidden">
        <!-- Background Mesh Gradient -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#1B5E3C] opacity-75 blur-[90px]">
          </div>
          <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-[#288252] opacity-40 blur-[80px]">
          </div>
          <div
            class="absolute -bottom-20 right-1/3 w-[350px] h-[350px] rounded-full bg-[#04140B] opacity-90 blur-[70px]">
          </div>
        </div>

        <div
          class="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex flex-col gap-4">
            <button @click="goBack"
              class="flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors w-fit text-sm font-bold">
              <ChevronLeft class="w-4 h-4" /> กลับหน้าบัญชีคุมครุภัณฑ์
            </button>
            <div class="flex items-center gap-5">
              <div
                class="p-3.5 bg-emerald-400/20 border border-emerald-400/30 rounded-2xl text-emerald-300 backdrop-blur-md shrink-0">
                <FolderPlus class="w-8 h-8" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-extrabold px-3 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-md">
                    ฟอร์มลงทะเบียนครุภัณฑ์
                  </span>
                  <span class="text-emerald-100/60 text-xs sm:text-sm font-medium">| ทะเบียนครุภัณฑ์ราชการ</span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">เพิ่มข้อมูลครุภัณฑ์ใหม่</h1>
              </div>
            </div>
          </div>

          <div
            class="flex items-center gap-2 bg-black/20 border border-white/10 p-2.5 rounded-xl backdrop-blur-md self-start md:self-auto shrink-0">
            <ShieldCheck class="w-5 h-5 text-emerald-400 ml-1" />
            <span class="text-sm font-bold text-white pr-2">{{ currentUserName }}</span>
          </div>
        </div>
      </div>

      <!-- Main Form -->
      <form @submit.prevent="handleSaveAsset"
        class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8">

        <!-- Section 1: ข้อมูลทั่วไป -->
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            1. ข้อมูลทั่วไป (General Information)
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Barcode class="w-5 h-5 text-emerald-600" /> รหัสครุภัณฑ์ (เลขครุภัณฑ์)
              </label>
              <input v-model="formData.seq" type="text"
                placeholder="ปล่อยว่างเพื่อสร้างอัตโนมัติ หรือกรอกเลขครุภัณฑ์เอง เช่น 561-001"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                ชื่อครุภัณฑ์ <span class="text-rose-500">*</span>
              </label>
              <input v-model="formData.name" type="text" required
                placeholder="ระบุชื่อครุภัณฑ์ เช่น เครื่องคอมพิวเตอร์ประมวลผลสูง, รถยนต์โดยสารตู้ 15 ที่นั่ง"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-extrabold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white shadow-sm transition-all" />
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Boxes class="w-5 h-5 text-emerald-600" /> ประเภท/หมวดหมู่
              </label>
              <input list="asset-categories" v-model="formData.category" placeholder="เลือกหรือพิมพ์ประเภทครุภัณฑ์เอง"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-text" />
              <datalist id="asset-categories">
                <option value="ครุภัณฑ์สำนักงาน"></option>
                <option value="ครุภัณฑ์การศึกษา"></option>
                <option value="ครุภัณฑ์ยานพาหนะ"></option>
                <option value="ครุภัณฑ์คอมพิวเตอร์"></option>
                <option value="ครุภัณฑ์งานบ้านงานครัว"></option>
                <option value="ครุภัณฑ์ก่อสร้าง"></option>
              </datalist>
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Building2 class="w-5 h-5 text-emerald-600" /> หน่วยงาน/แผนกที่ครอบครอง
              </label>
              <input v-model="formData.department" type="text" placeholder="เช่น ช่างกลโรงงาน, ห้องสมุด, ส่วนกลาง"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>
          </div>
        </div>

        <!-- Section 2: ข้อมูลทางเทคนิค -->
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            2. ข้อมูลจำเพาะ (Technical Details)
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Tag class="w-5 h-5 text-emerald-600" /> ยี่ห้อ/รุ่น (Brand & Model)
              </label>
              <input v-model="formData.brand" type="text" placeholder="เช่น Toyota Commuter, Dell Precision"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Barcode class="w-5 h-5 text-emerald-600" /> หมายเลข Serial / เลขตัวถัง
              </label>
              <input v-model="formData.serialNumber" type="text" placeholder="ระบุหมายเลขเครื่อง หรือ Serial Number"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Wrench class="w-5 h-5 text-emerald-600" /> คุณสมบัติ/สเปค (Specifications)
              </label>
              <textarea v-model="formData.specifications" rows="3"
                placeholder="ระบุสเปคหรือคุณสมบัติที่สำคัญของครุภัณฑ์"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-medium text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"></textarea>
            </div>
          </div>
        </div>

        <!-- Section 3: ข้อมูลการจัดซื้อและเงิน -->
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            3. ข้อมูลการจัดซื้อและแหล่งเงิน (Acquisition & Budget)
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Calendar class="w-5 h-5 text-emerald-600" /> วันที่ได้มา <span class="text-rose-500">*</span>
              </label>
              <ThaiDatePicker v-model="formData.acquiredDate" type="datetime-local" required
                inputClass="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer" />
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <ShoppingCart class="w-5 h-5 text-emerald-600" /> วิธีการได้มา
              </label>
              <select v-model="formData.acquisitionMethod"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer">
                <option value="ตกลงราคา">ตกลงราคา</option>
                <option value="สอบราคา">สอบราคา</option>
                <option value="ประกวดราคา">ประกวดราคา</option>
                <option value="ประกวดราคา e-bidding">ประกวดราคา e-bidding</option>
                <option value="วิธีเฉพาะเจาะจง">วิธีเฉพาะเจาะจง</option>
                <option value="รับบริจาค / รับมอบ">รับบริจาค / รับมอบ</option>
              </select>
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Wallet class="w-5 h-5 text-emerald-600" /> แหล่งเงิน
              </label>
              <select v-model="formData.budgetType"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer">
                <option value="เงินงบประมาณ">เงินงบประมาณ</option>
                <option value="เงินนอกงบประมาณ">เงินนอกงบประมาณ</option>
                <option value="เงินรายได้สถานศึกษา">เงินรายได้สถานศึกษา</option>
                <option value="เงินบริจาค">เงินบริจาค</option>
              </select>
            </div>

            <div class="lg:col-span-1">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                ราคาต่อหน่วย (บาท) <span class="text-rose-500">*</span>
              </label>
              <input v-model="formData.unitPrice" type="number" step="0.01" min="0" required
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-extrabold text-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>

            <div class="lg:col-span-2">
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Hash class="w-5 h-5 text-emerald-600" /> รหัสอ้างอิง / เลขที่ใบสั่งซื้อ
              </label>
              <input v-model="formData.referenceCode" type="text" placeholder="เช่น PO-2569/001"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" />
            </div>
          </div>
        </div>

        <!-- Section 4: รูปภาพ -->
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            4. รูปภาพครุภัณฑ์ (Asset Image)
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="!imagePreview" class="relative">
              <input type="file" accept="image/*" @change="handleImageUpload"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div
                class="border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors h-64">
                <UploadCloud class="w-12 h-12 text-slate-400 mb-4" />
                <h4 class="text-lg font-bold text-slate-700">ลากไฟล์ หรือคลิกเพื่ออัปโหลด</h4>
                <p class="text-sm text-slate-500 mt-2">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
              </div>
            </div>

            <div v-else
              class="relative border-2 border-slate-200 rounded-3xl p-4 bg-slate-50 flex items-center justify-center h-64">
              <button type="button" @click="clearImage"
                class="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-rose-500 hover:bg-rose-100 transition-colors z-10 shadow-sm">
                <X class="w-5 h-5" />
              </button>
              <img :src="imagePreview" class="max-w-full max-h-full object-contain rounded-2xl" />
            </div>

            <div>
              <label class="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <FileText class="w-5 h-5 text-emerald-600" /> หมายเหตุ (Remarks)
              </label>
              <textarea v-model="formData.remark"
                placeholder="ระบุข้อมูลอื่นๆ เพิ่มเติมที่ต้องการบันทึกไว้ในทะเบียนครุภัณฑ์"
                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-900 font-medium text-base focus:outline-none focus:border-emerald-600 focus:bg-white transition-all h-64 resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
          <button type="button" @click="goBack"
            class="px-8 py-4 rounded-2xl text-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            ยกเลิก
          </button>
          <button type="submit" :disabled="isSubmitting || !formData.name.trim()" :class="[
            'px-12 py-4 rounded-2xl text-lg font-extrabold text-white flex items-center justify-center gap-3 shadow-xl transition-all',
            formData.name.trim()
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          ]">
            <Loader2 v-if="isSubmitting" class="w-6 h-6 animate-spin" />
            <CheckCircle2 v-else class="w-6 h-6" />
            <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลครุภัณฑ์' }}</span>
          </button>
        </div>

      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
        <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-12 h-12 stroke-[2.5]" />
        </div>

        <div>
          <h3 class="text-2xl font-extrabold text-slate-900">บันทึกครุภัณฑ์สำเร็จ!</h3>
          <p class="text-base text-slate-600 mt-3 leading-relaxed">
            ระบบได้เพิ่มข้อมูล <strong>{{ formData.name }}</strong> ลงในบัญชีคุมครุภัณฑ์เรียบร้อยแล้ว
          </p>
          <div class="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block">
            <span class="text-sm text-slate-500">เลขลำดับครุภัณฑ์ (ระบบสร้างอัตโนมัติ):</span>
            <div class="text-xl font-bold text-emerald-700 mt-1">{{ newAssetSeq }}</div>
          </div>
        </div>

        <div class="flex flex-col gap-3 pt-2">
          <button @click="goBack"
            class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-base shadow-lg transition-all">
            กลับสู่หน้าบัญชีคุมครุภัณฑ์
          </button>
          <button @click="resetFormAndContinue"
            class="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-base transition-all">
            เพิ่มครุภัณฑ์รายการต่อไป
          </button>
        </div>
      </div>
    </div>

  </div>
</template>