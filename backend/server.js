import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import oauthRoutes from './routes/oauth.js';
import dashboardsRoutes from './routes/dashboards.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoBI Backend is running' });
});

app.use('/api/auth', oauthRoutes);
app.use('/api/dashboards', dashboardsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

