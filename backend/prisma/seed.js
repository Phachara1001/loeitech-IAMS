import 'dotenv/config'
import bcrypt from 'bcrypt'
import prisma from '../src/prisma/index.js'

// สามารถปรับค่าเริ่มต้นได้โดยตั้ง environment variable เหล่านี้ใน .env
// (ถ้าไม่ตั้ง จะใช้ค่า default ด้านล่างนี้)
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@loeitc.ac.th'
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'ผู้ดูแลระบบ'

const SALT_ROUNDS = 10

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

  // ใช้ upsert: ถ้ามีบัญชีอีเมลนี้อยู่แล้ว จะแค่อัปเดต role เป็น ADMIN (ไม่แตะรหัสผ่านเดิม)
  // ถ้ายังไม่มี จะสร้างบัญชีใหม่ให้ทั้งหมด
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('')
  console.log('✅ สร้าง/อัปเดตบัญชี Admin สำเร็จ')
  console.log('----------------------------------------')
  console.log(`   อีเมล      : ${admin.email}`)
  console.log(`   Username   : ${admin.username}`)
  console.log(`   รหัสผ่าน   : ${ADMIN_PASSWORD}`)
  console.log('----------------------------------------')
  console.log('⚠️  หมายเหตุ: ถ้าบัญชีนี้เคยมีอยู่แล้ว รหัสผ่านเดิมจะไม่ถูกเปลี่ยน')
  console.log('   (สคริปต์นี้จะอัปเดตแค่สิทธิ์ role เป็น ADMIN เท่านั้น)')
  console.log('')
}

main()
  .catch((error) => {
    console.error('❌ Seed ล้มเหลว:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })