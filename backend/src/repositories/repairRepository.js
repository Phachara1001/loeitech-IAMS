import prisma from '../prisma/index.js';

/**
 * ดึงรายการแจ้งซ่อมทั้งหมด
 */
export const findAll = async () => {
  return await prisma.repairRequest.findMany({
    include: {
      asset: {
        select: {
          id: true,
          seq: true,
          name: true,
          status: true,
          location: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * ดึงรายการตาม ID
 */
export const findById = async (id) => {
  return await prisma.repairRequest.findUnique({
    where: { id: Number(id) },
    include: { asset: true }
  });
};

/**
 * นับจำนวนใบแจ้งซ่อมทั้งหมด
 */
export const count = async () => {
  return await prisma.repairRequest.count();
};

/**
 * สร้างใบแจ้งซ่อมพัสดุชิ้นใหม่
 */
export const create = async (data) => {
  return await prisma.repairRequest.create({
    data: {
      repairCode: data.repairCode,
      assetId: Number(data.assetId),
      reporterName: data.reporterName,
      description: data.description,
      urgency: data.urgency,
      status: 'PENDING'
    }
  });
};

/**
 * อัปเดตสถานะใบซ่อมและจัดการอัปเดตสถานะครุภัณฑ์ในตาราง Asset (ใช้ Transaction)
 */
export const updateStatus = async (id, { status, approvedBy, repairCost, remark }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. ตรวจสอบใบแจ้งซ่อมเดิม
    const repair = await tx.repairRequest.findUnique({
      where: { id: Number(id) }
    });

    if (!repair) throw Object.assign(new Error('ไม่พบข้อมูลการแจ้งซ่อม'), { status: 404 });

    const updateData = { status };

    if (approvedBy !== undefined) updateData.approvedBy = approvedBy;
    if (remark !== undefined) updateData.remark = remark;

    // กรณีเริ่มซ่อม (APPROVED / REPAIRING)
    if (status === 'APPROVED' || status === 'REPAIRING') {
      updateData.approvedAt = new Date();
      // อัปเดตสถานะ Asset เป็น 'Repaired' (กำลังส่งซ่อม/บำรุง)
      await tx.asset.update({
        where: { id: repair.assetId },
        data: { status: 'Repaired' }
      });
    }

    // กรณีซ่อมแซมสำเร็จเสร็จสิ้น (COMPLETED)
    if (status === 'COMPLETED') {
      updateData.finishDate = new Date();
      updateData.repairCost = Number(repairCost) || 0;
      
      // ปรับปรุงสถานะครุภัณฑ์ให้เป็นปกติพร้อมใช้งาน 'Active'
      await tx.asset.update({
        where: { id: repair.assetId },
        data: { status: 'Active' }
      });
    }

    // กรณีซ่อมไม่สำเร็จ หรือจำหน่ายออก (BROKEN / SCRAPPED)
    if (status === 'REJECTED') {
      // คืนค่าสภาพพัสดุเป็น Active หรือคงเดิม
      await tx.asset.update({
        where: { id: repair.assetId },
        data: { status: 'Active' }
      });
    }

    return await tx.repairRequest.update({
      where: { id: Number(id) },
      data: updateData
    });
  });
};
