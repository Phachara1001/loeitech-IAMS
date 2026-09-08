import api from './api.js'

// ==========================================
// Items (InventoryStock)
// ==========================================

/** ดึงรายการวัสดุทั้งหมด รองรับ search และ category filter */
export const getItems = (params = {}) =>
  api.get('/items', { params }).then((r) => r.data.data)

/** ดึงวัสดุรายการเดียวตาม ID */
export const getItemById = (id) =>
  api.get(`/items/${id}`).then((r) => r.data.data)

/** เพิ่มวัสดุใหม่ */
export const createItem = (data) =>
  api.post('/items', data).then((r) => r.data.data)

/** แก้ไขวัสดุ */
export const updateItem = (id, data) =>
  api.put(`/items/${id}`, data).then((r) => r.data.data)

/** ลบวัสดุ */
export const deleteItem = (id) =>
  api.delete(`/items/${id}`).then((r) => r.data)

/** ดูประวัติ Running Balance ของวัสดุรายชิ้น */
export const getItemTransactions = (id) =>
  api.get(`/items/${id}/transactions`).then((r) => r.data.data)

/** ดูประวัติ Running Balance ของวัสดุทั้งหมด */
export const getAllItemTransactions = () =>
  api.get(`/items/transactions/all`).then((r) => r.data.data)

/** บันทึกผลตรวจนับ Inventory Check (ADJUSTMENT) */
export const adjustItemQty = (id, data) =>
  api.patch(`/items/${id}/adjust`, data).then((r) => r.data)

// ==========================================
// Stock Receive (InventoryReceive)
// ==========================================

/**
 * บันทึกรับพัสดุเข้าคลัง
 * @param {Object} data - { itemSourceType, selectedItemId, newItemName, newItemCategory, newItemUnit, qty, unitPrice, receivedDate, acquisitionMethod, budgetType, remark, operatorName }
 */
export const receiveStock = (data) =>
  api.post('/stock-receive', data).then((r) => r.data)

/** ดึงประวัติรับเข้าล่าสุด */
export const getRecentReceives = (limit = 10) =>
  api.get('/stock-receive', { params: { limit } }).then((r) => r.data.data)

// ==========================================
// Requisitions (NewRequisition)
// ==========================================

/**
 * ยื่นคำขอเบิกพัสดุ
 * @param {Object} data - { items: [{ id, qty }], reason }
 */
export const createRequisition = (data) =>
  api.post('/requisitions', data).then((r) => r.data)

/** ดึงรายการคำขอเบิกทั้งหมด */
export const getRequisitions = (params = {}) =>
  api.get('/requisitions', { params }).then((r) => r.data.data)

/** ดึงคำขอเบิกตาม ID */
export const getRequisitionById = (id) =>
  api.get(`/requisitions/${id}`).then((r) => r.data.data)

/** อนุมัติคำขอเบิก */
export const approveRequisition = (id, data) =>
  api.put(`/requisitions/${id}/approve`, data).then((r) => r.data)

/** ปฏิเสธคำขอเบิก */
export const rejectRequisition = (id, data) =>
  api.put(`/requisitions/${id}/reject`, data).then((r) => r.data)

// ==========================================
// Assets (Fixed Assets)
// ==========================================

/** ดึงข้อมูลครุภัณฑ์ทั้งหมด */
export const getAssets = () =>
  api.get('/assets').then((r) => r.data.data)

// ==========================================
// Borrows (Borrow & Return)
// ==========================================

/** ดึงรายการประวัติและคำขอยืมทั้งหมด */
export const getBorrows = () =>
  api.get('/borrows').then((r) => r.data.data)

/** ยื่นคำขอยืมพัสดุครุภัณฑ์ */
export const createBorrow = (data) =>
  api.post('/borrows', data).then((r) => r.data)

/** อนุมัติการยืมพัสดุ */
export const approveBorrow = (id, data) =>
  api.put(`/borrows/${id}/approve`, data).then((r) => r.data)

/** ปฏิเสธการยืมพัสดุ */
export const rejectBorrow = (id, data) =>
  api.put(`/borrows/${id}/reject`, data).then((r) => r.data)

/** บันทึกรับคืนพัสดุครุภัณฑ์ */
export const returnBorrow = (id, data) =>
  api.put(`/borrows/${id}/return`, data).then((r) => r.data)

// ==========================================
// Repairs (Maintenance & Repair)
// ==========================================

/** ดึงข้อมูลรายการซ่อมแซมและประวัติทั้งหมด */
export const getRepairs = () =>
  api.get('/repairs').then((r) => r.data.data)

/** ยื่นเรื่องแจ้งซ่อมครุภัณฑ์พัสดุ */
export const createRepair = (data) =>
  api.post('/repairs', data).then((r) => r.data)

/** อัปเดตสถานะการแจ้งซ่อม (อนุมัติ, กำลังซ่อม, ซ่อมสำเร็จ) */
export const updateRepairStatus = (id, data) =>
  api.put(`/repairs/${id}/status`, data).then((r) => r.data)

// ==========================================
// Asset Distributions
// ==========================================

/** ดึงข้อมูลรายการจัดสรรครุภัณฑ์ทั้งหมด */
export const getAssetDistributions = () =>
  api.get('/asset-distributions').then((r) => r.data.data)

/** จัดสรร / โยกย้ายครุภัณฑ์ใหม่ */
export const createAssetDistribution = (data) =>
  api.post('/asset-distributions', data).then((r) => r.data.data)

// ==========================================
// Asset Timeline
// ==========================================

/** ดึงประวัติไทม์ไลน์ความเคลื่อนไหวของครุภัณฑ์รายชิ้น (คืนค่า { assetStatus, timeline }) */
export const getAssetTimeline = (id) =>
  api.get(`/assets/${id}/timeline`).then((r) => r.data.data)

// ==========================================
// Users List (for Selection)
// ==========================================

/** ดึงรายชื่อบุคลากรทั้งหมด */
export const getUsers = () =>
  api.get('/users').then((r) => r.data.data)

// ==========================================
// Disposal Requests
// ==========================================

/** ดึงรายการคำขอจำหน่ายทั้งหมด */
export const getDisposalRequests = (params = {}) =>
  api.get('/disposal-requests', { params }).then((r) => r.data.data)

/** ยื่นคำขอจำหน่ายครุภัณฑ์ */
export const createDisposalRequest = (data) =>
  api.post('/disposal-requests', data).then((r) => r.data)

/** อนุมัติคำขอจำหน่าย */
export const approveDisposalRequest = (id, data) =>
  api.put(`/disposal-requests/${id}/approve`, data).then((r) => r.data)

/** ปฏิเสธคำขอจำหน่าย */
export const rejectDisposalRequest = (id, data) =>
  api.put(`/disposal-requests/${id}/reject`, data).then((r) => r.data)
