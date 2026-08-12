import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import farmRoutes from '../modules/farm/farm.route.js';
import animalRoutes from '../modules/animal/animal.route.js';
import deviceRoutes from '../modules/device/device.route.js';
import zoneRoutes from '../modules/zone/zone.route.js';
import cameraRoutes from '../modules/camera/camera.route.js';
import fieldRoutes from '../modules/field/field.route.js';
import cropRecordRoutes from '../modules/crop/cropRecord.route.js';
import stockRoutes from '../modules/stock/stock.route.js';
import financeRoutes from '../modules/finance/finance.route.js';
import eventRoutes from '../modules/event/event.route.js';
import reportRoutes from '../modules/report/report.route.js';
import telemetryRoutes from '../modules/telemetry/telemetry.route.js';
import alertRoutes from '../modules/alert/alert.route.js';
import dashboardRoutes from '../modules/dashboard/dashboard.route.js';

const router = Router();

// Saglik kontrolu (load balancer / uptime izleme).
router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    data: {
      status: dbState === 1 ? 'ok' : 'degraded',
      db: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Modul route'lari.
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farm', farmRoutes);
router.use('/animals', animalRoutes);
router.use('/devices', deviceRoutes);
router.use('/zones', zoneRoutes);
router.use('/cameras', cameraRoutes);
router.use('/fields', fieldRoutes);
router.use('/crop-records', cropRecordRoutes);
router.use('/stock', stockRoutes);
router.use('/finance', financeRoutes);
router.use('/events', eventRoutes);
router.use('/reports', reportRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
