import * as repairRepository from '../repositories/repairRepository.js';
import prisma from '../prisma/index.js';

export const getAllRepairs = async () => {
  return await repairRepository.findAll();
};

/**
 * ดึงคำขอแจ้งซ่อมตาม ID (ใช้เก็บค่าก่อนแก้ไขสำหรับ activity log)
 */
export const getRepairById = async (id) => {
  const repair = await prisma.repairRequest.findUnique({
    where: { id: Number(id) }
  });
  if (!repair) {
    throw Object.assign(new Error('ไม่พบรายการแจ้งซ่อมนี้'), { status: 404 });
  }
  return repair;
};

export const createRepair = async (data) => {
  // 1. Generate code (REP-ปีพ.ศ.-ลำดับ)
  const count = await repairRepository.count();
  const currentYear = new Date().getFullYear() + 543;
  const repairCode = `REP-${currentYear}-${String(count + 1).padStart(4, '0')}`;

  const payload = {
    ...data,
    repairCode
  };

  return await repairRepository.create(payload);
};

export const updateRepairStatus = async (id, data) => {
  return await repairRepository.updateStatus(id, data);
};