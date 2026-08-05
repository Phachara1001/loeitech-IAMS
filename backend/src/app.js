import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import assetRoutes from './routes/assetRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import stockReceiveRoutes from './routes/stockReceiveRoutes.js';
import requisitionRoutes from './routes/requisitionRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import repairRoutes from './routes/repairRoutes.js';

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
app.use('/api/assets', assetRoutes);
app.use('/api/items', itemRoutes);               // InventoryStock
app.use('/api/stock-receive', stockReceiveRoutes); // InventoryReceive
app.use('/api/requisitions', requisitionRoutes);  // NewRequisition
app.use('/api/borrows', borrowRoutes);             // BorrowReturn
app.use('/api/repairs', repairRoutes);             // MaintenanceRepair

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
  });
});

export default app;
