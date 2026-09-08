import * as requisitionRepository from '../repositories/requisitionRepository.js';

/**
 * Generate เลขที่คำขอเบิก เช่น 1/2567
 */
const generateReqCode = async (fiscalYear) => {
  const buddhistYear = fiscalYear || (new Date().getFullYear() + 543);
  const count = await requisitionRepository.count();
  return `${count + 1}/${buddhistYear}`;
};

/**
 * สร้างคำขอเบิกพัสดุใหม่
 * @param {Object} data
 * @param {Array}  data.items  - [{ id, qty }]
 * @param {string} data.reason
 * @param {number} [data.requesterId]
 */
export const createRequisition = async (data) => {
  const { items, reason, requesterId, fiscalYear } = data;

  if (!items || items.length === 0) {
    const err = new Error('กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ');
    err.status = 400;
    throw err;
  }
  if (!reason || reason.trim().length < 10) {
    const err = new Error('กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร');
    err.status = 400;
    throw err;
  }

  // สร้างรหัสคำขอ
  const reqCode = await generateReqCode(fiscalYear);

  return await requisitionRepository.create({
    reqCode,
    requesterId: requesterId || null,
    reason: reason.trim(),
    items
  });
};

/**
 * ดึงรายการคำขอเบิกทั้งหมด
 */
export const getAllRequisitions = async ({ status } = {}) => {
  return await requisitionRepository.findAll({ status });
};

/**
 * ดึงคำขอเบิกตาม ID
 */
export const getRequisitionById = async (id) => {
  const req = await requisitionRepository.findById(id);
  if (!req) {
    const err = new Error('ไม่พบคำขอเบิก');
    err.status = 404;
    throw err;
  }
  return req;
};

/**
 * อนุมัติคำขอเบิก (ตัด stock OUT)
 */
export const approveRequisition = async (id, { approvedBy, approverId, approvedQtyMap, remark }) => {
  return await requisitionRepository.approve(id, { approvedBy, approverId, approvedQtyMap, remark });
};

/**
 * ปฏิเสธคำขอเบิก
 */
export const rejectRequisition = async (id, { approvedBy, approverId, remark }) => {
  return await requisitionRepository.reject(id, { approvedBy, approverId, remark });
};
