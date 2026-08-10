/**
 * seed_items.js
 * สคริปต์สำหรับลบข้อมูลวัสดุเก่าทั้งหมด แล้วเพิ่มข้อมูลวัสดุใหม่ตาม 8 หมวดหมู่
 * รัน: node prisma/seed_items.js
 */
import 'dotenv/config'
import prisma from '../src/prisma/index.js'

// =============================================
// ข้อมูลวัสดุทั้ง 8 หมวดหมู่
// =============================================
const itemsData = [
  // -------------------------------------------------------
  // 1. หมวดวัสดุสำนักงาน (Office Supplies)
  // -------------------------------------------------------
  {
    sku: 'OS-0001',
    name: 'กระดาษ A4 80 แกรม (Double A)',
    category: 'วัสดุสำนักงาน',
    unit: 'รีม',
    quantity: 150,
    minThreshold: 20,
    unitPrice: 115.00,
  },
  {
    sku: 'OS-0002',
    name: 'กระดาษ A3 80 แกรม',
    category: 'วัสดุสำนักงาน',
    unit: 'รีม',
    quantity: 25,
    minThreshold: 5,
    unitPrice: 230.00,
  },
  {
    sku: 'OS-0003',
    name: 'ปากกาลูกลื่น น้ำเงิน 0.5 มม.',
    category: 'วัสดุสำนักงาน',
    unit: 'ด้าม',
    quantity: 320,
    minThreshold: 50,
    unitPrice: 12.00,
  },
  {
    sku: 'OS-0004',
    name: 'แฟ้มสันกว้าง 3 นิ้ว (ตราช้าง)',
    category: 'วัสดุสำนักงาน',
    unit: 'เล่ม',
    quantity: 45,
    minThreshold: 10,
    unitPrice: 85.00,
  },
  {
    sku: 'OS-0005',
    name: 'ลวดเย็บกระดาษ เบอร์ 10',
    category: 'วัสดุสำนักงาน',
    unit: 'กล่อง',
    quantity: 80,
    minThreshold: 15,
    unitPrice: 18.00,
  },
  {
    sku: 'OS-0006',
    name: 'น้ำยาลบคำผิด (Liquid Paper)',
    category: 'วัสดุสำนักงาน',
    unit: 'ขวด',
    quantity: 35,
    minThreshold: 10,
    unitPrice: 42.00,
  },
  {
    sku: 'OS-0007',
    name: 'คลิปหนีบกระดาษ เบอร์ 1',
    category: 'วัสดุสำนักงาน',
    unit: 'กล่อง',
    quantity: 60,
    minThreshold: 10,
    unitPrice: 25.00,
  },

  // -------------------------------------------------------
  // 2. หมวดวัสดุคอมพิวเตอร์และไอที (IT & Computer Supplies)
  // -------------------------------------------------------
  {
    sku: 'IT-0001',
    name: 'หมึกพิมพ์ HP Laserjet 85A (ดำ)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'ตลับ',
    quantity: 8,
    minThreshold: 3,
    unitPrice: 1850.00,
  },
  {
    sku: 'IT-0002',
    name: 'หมึกพิมพ์ Canon 728 (ดำ)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'ตลับ',
    quantity: 12,
    minThreshold: 5,
    unitPrice: 1650.00,
  },
  {
    sku: 'IT-0003',
    name: 'สายสัญญาณ LAN Cat6 (300m/กล่อง)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'กล่อง',
    quantity: 3,
    minThreshold: 1,
    unitPrice: 3200.00,
  },
  {
    sku: 'IT-0004',
    name: 'หัวขั้วต่อสาย LAN (RJ45)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'กล่อง (100 ชิ้น)',
    quantity: 10,
    minThreshold: 2,
    unitPrice: 350.00,
  },
  {
    sku: 'IT-0005',
    name: 'Flash Drive 32GB (Kingston)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'อัน',
    quantity: 15,
    minThreshold: 5,
    unitPrice: 180.00,
  },
  {
    sku: 'IT-0006',
    name: 'เมาส์สาย USB (Logitech)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'ตัว',
    quantity: 20,
    minThreshold: 5,
    unitPrice: 250.00,
  },
  {
    sku: 'IT-0007',
    name: 'สเปรย์ทำความสะอาดหน้าจอ/บอร์ด (Contact Cleaner)',
    category: 'วัสดุคอมพิวเตอร์และไอที',
    unit: 'กระป๋อง',
    quantity: 14,
    minThreshold: 4,
    unitPrice: 165.00,
  },

  // -------------------------------------------------------
  // 3. หมวดวัสดุงานช่างเครื่องกลและยานยนต์ (Mechanical & Automotive)
  // -------------------------------------------------------
  {
    sku: 'MA-0001',
    name: 'น้ำมันเครื่องสำหรับรถยนต์ 10W-30 (4 ลิตร)',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'แกลลอน',
    quantity: 10,
    minThreshold: 3,
    unitPrice: 850.00,
  },
  {
    sku: 'MA-0002',
    name: 'น้ำมันเกียร์และเฟืองท้าย (5 ลิตร)',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'แกลลอน',
    quantity: 6,
    minThreshold: 2,
    unitPrice: 720.00,
  },
  {
    sku: 'MA-0003',
    name: 'จารบีทนความร้อนสูง (บรรจุ 1 กิโลกรัม)',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'กระป๋อง',
    quantity: 15,
    minThreshold: 4,
    unitPrice: 220.00,
  },
  {
    sku: 'MA-0004',
    name: 'ใบเลื่อยตัดเหล็ก 12 นิ้ว (Eclipse)',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'ใบ',
    quantity: 100,
    minThreshold: 20,
    unitPrice: 35.00,
  },
  {
    sku: 'MA-0005',
    name: 'ดอกสว่านเจาะเหล็กขนาด 1/4 นิ้ว',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'ดอก',
    quantity: 40,
    minThreshold: 10,
    unitPrice: 45.00,
  },
  {
    sku: 'MA-0006',
    name: 'น็อตและสกรูขนาด 8 มม. (ความยาว 1 นิ้ว)',
    category: 'วัสดุงานช่างเครื่องกลและยานยนต์',
    unit: 'ตัว',
    quantity: 500,
    minThreshold: 100,
    unitPrice: 3.50,
  },

  // -------------------------------------------------------
  // 4. หมวดวัสดุงานไฟฟ้าและอิเล็กทรอนิกส์ (Electrical & Electronics)
  // -------------------------------------------------------
  {
    sku: 'EE-0001',
    name: 'สายไฟ THW 1x2.5 Sq.mm. (100m/ม้วน)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'ม้วน',
    quantity: 8,
    minThreshold: 2,
    unitPrice: 1250.00,
  },
  {
    sku: 'EE-0002',
    name: 'เทปพันสายไฟ 3M (สีดำ)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'ม้วน',
    quantity: 120,
    minThreshold: 20,
    unitPrice: 28.00,
  },
  {
    sku: 'EE-0003',
    name: 'ตะกั่วบัดกรีผสมน้ำยา (1 ปอนด์/ม้วน)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'ม้วน',
    quantity: 10,
    minThreshold: 3,
    unitPrice: 420.00,
  },
  {
    sku: 'EE-0004',
    name: 'แผ่นปริ้นต์อเนกประสงค์ PCB (ขนาด 10x15 cm)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'แผ่น',
    quantity: 60,
    minThreshold: 15,
    unitPrice: 35.00,
  },
  {
    sku: 'EE-0005',
    name: 'ตัวต้านทาน Resistor 1/4W (คละค่า/แพ็ก 100 ตัว)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'แพ็ก',
    quantity: 25,
    minThreshold: 5,
    unitPrice: 50.00,
  },
  {
    sku: 'EE-0006',
    name: 'หลอดไฟ LED T8 18W (แบบยาว)',
    category: 'วัสดุงานไฟฟ้าและอิเล็กทรอนิกส์',
    unit: 'หลอด',
    quantity: 50,
    minThreshold: 10,
    unitPrice: 89.00,
  },

  // -------------------------------------------------------
  // 5. หมวดวัสดุงานเชื่อมและโลหะการ (Welding & Metalwork)
  // -------------------------------------------------------
  {
    sku: 'WM-0001',
    name: 'ลวดเชื่อมไฟฟ้า RB-26 ขนาด 2.6 มม. (box 5kg)',
    category: 'วัสดุงานเชื่อมและโลหะการ',
    unit: 'กล่อง',
    quantity: 18,
    minThreshold: 5,
    unitPrice: 480.00,
  },
  {
    sku: 'WM-0002',
    name: 'ลวดเชื่อม CO2 (MIG) ขนาด 0.8 มม. (15kg/ม้วน)',
    category: 'วัสดุงานเชื่อมและโลหะการ',
    unit: 'ม้วน',
    quantity: 5,
    minThreshold: 2,
    unitPrice: 1100.00,
  },
  {
    sku: 'WM-0003',
    name: 'ใบตัดเหล็ก 4 นิ้ว (บาง 1 มม.)',
    category: 'วัสดุงานเชื่อมและโลหะการ',
    unit: 'ใบ',
    quantity: 200,
    minThreshold: 30,
    unitPrice: 15.00,
  },
  {
    sku: 'WM-0004',
    name: 'ใบเจียร์เหล็ก 4 นิ้ว',
    category: 'วัสดุงานเชื่อมและโลหะการ',
    unit: 'ใบ',
    quantity: 150,
    minThreshold: 25,
    unitPrice: 22.00,
  },
  {
    sku: 'WM-0005',
    name: 'นมหนูหัวตัดแก๊ส (Cutting Tip)',
    category: 'วัสดุงานเชื่อมและโลหะการ',
    unit: 'ตัว',
    quantity: 30,
    minThreshold: 5,
    unitPrice: 120.00,
  },

  // -------------------------------------------------------
  // 6. หมวดวัสดุโยธา ก่อสร้าง และสถาปัตยกรรม (Civil, Construction & Arch)
  // -------------------------------------------------------
  {
    sku: 'CC-0001',
    name: 'ปูนซีเมนต์ปอร์ตแลนด์ Type 1 (50 กิโลกรัม)',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'ถุง',
    quantity: 40,
    minThreshold: 10,
    unitPrice: 145.00,
  },
  {
    sku: 'CC-0002',
    name: 'ท่อ PVC ดื่มน้ำ 1/2 นิ้ว (ชั้น 13.5 ยาว 4m)',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'ท่อน',
    quantity: 60,
    minThreshold: 15,
    unitPrice: 65.00,
  },
  {
    sku: 'CC-0003',
    name: 'สีทาอาคารชนิดอะคริลิก สีขาว (9 ลิตร)',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'ถัง',
    quantity: 8,
    minThreshold: 2,
    unitPrice: 89.00,
  },
  {
    sku: 'CC-0004',
    name: 'แปรงทาสีขนาด 3 นิ้ว',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'ด้าม',
    quantity: 45,
    minThreshold: 10,
    unitPrice: 38.00,
  },
  {
    sku: 'CC-0005',
    name: 'กระดาษไขเขียนแบบ A3 (80 แกรม)',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'รีม',
    quantity: 10,
    minThreshold: 2,
    unitPrice: 380.00,
  },
  {
    sku: 'CC-0006',
    name: 'แผ่นพลาสติกสไตรีนทำโมเดล 1 มม.',
    category: 'วัสดุโยธา ก่อสร้าง และสถาปัตยกรรม',
    unit: 'แผ่น',
    quantity: 30,
    minThreshold: 5,
    unitPrice: 95.00,
  },

  // -------------------------------------------------------
  // 7. หมวดวัสดุความปลอดภัยและเซฟตี้ (Safety & PPE)
  // -------------------------------------------------------
  {
    sku: 'SF-0001',
    name: 'ถุงมือผ้าดิบ (ขอบส้ม/ทอ 700 กรัม)',
    category: 'วัสดุความปลอดภัยและเซฟตี้',
    unit: 'โหล',
    quantity: 35,
    minThreshold: 10,
    unitPrice: 90.00,
  },
  {
    sku: 'SF-0002',
    name: 'ถุงมือหนังสำหรับงานเชื่อม',
    category: 'วัสดุความปลอดภัยและเซฟตี้',
    unit: 'คู่',
    quantity: 25,
    minThreshold: 5,
    unitPrice: 140.00,
  },
  {
    sku: 'SF-0003',
    name: 'แว่นตานิรภัยกันสะเก็ด (Clear Lens)',
    category: 'วัสดุความปลอดภัยและเซฟตี้',
    unit: 'อัน',
    quantity: 50,
    minThreshold: 10,
    unitPrice: 65.00,
  },
  {
    sku: 'SF-0004',
    name: 'ปลั๊กอุดหูลดเสียง (Earplug สายนิ่ม)',
    category: 'วัสดุความปลอดภัยและเซฟตี้',
    unit: 'คู่',
    quantity: 100,
    minThreshold: 20,
    unitPrice: 25.00,
  },

  // -------------------------------------------------------
  // 8. หมวดวัสดุทำความสะอาดและงานบ้าน (Janitorial Supplies)
  // -------------------------------------------------------
  {
    sku: 'JN-0001',
    name: 'น้ำยาถูพื้นและฆ่าเชื้อโรค 5,000 มล.',
    category: 'วัสดุทำความสะอาดและงานบ้าน',
    unit: 'แกลลอน',
    quantity: 12,
    minThreshold: 3,
    unitPrice: 240.00,
  },
  {
    sku: 'JN-0002',
    name: 'น้ำยาล้างห้องน้ำเข้มข้น 5,000 มล.',
    category: 'วัสดุทำความสะอาดและงานบ้าน',
    unit: 'แกลลอน',
    quantity: 15,
    minThreshold: 4,
    unitPrice: 210.00,
  },
  {
    sku: 'JN-0003',
    name: 'ถุงขยะสีดำ ขนาด 30x40 นิ้ว (1 กิโลกรัม)',
    category: 'วัสดุทำความสะอาดและงานบ้าน',
    unit: 'แพ็ก',
    quantity: 50,
    minThreshold: 10,
    unitPrice: 55.00,
  },
  {
    sku: 'JN-0004',
    name: 'กระดาษชำระม้วนใหญ่ (Jumbo Roll)',
    category: 'วัสดุทำความสะอาดและงานบ้าน',
    unit: 'ม้วน',
    quantity: 40,
    minThreshold: 10,
    unitPrice: 75.00,
  },
]

