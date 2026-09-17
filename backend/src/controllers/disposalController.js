import * as disposalService from '../services/disposalService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * GET /api/disposal-requests/eligible-assets
 */
export const getEligibleAssets = async (req, res, next) => {
  try {
    const assets = await disposalService.getEligibleAssets();
    res.status(200).json({ status: 'success', data: assets });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/disposal-requests?search=...
 */
export const getRequests = async (req, res, next) => {
  try {
    const { search } = req.query;
    const requests = await disposalService.getAllRequests({ search });
    res.status(200).json({ status: 'success', data: requests });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/disposal-requests
 * body: { assetId, method, meetingDate, committee, resolution }
 */
export const createRequest = async (req, res, next) => {
  try {
    const { assetId, method, meetingDate, committee, resolution } = req.body;
    if (!assetId || !meetingDate || !committee?.trim() || !resolution?.trim()) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const created = await disposalService.createDisposalRequest(req.body, req.user?.id);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'DISPOSAL',
      entityId: created.id,
      newValue: created,
      details: `สร้างคำขอจำหน่าย "${created.asset.name}" (${created.disposalCode})`
    });

    res.status(201).json({ status: 'success', data: created, message: 'สร้างคำขอจำหน่ายสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/disposal-requests/batch
 * body: { assetIds: [], method, meetingDate, committee, resolution }
 */
export const createRequestBatch = async (req, res, next) => {
  try {
    const { assetIds, method, meetingDate, committee, resolution } = req.body;
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0 || !meetingDate || !committee?.trim() || !resolution?.trim()) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const disposalCode = await disposalService.createDisposalRequestBatch(req.body, req.user?.id);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'DISPOSAL',
      entityId: disposalCode,
      newValue: { disposalCode, assetIds },
      details: `สร้างคำขอจำหน่ายแบบกลุ่ม จำนวน ${assetIds.length} รายการ (${disposalCode})`
    });

    res.status(201).json({ status: 'success', data: { disposalCode }, message: 'สร้างคำขอจำหน่ายสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/disposal-requests/:id/approve
 */
export const approveRequest = async (req, res, next) => {
  try {
    const before = await disposalService.getRequestById(req.params.id);
    const approverName = req.body?.approverName || req.user?.name || req.user?.username || null;
    const updated = await disposalService.approveRequest(req.params.id, approverName);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'DISPOSAL',
      entityId: updated.id,
      oldValue: before,
      newValue: updated,
      details: `อนุมัติคำขอจำหน่าย "${updated.asset.name}" (${updated.disposalCode})`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'อนุมัติคำขอสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/disposal-requests/batch/:disposalCode/approve
 */
export const approveRequestBatch = async (req, res, next) => {
  try {
    const { disposalCode } = req.params;
    const approverName = req.body?.approverName || req.user?.name || req.user?.username || null;
    const updated = await disposalService.approveRequestBatch(disposalCode, approverName);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'DISPOSAL',
      entityId: disposalCode,
      details: `อนุมัติคำขอจำหน่ายแบบกลุ่ม (${disposalCode})`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'อนุมัติคำขอสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/disposal-requests/:id/reject
 * body: { remark? }
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const before = await disposalService.getRequestById(req.params.id);
    const updated = await disposalService.rejectRequest(req.params.id, req.body?.remark);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'DISPOSAL',
      entityId: updated.id,
      oldValue: before,
      newValue: updated,
      details: `ไม่อนุมัติคำขอจำหน่าย "${updated.asset.name}" (${updated.disposalCode})`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'บันทึกการไม่อนุมัติแล้ว' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/disposal-requests/batch/:disposalCode/reject
 */
export const rejectRequestBatch = async (req, res, next) => {
  try {
    const { disposalCode } = req.params;
    const updated = await disposalService.rejectRequestBatch(disposalCode, req.body?.remark);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'DISPOSAL',
      entityId: disposalCode,
      details: `ไม่อนุมัติคำขอจำหน่ายแบบกลุ่ม (${disposalCode})`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'บันทึกการไม่อนุมัติแล้ว' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/disposal-requests/:id/dispose
 * บันทึกจำหน่ายแล้ว — ตัดยอด Asset.status เป็น Scrapped ให้อัตโนมัติ
 */
export const markDisposed = async (req, res, next) => {
  try {
    const before = await disposalService.getRequestById(req.params.id);
    const updated = await disposalService.markDisposed(req.params.id);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'DISPOSAL',
      entityId: updated.id,
      oldValue: before,
      newValue: updated,
      details: `บันทึกจำหน่ายแล้ว "${updated.asset.name}" (${updated.disposalCode}) — ตัดยอดออกจากบัญชีคุมคลัง`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'บันทึกจำหน่ายแล้วสำเร็จ' });
  } catch (error) {
    next(error);
  }
};