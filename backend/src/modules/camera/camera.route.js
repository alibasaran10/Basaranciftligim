import { Router } from 'express';
import Camera from './camera.model.js';
import Zone from '../zone/zone.model.js';
import * as cameraCtrl from './camera.controller.js';
import * as streamCtrl from './cameraStream.controller.js';
import { createCrudController } from '../../common/crud/crud.factory.js';
import { catchAsync } from '../../common/http/catchAsync.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createCameraSchema,
  updateCameraSchema,
  listCameraEventsQuerySchema,
} from './camera.validation.js';

const ctrl = createCrudController(Camera, {
  searchFields: ['name', 'ipAddress', 'group', 'location'],
  filterFields: ['group'],
  populate: ['zone'],
  notFoundMessage: 'Kamera bulunamadi',
});

/**
 * Body'de gelen "zone" gercekten kullanicinin ciftligine mi ait?
 * (Baska ciftligin bolgesine kamera baglamayi engeller.)
 */
const ensureZoneInFarm = catchAsync(async (req, _res, next) => {
  if (!req.body.zone) return next();
  const zone = await Zone.findOne({ _id: req.body.zone, farm: req.auth.farmId }).select('_id');
  if (!zone) throw ApiError.badRequest('Belirtilen bolge bu ciftlige ait degil');
  next();
});

const router = Router();

/**
 * --- Kimlik dogrulamasi ONCESI uclar ---
 * Tarayicidaki <img> ve mobildeki goruntu yukleyicisi Authorization basligi
 * gonderemedigi icin bu iki uc, `authenticate` yerine URL'deki kisa omurlu
 * akis jetonuyla korunur (bkz. tokens.js#signStreamToken). Jeton tek bir
 * kameraya kapsamlidir ve 2 dakikada suresi dolar.
 */
router.get('/:id/stream.mjpeg', validate({ params: idParamSchema }), streamCtrl.streamMjpeg);
router.get('/:id/snapshot.jpg', validate({ params: idParamSchema }), streamCtrl.snapshot);

router.use(authenticate);

// Sabit yollar ":id" yakalayicisindan once.
router.get('/overview', cameraCtrl.overview);
router.get('/events', validate({ query: listCameraEventsQuerySchema }), cameraCtrl.listEvents);

router.get('/', ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getById);

// Canli goruntuyu acmadan once alinan kisa omurlu jeton.
router.post('/:id/stream-token', validate({ params: idParamSchema }), streamCtrl.createStreamToken);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

/**
 * Saha ajani (Raspberry Pi) anahtari uretir. Anahtar duz haliyle yalnizca
 * yanitta bir kez gorunur; bu yuzden yalnizca yoneticiler cagirabilir.
 */
router.post(
  '/:id/stream-key',
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  streamCtrl.rotateStreamKey
);

router.post('/', writers, validate({ body: createCameraSchema }), ensureZoneInFarm, ctrl.create);
router.patch(
  '/:id',
  writers,
  validate({ params: idParamSchema, body: updateCameraSchema }),
  ensureZoneInFarm,
  ctrl.update
);
router.delete('/:id', writers, validate({ params: idParamSchema }), ctrl.remove);

export default router;
