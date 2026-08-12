import { Router } from 'express';
import Zone from './zone.model.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import { createZoneSchema, updateZoneSchema } from './zone.validation.js';
import { invalidatePositioningCache } from '../telemetry/positioning.service.js';

const ctrl = createCrudController(Zone, {
  searchFields: ['name', 'description'],
  notFoundMessage: 'Bolge bulunamadi',
});

/**
 * Bolge tanimlari (routerMacs) degistiginde konumlandirma onbellegini temizle;
 * boylece motor guncel AP->bolge eslemesini kullanir.
 */
const invalidateAfterWrite = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) invalidatePositioningCache(req.auth?.farmId);
  });
  next();
};

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.post('/', writers, invalidateAfterWrite, validate({ body: createZoneSchema }), ctrl.create);
router.patch(
  '/:id',
  writers,
  invalidateAfterWrite,
  validate({ params: idParamSchema, body: updateZoneSchema }),
  ctrl.update
);
router.delete(
  '/:id',
  writers,
  invalidateAfterWrite,
  validate({ params: idParamSchema }),
  ctrl.remove
);

export default router;
