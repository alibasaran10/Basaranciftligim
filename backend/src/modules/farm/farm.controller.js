import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Farm from './farm.model.js';
import Animal from '../animal/animal.model.js';
import Field from '../field/field.model.js';
import Camera from '../camera/camera.model.js';
import Device from '../device/device.model.js';
import User from '../user/user.model.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

/** Kullanim / limit ciftini yuzde ile birlikte dondurur. */
function usage(used, limit) {
  return {
    used,
    limit,
    percent: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  };
}

/**
 * GET /farm/settings
 * Ayarlar ekrani: isletme bilgileri, abonelik kullanimi, tercih anahtarlari
 * ve guvenlik ozeti.
 */
export const getSettings = catchAsync(async (req, res) => {
  const farmId = farmObjectId(req);
  const farm = await Farm.findById(farmId).lean();
  if (!farm) throw ApiError.notFound('Ciftlik bulunamadi');

  const [animals, fields, cameras, devices, users] = await Promise.all([
    Animal.countDocuments({ farm: farmId, isActive: true }),
    Field.countDocuments({ farm: farmId, isActive: true }),
    Camera.countDocuments({ farm: farmId }),
    Device.countDocuments({ farm: farmId }),
    User.countDocuments({ farm: farmId }),
  ]);

  const limits = farm.subscription?.limits ?? {};
  const passwordChangedDaysAgo = farm.lastPasswordChangeAt
    ? Math.floor((Date.now() - new Date(farm.lastPasswordChangeAt).getTime()) / 86400000)
    : null;

  return sendSuccess(res, {
    data: {
      business: {
        id: String(farm._id),
        name: farm.name,
        businessType: farm.businessType ?? '',
        taxNumber: farm.taxNumber ?? '',
        phone: farm.phone ?? '',
        email: farm.email ?? '',
        address: farm.address ?? '',
        timezone: farm.timezone,
        logoUrl: farm.logoUrl ?? null,
        mapImageUrl: farm.mapImageUrl ?? null,
      },
      subscription: {
        plan: farm.subscription?.plan ?? 'PROFESYONEL',
        startedAt: farm.subscription?.startedAt ?? null,
        renewalAt: farm.subscription?.renewalAt ?? null,
        animals: usage(animals, limits.animals ?? 0),
        fields: usage(fields, limits.fields ?? 0),
        cameras: usage(cameras, limits.cameras ?? 0),
        users: usage(users, limits.users ?? 0),
        storage: usage(farm.subscription?.storageUsedGb ?? 0, limits.storageGb ?? 0),
        devices,
        annualPrice: farm.subscription?.annualPrice ?? 0,
        currency: farm.subscription?.currency ?? 'TRY',
        lastInvoiceAt: farm.subscription?.lastInvoiceAt ?? null,
        features: farm.subscription?.features ?? [],
      },
      preferences: farm.preferences ?? {},
      security: {
        twoFactorEnabled: !!farm.twoFactorEnabled,
        lastPasswordChangeAt: farm.lastPasswordChangeAt ?? null,
        passwordChangedDaysAgo,
      },
    },
  });
});

/** PATCH /farm/settings — isletme bilgilerini gunceller. */
export const updateSettings = catchAsync(async (req, res) => {
  const farmId = farmObjectId(req);
  const farm = await Farm.findByIdAndUpdate(
    farmId,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();
  if (!farm) throw ApiError.notFound('Ciftlik bulunamadi');

  return sendSuccess(res, {
    data: {
      name: farm.name,
      businessType: farm.businessType ?? '',
      taxNumber: farm.taxNumber ?? '',
      phone: farm.phone ?? '',
      email: farm.email ?? '',
      address: farm.address ?? '',
      timezone: farm.timezone,
    },
    message: 'Isletme bilgileri guncellendi',
  });
});

/** PATCH /farm/preferences — ayarlar ekranindaki anahtarlar. */
export const updatePreferences = catchAsync(async (req, res) => {
  const farmId = farmObjectId(req);
  // Nokta notasyonu ile yalnizca gonderilen anahtarlar guncellenir.
  const set = Object.fromEntries(
    Object.entries(req.body).map(([key, value]) => [`preferences.${key}`, value])
  );

  const farm = await Farm.findByIdAndUpdate(farmId, { $set: set }, { new: true }).lean();
  if (!farm) throw ApiError.notFound('Ciftlik bulunamadi');

  return sendSuccess(res, { data: farm.preferences, message: 'Tercihler guncellendi' });
});

export default { getSettings, updateSettings, updatePreferences };