async function main() {
  console.log('')
  console.log('🗑️  กำลังลบข้อมูลวัสดุเก่าทั้งหมด...')
  console.log('----------------------------------------')

  // ลบข้อมูลที่เกี่ยวข้องก่อน (foreign key constraint)
  const deletedRequisitionItems = await prisma.requisitionItem.deleteMany({})
  console.log(`   ✅ ลบ requisition_items   : ${deletedRequisitionItems.count} รายการ`)

  const deletedStockTx = await prisma.stockTransaction.deleteMany({})
  console.log(`   ✅ ลบ stock_transactions  : ${deletedStockTx.count} รายการ`)

  const deletedItems = await prisma.item.deleteMany({})
  console.log(`   ✅ ลบ items               : ${deletedItems.count} รายการ`)

  console.log('')
  console.log('📦 กำลังเพิ่มข้อมูลวัสดุใหม่ทั้ง 8 หมวด...')
  console.log('----------------------------------------')

  // เพิ่มข้อมูลใหม่ทีละรายการ
  let count = 0
  for (const item of itemsData) {
    await prisma.item.create({ data: item })
    count++
    process.stdout.write(`\r   กำลังเพิ่ม: ${count}/${itemsData.length} รายการ`)
  }

  console.log('\n')
  console.log('✅ เพิ่มข้อมูลวัสดุทั้งหมดสำเร็จ!')
  console.log('========================================')

  // สรุปตามหมวด
  const categories = [...new Set(itemsData.map(i => i.category))]
  for (const cat of categories) {
    const catItems = itemsData.filter(i => i.category === cat)
    console.log(`   📁 ${cat}: ${catItems.length} รายการ`)
  }

  console.log('----------------------------------------')
  console.log(`   รวมทั้งสิ้น: ${itemsData.length} รายการ ใน ${categories.length} หมวดหมู่`)
  console.log('')
}

main()
  .catch((error) => {
    console.error('\n❌ Seed ล้มเหลว:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
