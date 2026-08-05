import prisma from '../prisma/index.js';

/**
 * ดึงรายการการยืม-คืนทั้งหมด
 */
export const findAll = async () => {
  return await prisma.borrowTransaction.findMany({
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
 * ดึงการยืมตาม ID
 */
export const findById = async (id) => {
  return await prisma.borrowTransaction.findUnique({
    where: { id: Number(id) },
    include: { asset: true }
  });
};

/**
 * นับจำนวนรายการยืมทั้งหมด (สำหรับช่วยออกเลขที่เอกสาร)
 */
export const count = async () => {
  return await prisma.borrowTransaction.count();
};

/**
 * สร้างคำขอยืมครุภัณฑ์ใหม่
 */
export const create = async (data) => {
  return await prisma.borrowTransaction.create({
    data: {
      borrowCode: data.borrowCode,
      assetId: Number(data.assetId),
      borrowerName: data.borrowerName,
      borrowerDept: data.borrowerDept,
      borrowDate: new Date(data.borrowDate),
      dueDate: new Date(data.dueDate),
      purpose: data.purpose,
      status: 'PENDING'
    }
  });
};

/**
 * อนุมัติการยืมพัสดุ (อัปเดตสถานะของครุภัณฑ์ใน Asset table เป็น 'Borrowed' พร้อมกัน)
 */
export const approve = async (id, { approvedBy }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. ดึงรายละเอียดคำขอยืม
    const transaction = await tx.borrowTransaction.findUnique({
      where: { id: Number(id) }
    });

    if (!transaction) throw Object.assign(new Error('ไม่พบรายการยืม'), { status: 404 });
    if (transaction.status !== 'PENDING') {
      throw Object.assign(new Error('รายการนี้ถูกอนุมัติหรือปฏิเสธไปแล้ว'), { status: 400 });
    }

    // 2. ตรวจสอบสถานะครุภัณฑ์
    const asset = await tx.asset.findUnique({ where: { id: transaction.assetId } });
    if (!asset || asset.status !== 'Active') {
      throw Object.assign(new Error(`ครุภัณฑ์นี้ไม่พร้อมใช้งาน (สถานะปัจจุบัน: ${asset ? asset.status : 'ไม่พบ'})`), { status: 400 });
    }

    // 3. ปรับปรุงสถานะครุภัณฑ์
    await tx.asset.update({
      where: { id: transaction.assetId },
      data: { status: 'Borrowed' }
    });

    // 4. อัปเดตสถานะใบยืม
    return await tx.borrowTransaction.update({
      where: { id: Number(id) },
      data: {
        status: 'BORROWED',
        approvedBy,
        approvedAt: new Date()
      }
    });
  });
};

/**
 * ปฏิเสธการยืมพัสดุ
 */
export const reject = async (id, { approvedBy, remark }) => {
  return await prisma.borrowTransaction.update({
    where: { id: Number(id) },
    data: {
      status: 'REJECTED',
      approvedBy,
      approvedAt: new Date(),
      remark
    }
  });
};

/**
 * บันทึกรับคืนครุภัณฑ์ (อัปเดตสถานะของครุภัณฑ์เป็น 'Active' ให้ยืมต่อได้)
 */
export const returnAsset = async (id, { returnedTo, remark }) => {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.borrowTransaction.findUnique({
      where: { id: Number(id) }
    });

    if (!transaction) throw Object.assign(new Error('ไม่พบรายการยืม'), { status: 404 });
    if (transaction.status !== 'BORROWED') {
      throw Object.assign(new Error('รายการนี้ยังไม่ได้รับการอนุมัติยืม หรือได้ถูกส่งคืนไปแล้ว'), { status: 400 });
    }

    // 1. คืนสถานะครุภัณฑ์ให้เป็น Active
    await tx.asset.update({
      where: { id: transaction.assetId },
      data: { status: 'Active' }
    });

    // 2. อัปเดตใบยืม
    return await tx.borrowTransaction.update({
      where: { id: Number(id) },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
        returnedTo,
        remark
      }
    });
  });
};
