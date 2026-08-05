import * as borrowService from '../services/borrowService.js';

export const getBorrows = async (req, res, next) => {
  try {
    const data = await borrowService.getAllBorrows();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createBorrow = async (req, res, next) => {
  try {
    const data = await borrowService.createBorrow(req.body);
    res.status(201).json({ status: 'success', data, message: 'ส่งคำขอยืมครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const approveBorrow = async (req, res, next) => {
  try {
    const data = await borrowService.approveBorrow(req.params.id, req.body);
    res.status(200).json({ status: 'success', data, message: 'อนุมัติการยืมพัสดุสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const rejectBorrow = async (req, res, next) => {
  try {
    const data = await borrowService.rejectBorrow(req.params.id, req.body);
    res.status(200).json({ status: 'success', data, message: 'ปฏิเสธคำขอยืมพัสดุแล้ว' });
  } catch (error) {
    next(error);
  }
};

export const returnBorrow = async (req, res, next) => {
  try {
    const data = await borrowService.returnBorrow(req.params.id, req.body);
    res.status(200).json({ status: 'success', data, message: 'บันทึกการส่งคืนครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};
