import { Router } from 'express';
import * as controller from './user.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  listUsersQuerySchema,
} from './user.validation.js';

const router = Router();
router.use(authenticate);

// Kendi profili — herkes erisebilir.
router.get('/me/profile', controller.profile);
router.patch('/me/profile', validate({ body: updateProfileSchema }), controller.updateProfile);

// Ekip yonetimi yalnizca yoneticilere acik.
const admins = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/summary', admins, controller.summary);
router.get('/', admins, validate({ query: listUsersQuerySchema }), controller.list);
router.post('/', admins, validate({ body: createUserSchema }), controller.create);
router.patch(
  '/:id',
  admins,
  validate({ params: idParamSchema, body: updateUserSchema }),
  controller.update
);
router.delete('/:id', admins, validate({ params: idParamSchema }), controller.remove);

export default router;
