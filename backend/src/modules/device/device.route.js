import { Router } from 'express';
import Device from './device.model.js';
import * as deviceCtrl from './device.controller.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import { createDeviceSchema, updateDeviceSchema, assignSchema } from './device.validation.js';

const ctrl = createCrudController(Device, {
  searchFields: ['macAddress', 'label'],
  populate: ['assignedAnimal'],
  notFoundMessage: 'Cihaz bulunamadi',
});

const router = Router();
router.use(authenticate);

// Sabit yollar ":id" yakalayicisindan once.
router.get('/summary', deviceCtrl.summary);

router.get('/', ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.post('/', writers, validate({ body: createDeviceSchema }), ctrl.create);
router.patch('/:id', writers, validate({ params: idParamSchema, body: updateDeviceSchema }), ctrl.update);
router.delete('/:id', writers, validate({ params: idParamSchema }), ctrl.remove);

// Ozel islemler.
router.post(
  '/:id/assign',
  writers,
  validate({ params: idParamSchema, body: assignSchema }),
  deviceCtrl.assign
);
router.post(
  '/:id/rotate-key',
  writers,
  validate({ params: idParamSchema }),
  deviceCtrl.rotateApiKey
);

export default router;
