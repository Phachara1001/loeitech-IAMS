import * as repairService from '../services/repairService.js';
import { logActivity } from '../utils/activityLogger.js';

export const getRepairs = async (req, res, next) => {
  try {
    const data = await repairService.getAllRepairs();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createRepair = async (req, res, next) => {
  try {
    const data = await repairService.createRepair(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'REPAIR_REQUEST',
      entityId: data.id,
      newValue: data,
      details: `แจ้งซ่อมครุภัณฑ์ ${data.repairCode || ''}`
    });

    res.status(201).json({ status: 'success', data, message: 'ส่งแจ้งซ่อมครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const updateRepairStatus = async (req, res, next) => {
  try {
    const before = await repairService.getRepairById(req.params.id);
    const data = await repairService.updateRepairStatus(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'REPAIR_REQUEST',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `อัปเดตสถานะการซ่อม ${data.repairCode || ''} เป็น "${req.body.status || data.status || ''}"`
    });

    res.status(200).json({ status: 'success', data, message: 'อัปเดตสถานะการซ่อมสำเร็จ' });
  } catch (error) {
    next(error);
  }
};