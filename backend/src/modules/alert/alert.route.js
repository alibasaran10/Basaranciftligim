import { Router } from 'express';
import * as controller from './alert.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import { listAlertsQuerySchema } from './alert.validation.js';

const router = Router();
router.use(authenticate);

// Sabit yollar ":id" yakalayicisindan once gelmeli.
router.get('/summary', controller.summary);
router.get('/', validate({ query: listAlertsQuerySchema }), controller.list);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);
router.post('/:id/acknowledge', writers, validate({ params: idParamSchema }), controller.acknowledge);
router.post('/:id/resolve', writers, validate({ params: idParamSchema }), controller.resolve);

export default router;
