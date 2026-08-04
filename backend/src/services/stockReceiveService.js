import * as stockReceiveRepository from '../repositories/stockReceiveRepository.js';
import * as itemRepository from '../repositories/itemRepository.js';

/**
 * บันทึกการรับพัสดุเข้าคลัง
 * @param {Object} data - ข้อมูลจาก frontend
 * @param {string} data.itemSourceType - 'EXISTING' | 'NEW'
 * @param {string} [data.selectedItemId] - ID ของวัสดุเดิม (กรณี EXISTING)
 * @param {string} [data.newItemName] - ชื่อวัสดุใหม่ (กรณี NEW)
 * @param {string} [data.newItemCategory]
 * @param {string} [data.newItemUnit]
 * @param {number} data.qty - จำนวนที่รับเข้า
 * @param {number} data.unitPrice - ราคาต่อหน่วย
 * @param {string} data.receivedDate - วันที่รับตามเอกสาร
 * @param {string} data.acquisitionMethod - วิธีการได้มา
 * @param {string} data.budgetType - ประเภทเงิน
 * @param {string} [data.remark] - หมายเหตุ / เลขที่ใบสั่งซื้อ
 * @param {string} [data.operatorName] - ชื่อผู้บันทึก
 */
export const receiveStock = async (data) => {
  const {
    itemSourceType,
    selectedItemId,
    newItemName,
    newItemCategory,
    newItemUnit,
    qty,
    unitPrice,
    receivedDate,
    acquisitionMethod,
    budgetType,
    remark,
    operatorName
  } = data;

  const quantity = Number(qty);
  const price = parseFloat(unitPrice) || 0;
  const totalPrice = quantity * price;

  if (itemSourceType === 'EXISTING') {
    // ตรวจสอบว่า item มีอยู่จริง
    const item = await itemRepository.findById(selectedItemId);
    if (!item) {
      const err = new Error('ไม่พบรายการวัสดุที่เลือก');
      err.status = 404;
      throw err;
    }

    const result = await stockReceiveRepository.createReceiveTransaction({
      itemId: item.id,
      quantity,
      unitPrice: price,
      totalPrice,
      receivedDate,
      acquisitionMethod,
      budgetType,
      operatorName: operatorName || null,
      reference: remark || null,
      remarks: remark || null
    });

    return {
      item: result.updatedItem,
      transaction: result.stockTx,
      isNew: false
    };
  } else {
    // วัสดุใหม่ — generate SKU ใหม่
    const sku = await stockReceiveRepository.generateNextSku();

    const result = await stockReceiveRepository.createNewItemAndReceive({
      sku,
      name: newItemName.trim(),
      category: newItemCategory || null,
      unit: newItemUnit || null,
      minStock: 5,
      quantity,
      unitPrice: price,
      totalPrice,
      receivedDate,
      acquisitionMethod,
      budgetType,
      operatorName: operatorName || null,
      reference: remark || null,
      remarks: remark || null
    });

    return {
      item: result.newItem,
      transaction: result.stockTx,
      isNew: true
    };
  }
};

/**
 * ดึงประวัติรับเข้าล่าสุด
 */
export const getRecentReceives = async (limit = 10) => {
  return await stockReceiveRepository.findRecentReceives(limit);
};
