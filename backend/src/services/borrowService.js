import * as borrowRepository from '../repositories/borrowRepository.js';
import prisma from '../prisma/index.js';

/**
 * ดึงคำขอยืมทั้งหมด
 */
export const getAllBorrows = async () => {
  return await borrowRepository.findAll();
};

/**
 * สร้างคำขอยืมครุภัณฑ์ใหม่
 */
export const createBorrow = async (data) => {
  // 1. ตรวจสอบว่าครุภัณฑ์พร้อมยืมหรือไม่
  const asset = await prisma.asset.findUnique({
    where: { id: Number(data.assetId) }
  });

  if (!asset) {
    throw Object.assign(new Error('ไม่พบข้อมูลครุภัณฑ์ที่ต้องการยืม'), { status: 404 });
  }

  if (asset.status !== 'Active') {
    throw Object.assign(new Error(`ครุภัณฑ์ "${asset.name}" ไม่พร้อมให้ยืมในขณะนี้ (สถานะ: ${asset.status})`), { status: 400 });
  }

  // 2. ออกรหัส Borrow Code
  const count = await borrowRepository.count();
  const currentYear = new Date().getFullYear() + 543; // พ.ศ.
  const borrowCode = `BRW-${currentYear}-${String(count + 1).padStart(4, '0')}`;

  const payload = {
    ...data,
    borrowCode
  };

  return await borrowRepository.create(payload);
};

/**
 * ดึงคำขอยืมตาม ID (ใช้เก็บค่าก่อนแก้ไขสำหรับ activity log)
 */
export const getBorrowById = async (id) => {
  const borrow = await prisma.borrowTransaction.findUnique({
    where: { id: Number(id) }
  });
  if (!borrow) {
    throw Object.assign(new Error('ไม่พบรายการยืม-คืนนี้'), { status: 404 });
  }
  return borrow;
};

/**
 * อนุมัติการยืม
 */
export const approveBorrow = async (id, { approvedBy }) => {
  return await borrowRepository.approve(id, { approvedBy });
};

/**
 * ปฏิเสธการยืม
 */
export const rejectBorrow = async (id, { approvedBy, remark }) => {
  return await borrowRepository.reject(id, { approvedBy, remark });
};

/**
 * บันทึกรับคืน
 */
export const returnBorrow = async (id, { returnedTo, remark }) => {
  return await borrowRepository.returnAsset(id, { returnedTo, remark });
};