import api from './api.js'

// ==========================================
// Items (InventoryStock)
// ==========================================

/** ดึงรายการวัสดุทั้งหมด รองรับ search และ category filter */
export const getItems = (params = {}) =>
  api.get('/api/items', { params }).then((r) => r.data.data)

/** ดึงวัสดุรายการเดียวตาม ID */
export const getItemById = (id) =>
  api.get(`/api/items/${id}`).then((r) => r.data.data)

/** เพิ่มวัสดุใหม่ */
export const createItem = (data) =>
  api.post('/api/items', data).then((r) => r.data.data)

/** แก้ไขวัสดุ */
export const updateItem = (id, data) =>
  api.put(`/api/items/${id}`, data).then((r) => r.data.data)

/** ลบวัสดุ */
export const deleteItem = (id) =>
  api.delete(`/api/items/${id}`).then((r) => r.data)

/** ดูประวัติ Running Balance ของวัสดุรายชิ้น */
export const getItemTransactions = (id) =>
  api.get(`/api/items/${id}/transactions`).then((r) => r.data.data)

/** บันทึกผลตรวจนับ Inventory Check (ADJUSTMENT) */
export const adjustItemQty = (id, data) =>
  api.patch(`/api/items/${id}/adjust`, data).then((r) => r.data)

// ==========================================
// Stock Receive (InventoryReceive)
// ==========================================

/**
 * บันทึกรับพัสดุเข้าคลัง
 * @param {Object} data - { itemSourceType, selectedItemId, newItemName, newItemCategory, newItemUnit, qty, unitPrice, receivedDate, acquisitionMethod, budgetType, remark, operatorName }
 */
export const receiveStock = (data) =>
  api.post('/api/stock-receive', data).then((r) => r.data)

/** ดึงประวัติรับเข้าล่าสุด */
export const getRecentReceives = (limit = 10) =>
  api.get('/api/stock-receive', { params: { limit } }).then((r) => r.data.data)

// ==========================================
// Requisitions (NewRequisition)
// ==========================================

/**
 * ยื่นคำขอเบิกพัสดุ
 * @param {Object} data - { items: [{ id, qty }], reason }
 */
export const createRequisition = (data) =>
  api.post('/api/requisitions', data).then((r) => r.data)

/** ดึงรายการคำขอเบิกทั้งหมด */
export const getRequisitions = (params = {}) =>
  api.get('/api/requisitions', { params }).then((r) => r.data.data)

/** อนุมัติคำขอเบิก */
export const approveRequisition = (id, data) =>
  api.put(`/api/requisitions/${id}/approve`, data).then((r) => r.data)

/** ปฏิเสธคำขอเบิก */
export const rejectRequisition = (id, data) =>
  api.put(`/api/requisitions/${id}/reject`, data).then((r) => r.data)

// ==========================================
// Assets (Fixed Assets)
// ==========================================

/** ดึงข้อมูลครุภัณฑ์ทั้งหมด */
export const getAssets = () =>
  api.get('/api/assets').then((r) => r.data.data)

// ==========================================
// Borrows (Borrow & Return)
// ==========================================

/** ดึงรายการประวัติและคำขอยืมทั้งหมด */
export const getBorrows = () =>
  api.get('/api/borrows').then((r) => r.data.data)

/** ยื่นคำขอยืมพัสดุครุภัณฑ์ */
export const createBorrow = (data) =>
  api.post('/api/borrows', data).then((r) => r.data)

/** อนุมัติการยืมพัสดุ */
export const approveBorrow = (id, data) =>
  api.put(`/api/borrows/${id}/approve`, data).then((r) => r.data)

/** ปฏิเสธการยืมพัสดุ */
export const rejectBorrow = (id, data) =>
  api.put(`/api/borrows/${id}/reject`, data).then((r) => r.data)

/** บันทึกรับคืนพัสดุครุภัณฑ์ */
export const returnBorrow = (id, data) =>
  api.put(`/api/borrows/${id}/return`, data).then((r) => r.data)

// ==========================================
// Repairs (Maintenance & Repair)
// ==========================================

/** ดึงข้อมูลรายการซ่อมแซมและประวัติทั้งหมด */
export const getRepairs = () =>
  api.get('/api/repairs').then((r) => r.data.data)

/** ยื่นเรื่องแจ้งซ่อมครุภัณฑ์พัสดุ */
export const createRepair = (data) =>
  api.post('/api/repairs', data).then((r) => r.data)

/** อัปเดตสถานะการแจ้งซ่อม (อนุมัติ, กำลังซ่อม, ซ่อมสำเร็จ) */
export const updateRepairStatus = (id, data) =>
  api.put(`/api/repairs/${id}/status`, data).then((r) => r.data)

// ==========================================
// Asset Distributions
// ==========================================

/** ดึงข้อมูลรายการจัดสรรครุภัณฑ์ทั้งหมด */
export const getAssetDistributions = () =>
  api.get('/api/asset-distributions').then((r) => r.data.data)

/** จัดสรร / โยกย้ายครุภัณฑ์ใหม่ */
export const createAssetDistribution = (data) =>
  api.post('/api/asset-distributions', data).then((r) => r.data.data)

// ==========================================
// Asset Timeline
// ==========================================

/** ดึงประวัติไทม์ไลน์ความเคลื่อนไหวของครุภัณฑ์รายชิ้น */
export const getAssetTimeline = (id) =>
  api.get(`/api/assets/${id}/timeline`).then((r) => r.data.data)

// ==========================================
// Users List (for Selection)
// ==========================================

/** ดึงรายชื่อบุคลากรทั้งหมด */
export const getUsers = () =>
  api.get('/api/users').then((r) => r.data.data)



