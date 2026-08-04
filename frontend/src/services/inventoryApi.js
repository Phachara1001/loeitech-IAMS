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
