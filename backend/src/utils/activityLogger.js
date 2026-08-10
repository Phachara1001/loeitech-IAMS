import prisma from '../prisma/index.js';

/**
 * ดึง IP ของผู้ทำรายการ รองรับทั้งกรณีอยู่หลัง proxy/load balancer (x-forwarded-for)
 * และกรณีเชื่อมต่อตรง
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
}

/**
 * บันทึก Activity Log — เรียกใช้จาก controller หลังทำรายการ INSERT/UPDATE/DELETE/LOGIN สำเร็จ
 *
 * @param {object} params
 * @param {object} params.req - Express request object (ใช้ดึง user ที่ login อยู่ และ IP)
 * @param {'INSERT'|'UPDATE'|'DELETE'|'LOGIN'} params.action
 * @param {string} params.entityType - เช่น 'DEPARTMENT', 'LOCATION', 'USER', 'ASSET'
 * @param {string|number} [params.entityId]
 * @param {object|null} [params.oldValue] - ค่าก่อนแก้ไข (ใช้กับ UPDATE/DELETE)
 * @param {object|null} [params.newValue] - ค่าหลังแก้ไข (ใช้กับ INSERT/UPDATE)
 * @param {string} [params.details] - คำอธิบายสั้น ๆ
 * @param {number} [params.userId] - ระบุ userId ตรง ๆ แทนการอ่านจาก req.user (ใช้ตอน login ที่ req.user ยังไม่ถูกตั้งค่า)
 *
 * หมายเหตุ: ฟังก์ชันนี้ "กลืน error" เอง ไม่ throw ต่อ เพื่อไม่ให้การบันทึก log ที่ล้มเหลว
 * ไปทำให้ request หลัก (เช่น การสร้าง/แก้ไขข้อมูลจริง) ล้มเหลวตามไปด้วย
 */
export async function logActivity({
  req,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  details = null,
  userId
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? req.user?.id ?? null,
        action,
        entityType,
        entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
        details,
        ipAddress: getClientIp(req),
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined
      }
    });
  } catch (error) {
    console.error('บันทึก Activity Log ไม่สำเร็จ:', error.message);
  }
}