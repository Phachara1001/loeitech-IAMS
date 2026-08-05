import prisma from './src/prisma/index.js';

async function main() {
  console.log('กำลังเพิ่มข้อมูลครุภัณฑ์เริ่มต้น...');

  const sampleAssets = [
    {
      seq: 'AST-0001',
      name: 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ Acer Veriton',
      category: 'ครุภัณฑ์คอมพิวเตอร์',
      department: 'แผนกเทคโนโลยีสารสนเทศ',
      brand: 'Acer',
      serialNumber: 'AC1293848123',
      specifications: 'CPU Core i5, RAM 8GB, SSD 512GB',
      acquiredDate: new Date('2025-05-10'),
      acquisitionMethod: 'ตกลงราคา',
      budgetType: 'เงินงบประมาณรายจ่าย',
      unitPrice: 24900,
      status: 'Active',
      remark: 'ใช้งานทั่วไปที่อาคาร 1 ห้อง 201'
    },
    {
      seq: 'AST-0011',
      name: 'เครื่องปรับอากาศ Daikin 18000 BTU',
      category: 'ครุภัณฑ์เครื่องปรับอากาศ',
      department: 'งานบริหารทั่วไป',
      brand: 'Daikin',
      serialNumber: 'DK88273941',
      specifications: '18000 BTU Inverter',
      acquiredDate: new Date('2025-06-15'),
      acquisitionMethod: 'ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
      budgetType: 'เงินรายได้สถานศึกษา',
      unitPrice: 28900,
      status: 'Active',
      remark: 'อาคาร 3 สำนักงานงานพัสดุ'
    },
    {
      seq: 'AST-0032',
      name: 'เครื่องพิมพ์ Laser HP LaserJet P1102',
      category: 'ครุภัณฑ์คอมพิวเตอร์',
      department: 'งานพัสดุกลาง',
      brand: 'HP',
      serialNumber: 'VNC3K92812',
      specifications: 'Laser Mono Printer',
      acquiredDate: new Date('2025-03-20'),
      acquisitionMethod: 'ตกลงราคา',
      budgetType: 'เงินรายได้สถานศึกษา',
      unitPrice: 4900,
      status: 'Active',
      remark: 'ใช้งานที่อาคาร 1 ห้อง 101'
    },
    {
      seq: 'AST-0071',
      name: 'โปรเจกเตอร์ Epson EB-X05',
      category: 'ครุภัณฑ์การศึกษา',
      department: 'งานบริการการศึกษา',
      brand: 'Epson',
      serialNumber: 'EP883719441',
      specifications: '3 LCD Projector 3300 Lumens',
      acquiredDate: new Date('2025-08-01'),
      acquisitionMethod: 'เฉพาะเจาะจง',
      budgetType: 'เงินบำรุงการศึกษา',
      unitPrice: 18500,
      status: 'Active',
      remark: 'ห้องประชุม อาคาร 1 ห้อง 201'
    },
    {
      seq: 'AST-0088',
      name: 'กล้องถ่ายภาพ Canon EOS 200D',
      category: 'ครุภัณฑ์โสตทัศนศึกษา',
      department: 'งานโสตทัศนศึกษา',
      brand: 'Canon',
      serialNumber: 'CN992837482',
      specifications: '24.2 Megapixel DSLR',
      acquiredDate: new Date('2025-10-12'),
      acquisitionMethod: 'เฉพาะเจาะจง',
      budgetType: 'เงินบำรุงการศึกษา',
      unitPrice: 21900,
      status: 'Active',
      remark: 'งานโสตทัศนศึกษา'
    }
  ];

  for (const asset of sampleAssets) {
    const existing = await prisma.asset.findFirst({
      where: { seq: asset.seq }
    });

    if (!existing) {
      await prisma.asset.create({ data: asset });
      console.log(`เพิ่มครุภัณฑ์: ${asset.name} (${asset.seq}) สำเร็จ`);
    } else {
      console.log(`ครุภัณฑ์: ${asset.name} (${asset.seq}) มีอยู่ในระบบแล้ว`);
    }
  }

  console.log('การเพิ่มข้อมูลครุภัณฑ์เริ่มต้นเสร็จเรียบร้อยแล้ว!');
}

main()
  .catch((e) => {
    console.error('เกิดข้อผิดพลาด:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
