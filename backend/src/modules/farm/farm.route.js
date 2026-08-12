import { Router } from 'express';
import * as controller from './farm.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { updateFarmSchema, updatePreferencesSchema } from './farm.validation.js';

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/settings', controller.getSettings);
router.patch('/settings', writers, validate({ body: updateFarmSchema }), controller.updateSettings);
router.patch(
  '/preferences',
  writers,
  validate({ body: updatePreferencesSchema }),
  controller.updatePreferences
);

export default router;
