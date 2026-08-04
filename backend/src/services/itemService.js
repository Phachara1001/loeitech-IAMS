import * as itemRepository from '../repositories/itemRepository.js';

/**
 * Generate SKU อัตโนมัติ เช่น CS-0001, CS-0002
 */
const generateSku = async () => {
  const latest = await itemRepository.findLatestItem();
  if (latest && latest.sku) {
    // รูปแบบ CS-XXXX
    const parts = latest.sku.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      const nextNum = parseInt(parts[1], 10) + 1;
      return `${parts[0]}-${String(nextNum).padStart(4, '0')}`;
    }
  }
  return 'CS-0001';
};

/**
 * ดึงรายการวัสดุทั้งหมด
 */
export const getAllItems = async (filters) => {
  return await itemRepository.findAll(filters);
};

/**
 * ดึงวัสดุตาม ID
 */
export const getItemById = async (id) => {
  const item = await itemRepository.findById(id);
  if (!item) {
    const err = new Error('ไม่พบรายการวัสดุ');
    err.status = 404;
    throw err;
  }
  return item;
};

/**
 * สร้างวัสดุใหม่ (auto-generate SKU ถ้าไม่ส่งมา)
 */
export const createItem = async (data) => {
  const sku = data.sku || (await generateSku());
  return await itemRepository.create({
    sku,
    name: data.name,
    description: data.description || null,
    category: data.category || null,
    unit: data.unit || null,
    quantity: Number(data.quantity) || 0,
    minThreshold: Number(data.minThreshold) || 0,
    unitPrice: parseFloat(data.unitPrice) || 0
  });
};

/**
 * แก้ไขข้อมูลวัสดุ
 */
export const updateItem = async (id, data) => {
  await getItemById(id); // ตรวจสอบว่ามีอยู่ก่อน
  const updateData = { ...data };
  if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
  if (data.minThreshold !== undefined) updateData.minThreshold = Number(data.minThreshold);
  if (data.unitPrice !== undefined) updateData.unitPrice = parseFloat(data.unitPrice);
  return await itemRepository.update(id, updateData);
};

/**
 * ลบวัสดุ
 */
export const deleteItem = async (id) => {
  await getItemById(id); // ตรวจสอบว่ามีอยู่ก่อน
  return await itemRepository.remove(id);
};

/**
 * ดึงประวัติ Running Balance ของวัสดุ
 */
export const getItemTransactions = async (id) => {
  await getItemById(id); // ตรวจสอบว่ามีอยู่ก่อน
  return await itemRepository.findTransactionsByItemId(id);
};
