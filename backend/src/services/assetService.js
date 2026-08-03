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
