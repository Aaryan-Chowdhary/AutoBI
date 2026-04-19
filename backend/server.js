import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import oauthRoutes from './routes/oauth.js';
import dashboardsRoutes from './routes/dashboards.js';
import uploadRoutes from './routes/upload.js';
import datasetRoutes from './routes/datasets.js';
import paymentRoutes from './routes/payment.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Fix for Firebase Google Popup COOP issue
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoBI Backend is running' });
});

app.use('/api/auth', oauthRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/payment', paymentRoutes);
import aiRoutes from './routes/ai.routes.js';
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

