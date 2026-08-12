import { Router } from 'express';
import * as controller from './report.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import { createReportSchema, listReportsQuerySchema } from './report.validation.js';

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/summary', controller.summary);
router.get('/', validate({ query: listReportsQuerySchema }), controller.list);
router.post('/', writers, validate({ body: createReportSchema }), controller.create);
router.post('/:id/download', validate({ params: idParamSchema }), controller.registerDownload);
router.delete('/:id', writers, validate({ params: idParamSchema }), controller.remove);

export default router;
