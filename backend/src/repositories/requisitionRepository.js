import prisma from '../prisma/index.js';

/**
 * สร้างคำขอเบิกพัสดุ พร้อม RequisitionItems
 */
export const create = async ({ reqCode, requesterId, reason, items }) => {
  return await prisma.requisition.create({
    data: {
      reqCode,
      requesterId: requesterId || null,
      reason,
      status: 'PENDING',
      items: {
        create: items.map((item) => ({
          itemId: Number(item.id),
          requestedQty: Number(item.qty)
        }))
      }
    },
    include: {
      items: {
        include: { item: { select: { id: true, sku: true, name: true, unit: true, quantity: true } } }
      }
    }
  });
};

/**
 * ดึงรายการคำขอเบิกทั้งหมด
 */
export const findAll = async ({ status = '' } = {}) => {
  const reqs = await prisma.requisition.findMany({
    where: status ? { status } : {},
    include: {
      items: {
        include: { item: { select: { id: true, sku: true, name: true, unit: true } } }
      },
      requester: { include: { department: true } },
      approver: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return reqs.map(req => {
    if (req.requester) {
      req.requesterName = req.requester.name || req.requester.username;
      req.requesterPosition = req.requester.position;
      req.department = req.requester.department?.name;
    }
    return req;
  });
};

/**
 * ดึงคำขอเบิกตาม ID
 */
export const findById = async (id) => {
  const req = await prisma.requisition.findUnique({
    where: { id: Number(id) },
    include: {
      items: {
        include: { item: { select: { id: true, sku: true, name: true, unit: true, quantity: true } } }
      },
      requester: { include: { department: true } },
      approver: true
    }
  });

  if (req && req.requester) {
    req.requesterName = req.requester.name || req.requester.username;
    req.requesterPosition = req.requester.position;
    req.department = req.requester.department?.name;
  }
  return req;
};

/**
 * อนุมัติคำขอเบิก — อัปเดต status และตัด stock OUT (ใช้ Prisma $transaction)
 */
export const approve = async (id, { approvedBy, approverId, approvedQtyMap = {}, remark = '' }) => {
  return await prisma.$transaction(async (tx) => {
    const requisition = await tx.requisition.findUnique({
      where: { id: Number(id) },
      include: { 
        items: { include: { item: true } },
        requester: true
      }
    });

    if (!requisition) throw Object.assign(new Error('ไม่พบคำขอเบิก'), { status: 404 });
    if (requisition.status !== 'PENDING') {
      throw Object.assign(new Error(`คำขอนี้ถูก${requisition.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว`), { status: 400 });
    }

    // ตัด stock และสร้าง StockTransaction สำหรับแต่ละรายการ
    for (const ri of requisition.items) {
      const approvedQty = approvedQtyMap[ri.id] !== undefined
        ? Number(approvedQtyMap[ri.id])
        : ri.requestedQty;

      if (approvedQty <= 0) continue;

      // ตรวจสอบ stock ว่าเพียงพอ
      if (ri.item.quantity < approvedQty) {
        throw Object.assign(
          new Error(`วัสดุ "${ri.item.name}" มีไม่เพียงพอ (มีอยู่ ${ri.item.quantity} ${ri.item.unit})`),
          { status: 400 }
        );
      }

      // ตัด stock
      await tx.item.update({
        where: { id: ri.itemId },
        data: { quantity: { decrement: approvedQty } }
      });

      // ชื่อผู้เบิก
      const requesterName = requisition.requester ? (requisition.requester.name || requisition.requester.username) : 'ระบบ';

      // บันทึก transaction OUT
      const stockTx = await tx.stockTransaction.create({
        data: {
          itemId: ri.itemId,
          transactionType: 'OUT',
          quantity: approvedQty,
          reference: requisition.reqCode,
          remarks: `อนุมัติจาก ${approvedBy || 'ผู้อนุมัติ'}`,
          operatorName: requesterName,
          receivedDate: new Date()
        }
      });

      // อัปเดต RequisitionItem
      await tx.requisitionItem.update({
        where: { id: ri.id },
        data: { approvedQty, stockTxId: stockTx.id }
      });
    }

    // อัปเดต Requisition status
    return await tx.requisition.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        approvedBy: approvedBy || null,
        approverId: approverId || null,
        approvedAt: new Date(),
        remark: remark || null
      }
    });
  });
};

/**
 * ปฏิเสธคำขอเบิก
 */
export const reject = async (id, { approvedBy, approverId, remark = '' }) => {
  const requisition = await prisma.requisition.findUnique({ where: { id: Number(id) } });
  if (!requisition) throw Object.assign(new Error('ไม่พบคำขอเบิก'), { status: 404 });
  if (requisition.status !== 'PENDING') {
    throw Object.assign(new Error(`คำขอนี้ไม่อยู่ในสถานะรอการอนุมัติ`), { status: 400 });
  }

  return await prisma.requisition.update({
    where: { id: Number(id) },
    data: {
      status: 'REJECTED',
      approvedBy: approvedBy || null,
      approverId: approverId || null,
      approvedAt: new Date(),
      remark: remark || null
    }
  });
};

/**
 * นับคำขอเบิกทั้งหมด (สำหรับ generate เลขที่)
 */
export const count = async () => {
  return await prisma.requisition.count();
};