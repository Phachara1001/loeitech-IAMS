import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import stockReceiveRoutes from './routes/stockReceiveRoutes.js';
import requisitionRoutes from './routes/requisitionRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import assetDistributionRoutes from './routes/assetDistributionRoutes.js';
import disposalRoutes from './routes/disposalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);              // Login, Register, Forgot/Reset Password
app.use('/api/users', userRoutes);             // โปรไฟล์ผู้ใช้งานปัจจุบัน + Admin จัดการผู้ใช้งาน
app.use('/api/departments', departmentRoutes); // หน่วยงาน/ฝ่าย
app.use('/api/locations', locationRoutes);     // อาคารและห้อง
app.use('/api/dashboard', dashboardRoutes);    // ภาพรวมระบบ (Dashboard)
app.use('/api/activity-logs', activityLogRoutes); // ประวัติการใช้งานระบบ (Admin เท่านั้น)
app.use('/api/assets', assetRoutes);
app.use('/api/items', itemRoutes);               // InventoryStock
app.use('/api/stock-receive', stockReceiveRoutes); // InventoryReceive
app.use('/api/requisitions', requisitionRoutes);  // NewRequisition
app.use('/api/borrows', borrowRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/asset-distributions', assetDistributionRoutes);
app.use('/api/disposal-requests', disposalRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware (triggers reload)
app.use((err, req, res, next) => {
  console.error(err.stack);

  let status = err.status || 500;
  let message = err.message || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    status = 409; // Conflict
    let target = 'ข้อมูล';
    if (err.meta && err.meta.target) {
      if (err.meta.target.includes('seq')) target = 'รหัสครุภัณฑ์';
      else if (err.meta.target.includes('email')) target = 'อีเมล';
      else if (err.meta.target.includes('username')) target = 'ชื่อผู้ใช้';
      else if (err.meta.target.includes('sku')) target = 'รหัสวัสดุ';
      else target = err.meta.target.join(', ');
    }
    message = `${target}นี้มีในระบบแล้ว กรุณาตรวจสอบและไม่ใช้ข้อมูลซ้ำ`;
  }

  res.status(status).json({
    status: 'error',
    message: message
  });
});

export default app;