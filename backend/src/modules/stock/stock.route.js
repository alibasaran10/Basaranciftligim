import { Router } from 'express';
import * as controller from './stock.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createStockItemSchema,
  updateStockItemSchema,
  listStockQuerySchema,
  createMovementSchema,
  listMovementsQuerySchema,
} from './stock.validation.js';

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

// Sabit yollar ":id" yakalayicisindan once.
router.get('/summary', controller.summary);
router.get('/movements', validate({ query: listMovementsQuerySchema }), controller.listMovements);

router.get('/', validate({ query: listStockQuerySchema }), controller.list);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);

router.post('/', writers, validate({ body: createStockItemSchema }), controller.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateStockItemSchema }),
  controller.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), controller.remove);

router.post(
  '/:id/movements',
  writers,
  validate({ params: idParamSchema, body: createMovementSchema }),
  controller.addMovement
);

export default router;
