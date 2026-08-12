import { Router } from 'express';
import Animal from './animal.model.js';
import * as animalCtrl from './animal.controller.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createAnimalSchema,
  updateAnimalSchema,
  addHealthRecordSchema,
  addMilkRecordSchema,
  listAnimalsQuerySchema,
} from './animal.validation.js';

const ctrl = createCrudController(Animal, {
  searchFields: ['earTag', 'name', 'breed', 'barnSection'],
  populate: ['currentZone', 'device'],
  notFoundMessage: 'Hayvan bulunamadi',
  // Listeleme ekranindaki acilir filtreler dogrudan sorguya yansir.
  filterFields: ['status', 'lactationStage', 'breed', 'barnSection'],
});

const router = Router();

// Tum uclar kimlik gerektirir.
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

// Sabit yollar ":id" yakalayicisindan ONCE tanimlanmali.
router.get('/summary', animalCtrl.summary);
router.get('/view', validate({ query: listAnimalsQuerySchema }), animalCtrl.listView);

router.get('/', validate({ query: listAnimalsQuerySchema }), ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);
router.get('/:id/detail', validate({ params: idParamSchema }), animalCtrl.detail);

// Yazma islemleri viewer'a kapali.
router.post('/', writers, validate({ body: createAnimalSchema }), ctrl.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateAnimalSchema }),
  ctrl.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), ctrl.remove);

router.post(
  '/:id/health-records',
  writers,
  validate({ params: idParamSchema, body: addHealthRecordSchema }),
  animalCtrl.addHealthRecord
);
router.post(
  '/:id/milk-records',
  writers,
  validate({ params: idParamSchema, body: addMilkRecordSchema }),
  animalCtrl.addMilkRecord
);

export default router;
