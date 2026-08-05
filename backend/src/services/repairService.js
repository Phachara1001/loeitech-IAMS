import * as repairRepository from '../repositories/repairRepository.js';

export const getAllRepairs = async () => {
  return await repairRepository.findAll();
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
