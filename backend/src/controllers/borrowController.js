import * as borrowService from '../services/borrowService.js';
import { logActivity } from '../utils/activityLogger.js';

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

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'BORROW_TRANSACTION',
      entityId: data.id,
      newValue: data,
      details: `ส่งคำขอยืมครุภัณฑ์ ${data.borrowCode || ''}`
    });

    res.status(201).json({ status: 'success', data, message: 'ส่งคำขอยืมครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const approveBorrow = async (req, res, next) => {
  try {
    const before = await borrowService.getBorrowById(req.params.id);
    const data = await borrowService.approveBorrow(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'BORROW_TRANSACTION',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `อนุมัติคำขอยืมครุภัณฑ์ ${data.borrowCode || ''}`
    });

    res.status(200).json({ status: 'success', data, message: 'อนุมัติการยืมพัสดุสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

export const rejectBorrow = async (req, res, next) => {
  try {
    const before = await borrowService.getBorrowById(req.params.id);
    const data = await borrowService.rejectBorrow(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'BORROW_TRANSACTION',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `ปฏิเสธคำขอยืมครุภัณฑ์ ${data.borrowCode || ''}`
    });

    res.status(200).json({ status: 'success', data, message: 'ปฏิเสธคำขอยืมพัสดุแล้ว' });
  } catch (error) {
    next(error);
  }
};

export const returnBorrow = async (req, res, next) => {
  try {
    const before = await borrowService.getBorrowById(req.params.id);
    const data = await borrowService.returnBorrow(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'BORROW_TRANSACTION',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `บันทึกการส่งคืนครุภัณฑ์ ${data.borrowCode || ''}`
    });

    res.status(200).json({ status: 'success', data, message: 'บันทึกการส่งคืนครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};