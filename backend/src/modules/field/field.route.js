import { Router } from 'express';
import { z } from 'zod';
import Field from './field.model.js';
import * as fieldCtrl from './field.controller.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createFieldSchema,
  updateFieldSchema,
  addOperationSchema,
  listFieldsQuerySchema,
} from './field.validation.js';

const ctrl = createCrudController(Field, {
  searchFields: ['name', 'crop', 'code', 'soilType'],
  filterFields: ['crop'],
  sort: { name: 1 },
  notFoundMessage: 'Tarla bulunamadi',
});

const slugParamSchema = z
  .object({ slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/, 'Gecersiz slug') })
  .strict();

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

// Sabit yollar ":id" yakalayicisindan once gelmeli.
router.get('/summary', fieldCtrl.summary);
router.get('/view', validate({ query: listFieldsQuerySchema }), fieldCtrl.listView);
router.get('/by-slug/:slug', validate({ params: slugParamSchema }), fieldCtrl.getBySlug);

router.get('/', validate({ query: listFieldsQuerySchema }), ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);
router.get('/:id/detail', validate({ params: idParamSchema }), fieldCtrl.detail);
router.post('/', writers, validate({ body: createFieldSchema }), ctrl.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateFieldSchema }),
  ctrl.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), ctrl.remove);

// Islem/verim kayitlari.
router.get('/:id/operations', validate({ params: idParamSchema }), fieldCtrl.listOperations);
router.post(
  '/:id/operations',
  writers,
  validate({ params: idParamSchema, body: addOperationSchema }),
  fieldCtrl.addOperation
);

export default router;
