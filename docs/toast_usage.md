# วิธีการใช้งาน Toast Notification ใน Vue Components

ระบบ Toast ในโปรเจกต์นี้ถูกสร้างขึ้นมาในรูปแบบของ Vue Composable ทำให้สามารถเรียกใช้งานได้ง่ายๆ ใน Composition API (`<script setup>`)

## ขั้นตอนการใช้งาน

### 1. นำเข้า (Import) `useToast`
ก่อนอื่นต้องทำการ Import composable `useToast` เข้ามาใน component ของคุณ โดยระบุ path ให้ถูกต้องตามตำแหน่งของไฟล์

```javascript
import { useToast } from '../composables/useToast'
```
*(หมายเหตุ: ปรับ `../composables/useToast` ตาม path จริงของไฟล์ component ที่กำลังใช้งาน)*

### 2. ประกาศตัวแปรเรียกใช้ (Initialize)
สร้างตัวแปรเพื่อเก็บ instance ของ toast ไว้เรียกใช้งาน

```javascript
const toast = useToast()
```

### 3. เรียกใช้งาน (Usage)
สามารถเรียกใช้คำสั่งเพื่อแสดง Toast ได้ 4 รูปแบบหลักๆ ตามประเภทของข้อความ:

#### 🟢 ข้อความสำเร็จ (Success)
ใช้เมื่อการทำงานเสร็จสมบูรณ์ เช่น บันทึกข้อมูลเรียบร้อยแล้ว
```javascript
toast.success('บันทึกข้อมูลเรียบร้อยแล้ว')
```

#### 🔴 ข้อความผิดพลาด (Error)
ใช้เมื่อเกิดข้อผิดพลาดในการทำงาน เช่น โหลดข้อมูลไม่สำเร็จ, บันทึกไม่ได้
```javascript
toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
```

#### 🟡 ข้อความแจ้งเตือน (Warning)
ใช้เพื่อเตือนผู้ใช้ เช่น ระวังการลบข้อมูล
```javascript
toast.warning('กรุณาตรวจสอบข้อมูลอีกครั้งก่อนยืนยัน')
```

#### 🔵 ข้อความทั่วไป (Info)
ใช้แจ้งข้อมูลทั่วไปให้ผู้ใช้ทราบ
```javascript
toast.info('มีอัปเดตระบบใหม่พร้อมใช้งาน')
```

## ตัวอย่างการใช้งานจริง

ด้านล่างนี้คือตัวอย่างการนำไปประยุกต์ใช้ในการส่งฟอร์มข้อมูล:

```vue
<script setup>
import { ref } from 'vue'
import { useToast } from '../composables/useToast'
import axios from 'axios'

const toast = useToast()
const isSubmitting = ref(false)

const handleSaveData = async () => {
  isSubmitting.value = true
  
  try {
    // 1. ทำการเรียก API เพื่อบันทึกข้อมูล
    await axios.post('/api/data', { /* ... */ })
    
    // 2. ถ้าสำเร็จ ให้แสดง Toast success
    toast.success('บันทึกข้อมูลสำเร็จ!')
    
  } catch (error) {
    // 3. ถ้าผิดพลาด ให้แสดง Toast error
    toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <button @click="handleSaveData" :disabled="isSubmitting">
    บันทึกข้อมูล
  </button>
</template>
```

> [!TIP]
> ค่าเริ่มต้น Toast จะแสดงอยู่ 3000 มิลลิวินาที (3 วินาที) คุณสามารถกำหนดเวลาใหม่ได้โดยใส่ตัวเลขเวลาเป็นพารามิเตอร์ที่ 2 เช่น `toast.success('สำเร็จ!', 5000)` (สำหรับ 5 วินาที)
