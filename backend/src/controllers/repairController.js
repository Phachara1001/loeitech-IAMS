import * as repairService from '../services/repairService.js';

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
    res.status(201).json({ status: 'success', data, message: 'ส่งแจ้งซ่อมครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const updateRepairStatus = async (req, res, next) => {
  try {
    const data = await repairService.updateRepairStatus(req.params.id, req.body);
    res.status(200).json({ status: 'success', data, message: 'อัปเดตสถานะการซ่อมสำเร็จ' });
  } catch (error) {
    next(error);
  }
};
