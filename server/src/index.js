import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import couponRoutes from './routes/coupons.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import inventoryRoutes from './routes/inventory.js';
import aiRoutes from './routes/ai.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Lỗi máy chủ' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`SalesFlow API chạy tại http://localhost:${port}`));
