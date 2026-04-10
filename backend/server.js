import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import oauthRoutes from './routes/oauth.js';
import dashboardsRoutes from './routes/dashboards.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoBI Backend is running' });
});

app.use('/api/auth', oauthRoutes);
app.use('/api/dashboards', dashboardsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

