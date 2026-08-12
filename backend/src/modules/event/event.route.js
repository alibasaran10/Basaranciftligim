import { Router } from 'express';
import * as controller from './event.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  summaryQuerySchema,
} from './event.validation.js';

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/summary', validate({ query: summaryQuerySchema }), controller.summary);
router.get('/', validate({ query: listEventsQuerySchema }), controller.list);

router.post('/', writers, validate({ body: createEventSchema }), controller.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateEventSchema }),
  controller.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), controller.remove);

export default router;
