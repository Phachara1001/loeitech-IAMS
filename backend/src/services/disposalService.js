import * as disposalRepository from '../repositories/disposalRepository.js';
import * as userRepository from '../repositories/userRepository.js';

const currentFiscalYearBE = () => {
  const now = new Date();
  // ปีงบประมาณไทย: 1 ต.ค. - 30 ก.ย. (เดือน index 9 = ต.ค.)
  const startYearAD = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return startYearAD + 1 + 543;
};

const generateDisposalCode = async () => {
  const fiscalYear = currentFiscalYearBE();
  const prefix = `DSP-${fiscalYear}-`;
  const countThisYear = await disposalRepository.countByYearPrefix(prefix);
  return `${prefix}${String(countThisYear + 1).padStart(3, '0')}`;
};

export const getEligibleAssets = async () => {
  return await disposalRepository.findEligibleAssets();
};

export const getAllRequests = async (filters) => {
  return await disposalRepository.findAll(filters);
};

export const getRequestById = async (id) => {
  const req = await disposalRepository.findById(id);
  if (!req) {
    const err = new Error('ไม่พบคำขอจำหน่ายรายการนี้');
    err.status = 404;
    throw err;
  }
  return req;
};

export const createDisposalRequest = async (data, currentUserId) => {
  const disposalCode = await generateDisposalCode();

  // ดึงชื่อผู้สร้างคำขอมาเก็บเป็นข้อความ (ตาม pattern เดียวกับ RepairRequest/BorrowTransaction ในโปรเจกต์นี้)
  let requestedBy = null;
  if (currentUserId) {
    const user = await userRepository.findById(currentUserId);
    requestedBy = user?.name || user?.username || null;
  }

  return await disposalRepository.create({
    disposalCode,
    assetId: Number(data.assetId),
    method: data.method,
    meetingDate: new Date(data.meetingDate),
    committee: data.committee,
    resolution: data.resolution,
    status: 'PENDING',
    requestedBy
  });
};

export const createDisposalRequestBatch = async (data, currentUserId) => {
  const disposalCode = await generateDisposalCode();

  let requestedBy = null;
  if (currentUserId) {
    const user = await userRepository.findById(currentUserId);
    requestedBy = user?.name || user?.username || null;
  }

  if (!data.assetIds || !Array.isArray(data.assetIds) || data.assetIds.length === 0) {
    throw new Error('กรุณาระบุรายการครุภัณฑ์ที่ต้องการแทงจำหน่าย');
  }

  const requestsData = data.assetIds.map(assetId => ({
    disposalCode,
    assetId: Number(assetId),
    method: data.method,
    meetingDate: new Date(data.meetingDate),
    committee: data.committee,
    resolution: data.resolution,
    status: 'PENDING',
    requestedBy
  }));

  await disposalRepository.createMany(requestsData);
  return disposalCode;
};

export const approveRequest = async (id, approverName) => {
  return await disposalRepository.updateStatus(id, {
    status: 'APPROVED',
    approvedBy: approverName || null,
    approvedAt: new Date()
  });
};

export const approveRequestBatch = async (disposalCode, approverName) => {
  // 1. อัปเดตสถานะคำขอเป็น APPROVED + ตัดยอด Asset เป็น Scrapped ทันทีตาม Requirement
  const requests = await disposalRepository.findByDisposalCode(disposalCode);
  if (requests.length === 0) {
    throw new Error('ไม่พบคำขอจำหน่ายรหัสนี้');
  }

  // อนุมัติและแทงจำหน่ายเลย
  const assetIds = requests.map(r => r.assetId);
  await disposalRepository.updateStatusByDisposalCode(disposalCode, {
    status: 'DISPOSED',
    approvedBy: approverName || null,
    approvedAt: new Date(),
    disposedAt: new Date()
  });

  // อัปเดต asset 
  for (const assetId of assetIds) {
    // Cannot use markDisposedBatchWithAssetUpdate because it overrides updateStatusByDisposalCode,
    // Actually, I can just update assets directly here
    const { update } = await import('../repositories/assetRepository.js');
    await update(assetId, { status: 'Scrapped' });
  }

  return requests;
};

export const rejectRequest = async (id, remark) => {
  return await disposalRepository.updateStatus(id, {
    status: 'REJECTED',
    remark: remark || null
  });
};

export const rejectRequestBatch = async (disposalCode, remark) => {
  await disposalRepository.updateStatusByDisposalCode(disposalCode, {
    status: 'REJECTED',
    remark: remark || null
  });
  return await disposalRepository.findByDisposalCode(disposalCode);
};

export const markDisposed = async (id) => {
  const req = await getRequestById(id);
  if (req.status !== 'APPROVED') {
    const err = new Error('ต้องอนุมัติคำขอก่อน จึงจะบันทึกจำหน่ายแล้วได้');
    err.status = 400;
    throw err;
  }
  const [updated] = await disposalRepository.markDisposedWithAssetUpdate(id, req.assetId);
  return updated;
};