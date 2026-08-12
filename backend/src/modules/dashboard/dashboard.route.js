import { Router } from 'express';
import * as controller from './dashboard.controller.js';
import { authenticate } from '../../common/middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.get('/summary', controller.summary);
router.get('/overview', controller.overview);
router.get('/activity', controller.activity);

export default router;
