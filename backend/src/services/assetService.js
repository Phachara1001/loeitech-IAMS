import * as assetRepository from '../repositories/assetRepository.js';
import { minioClient, bucketName } from '../config/minio.js';
import crypto from 'crypto';

export const getAllAssets = async () => {
  return await assetRepository.findAll();
};

export const getAssetById = async (id) => {
  const asset = await assetRepository.findById(id);
  if (!asset) {
    throw new Error('Asset not found');
  }
  return asset;
};

export const createAsset = async (data) => {
  // Logic: สร้างเลข sequence อัตโนมัติ ถ้าไม่ได้ส่งมา
  // เช่น 561-001, 561-002
  let seq = data.seq;
  if (!seq) {
    const latestAsset = await assetRepository.findLatestAsset();
    if (latestAsset && latestAsset.seq) {
      const parts = latestAsset.seq.split('-');
      if (parts.length === 2 && !isNaN(parts[1])) {
        const nextNum = parseInt(parts[1], 10) + 1;
        seq = `${parts[0]}-${String(nextNum).padStart(3, '0')}`;
      } else {
        seq = `561-${String(latestAsset.id + 1).padStart(3, '0')}`;
      }
    } else {
      seq = '561-001';
    }
  }

  const newAssetData = {
    ...data,
    seq,
    acquiredDate: new Date(data.acquiredDate),
    unitPrice: parseFloat(data.unitPrice)
  };

  // Strip 'qty' as it's not in the database schema
  if ('qty' in newAssetData) {
    delete newAssetData.qty;
  }

  return await assetRepository.create(newAssetData);
};

export const updateAsset = async (id, data) => {
  // เช็คก่อนว่ามีอยู่จริงไหม
  await getAssetById(id);

  const updatedData = { ...data };
  
  // Sanitize payload to avoid Prisma nested write errors
  const fieldsToRemove = [
    'id', 'createdAt', 'updatedAt', 'distributions', 'location', 
    'responsiblePerson', 'qty'
  ];
  fieldsToRemove.forEach(field => {
    if (field in updatedData) {
      delete updatedData[field];
    }
  });

  if (data.acquiredDate) {
    updatedData.acquiredDate = new Date(data.acquiredDate);
  }
  if (data.unitPrice) {
    updatedData.unitPrice = parseFloat(data.unitPrice);
  }

  return await assetRepository.update(id, updatedData);
};

export const deleteAsset = async (id) => {
  await getAssetById(id);
  return await assetRepository.remove(id);
};

export const uploadImageToMinio = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Generate unique filename
  const extension = file.originalname.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${extension}`;

  // Upload to MinIO
  await minioClient.putObject(
    bucketName,
    fileName,
    file.buffer,
    file.size,
    { 'Content-Type': file.mimetype }
  );

  // Return public URL (assuming port 9000 and standard path style)
  const port = process.env.MINIO_PORT || '9000';
  const host = process.env.MINIO_ENDPOINT === 'minio' ? 'localhost' : (process.env.MINIO_ENDPOINT || 'localhost');
  return `http://${host}:${port}/${bucketName}/${fileName}`;
};

export const getAssetTimeline = async (id) => {
  const data = await assetRepository.findTimelineData(id);
  if (!data.asset) {
    throw new Error('Asset not found');
  }

  const timeline = [];

  // 1. ตรวจรับครุภัณฑ์
  timeline.push({
    id: `rec-${data.asset.id}`,
    type: 'RECEIVE',
    title: 'ตรวจรับครุภัณฑ์เข้าสารสนเทศ',
    date: data.asset.createdAt,
    operator: 'งานพัสดุกลาง',
    details: `ตรวจรับครุภัณฑ์ใหม่ด้วยวิธี: ${data.asset.acquisitionMethod || '-'} / แหล่งเงิน: ${data.asset.budgetType || '-'} / ราคา: ${data.asset.unitPrice?.toLocaleString() || '0'} บาท`,
    location: data.asset.department || 'ไม่ระบุหน่วยงาน',
    responsiblePerson: data.asset.department || 'ไม่ระบุ',
    cost: 0
  });

  // 2. ประวัติการจัดสรรโยกย้าย
  data.distributions.forEach((d) => {
    timeline.push({
      id: `dist-${d.id}`,
      type: 'MOVE',
      title: `โอนย้ายสถานที่ / จัดสรร (${d.department})`,
      date: d.createdAt,
      operator: d.responsiblePerson?.name || 'ผู้ดูแลระบบ',
      details: d.note || 'จัดสรรลงหน่วยงานเพื่อเข้าประจำการการใช้งาน',
      location: `${d.building || ''} ${d.room || ''}`.trim() || 'ไม่ระบุสถานที่',
      responsiblePerson: d.responsiblePerson?.name || 'ไม่ระบุ',
      cost: 0
    });
  });

  // 3. ประวัติการแจ้งซ่อม
  data.repairs.forEach((r) => {
    timeline.push({
      id: `rep-${r.id}`,
      type: 'REPAIR',
      title: `ส่งซ่อมบำรุง (${r.repairCode})`,
      date: r.createdAt,
      operator: r.reporterName,
      details: `อาการชำรุด: ${r.description} (สถานะ: ${r.status === 'COMPLETED' ? 'ซ่อมสำเร็จ' : r.status === 'REPAIRING' ? 'กำลังดำเนินการซ่อม' : 'รอประเมิน'})`,
      location: 'ศูนย์ซ่อมบำรุงวิทยาลัย',
      responsiblePerson: r.approvedBy || 'ช่างซ่อมบำรุง',
      cost: r.repairCost || 0
    });
  });

  // 4. ประวัติการยืม-คืน
  data.borrows.forEach((b) => {
    timeline.push({
      id: `borrow-${b.id}`,
      type: 'BORROW',
      title: `ขอยืมใช้งาน (${b.borrowCode})`,
      date: b.createdAt,
      operator: b.borrowerName,
      details: `วัตถุประสงค์: ${b.purpose} (สถานะยืม: ${b.status})`,
      location: b.borrowerDept || 'ไม่ระบุหน่วยงาน',
      responsiblePerson: b.approvedBy || 'เจ้าหน้าที่พัสดุ',
      cost: 0
    });

    if (b.returnDate) {
      timeline.push({
        id: `return-${b.id}`,
        type: 'RETURN',
        title: `รับคืนครุภัณฑ์ (${b.borrowCode})`,
        date: b.updatedAt,
        operator: b.returnedTo || 'เจ้าหน้าที่พัสดุ',
        details: b.remark || 'ส่งคืนสภาพปกติเรียบร้อย',
        location: b.borrowerDept || 'ไม่ระบุหน่วยงาน',
        responsiblePerson: b.returnedTo || 'เจ้าหน้าที่พัสดุ',
        cost: 0
      });
    }
  });

  // เรียงลำดับจากล่าสุดไปหาเก่าสุด
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  // ส่ง assetStatus ปัจจุบันจาก DB กลับมาพร้อมกับ timeline เสมอ
  // เพื่อให้ frontend อัปเดตสถานะ asset ได้แบบ real-time
  return {
    assetStatus: data.asset.status,
    timeline
  };
};

