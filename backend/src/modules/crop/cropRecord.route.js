import { Router } from 'express';
import CropRecord from './cropRecord.model.js';
import * as cropCtrl from './cropRecord.controller.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createCropRecordSchema,
  updateCropRecordSchema,
  listCropRecordsQuerySchema,
  summaryQuerySchema,
} from './cropRecord.validation.js';

const ctrl = createCrudController(CropRecord, {
  searchFields: ['crop', 'variety', 'method'],
  filterFields: ['type', 'status', 'crop'],
  populate: [{ path: 'field', select: 'name code slug' }],
  sort: { date: -1 },
  notFoundMessage: 'Ekim/hasat kaydi bulunamadi',
});

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/summary', validate({ query: summaryQuerySchema }), cropCtrl.summary);
router.get('/view', validate({ query: listCropRecordsQuerySchema }), cropCtrl.listView);
router.get('/', validate({ query: listCropRecordsQuerySchema }), ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);
router.post('/', writers, validate({ body: createCropRecordSchema }), ctrl.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateCropRecordSchema }),
  ctrl.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), ctrl.remove);

export default router;
