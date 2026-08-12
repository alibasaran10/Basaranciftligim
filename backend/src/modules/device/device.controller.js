import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { generateApiKey, hashToken } from '../../common/security/tokens.js';
import Device from './device.model.js';
import Animal from '../animal/animal.model.js';
import { env } from '../../config/env.js';
import { DEVICE_STATUS } from '../../common/constants.js';

/**
 * Cihazi bir hayvana atar (veya animalId=null ile atamayi kaldirir).
 * Bire-bir iliski iki tarafta da tutulur; eski baglar temizlenir.
 */
export const assign = catchAsync(async (req, res) => {
  const farm = req.auth.farmId;
  const { animalId } = req.body;

  const device = await Device.findOne({ _id: req.params.id, farm });
  if (!device) throw ApiError.notFound('Cihaz bulunamadi');

  // Atamayi kaldir.
  if (animalId === null) {
    if (device.assignedAnimal) {
      await Animal.updateOne({ _id: device.assignedAnimal, farm }, { $unset: { device: 1 } });
    }
    device.assignedAnimal = undefined;
    await device.save();
    return sendSuccess(res, { data: device, message: 'Atama kaldirildi' });
  }

  const animal = await Animal.findOne({ _id: animalId, farm });
  if (!animal) throw ApiError.notFound('Hayvan bulunamadi');

  // Hayvanin baska cihazi varsa onu serbest birak.
  if (animal.device && String(animal.device) !== String(device._id)) {
    await Device.updateOne({ _id: animal.device, farm }, { $unset: { assignedAnimal: 1 } });
  }
  // Bu cihaz baska hayvana atalıysa onu da temizle.
  if (device.assignedAnimal && String(device.assignedAnimal) !== String(animal._id)) {
    await Animal.updateOne({ _id: device.assignedAnimal, farm }, { $unset: { device: 1 } });
  }

  device.assignedAnimal = animal._id;
  animal.device = device._id;
  await Promise.all([device.save(), animal.save()]);

  return sendSuccess(res, { data: device, message: 'Cihaz hayvana atandi' });
});

/**
 * Cihaza yeni API anahtari uretir.
 * DUZ METIN anahtar YALNIZCA bir kez, bu yanitta doner; sonrasinda sadece
 * SHA-256 ozeti saklanir ve tekrar gosterilemez. Kullanici bunu cihaza yukler.
 */
export const rotateApiKey = catchAsync(async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, farm: req.auth.farmId });
  if (!device) throw ApiError.notFound('Cihaz bulunamadi');

  const apiKey = generateApiKey();
  device.apiKeyHash = hashToken(apiKey);
  await device.save();

  return sendSuccess(res, {
    message: 'Yeni API anahtari uretildi. Bu anahtar tekrar gosterilmeyecek.',
    data: { deviceId: String(device._id), macAddress: device.macAddress, apiKey },
  });
});


/**
 * GET /devices/summary
 * Cihaz & tasma ekraninin ozet kartlari, tasma listesi ve gateway durumu.
 * Cevrimdisi esigi: son 45 dk (15 dk yayin periyodu x3).
 */
export const summary = catchAsync(async (req, res) => {
  const farm = req.auth.farmId;
  if (!farm) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');

  const offlineThreshold = new Date(Date.now() - 45 * 60 * 1000);

  const [total, active, lowBattery, offline, devices, lastSeen] = await Promise.all([
    Device.countDocuments({ farm }),
    Device.countDocuments({ farm, status: DEVICE_STATUS.ACTIVE }),
    Device.countDocuments({ farm, batteryLevel: { $lte: env.LOW_BATTERY_THRESHOLD, $gt: 0 } }),
    Device.countDocuments({ farm, lastSeenAt: { $lt: offlineThreshold } }),
    Device.find({ farm })
      .sort({ batteryLevel: 1 })
      .limit(50)
      .populate('assignedAnimal', 'earTag breed birthDate')
      .lean(),
    Device.findOne({ farm }).sort({ lastSeenAt: -1 }).select('lastSeenAt').lean(),
  ]);

  const statusLabel = (device) => {
    if (!device.lastSeenAt || new Date(device.lastSeenAt) < offlineThreshold) return 'Çevrimdışı';
    if ((device.batteryLevel ?? 100) <= env.LOW_BATTERY_THRESHOLD) return 'Düşük Pil';
    return 'Aktif';
  };

  return sendSuccess(res, {
    data: {
      totals: { total, active, lowBattery, offline },
      devices: devices.map((d) => ({
        id: String(d._id),
        label: d.label ?? d.macAddress,
        macAddress: d.macAddress,
        firmwareVersion: d.firmwareVersion ?? null,
        batteryLevel: d.batteryLevel ?? 0,
        status: d.status,
        statusLabel: statusLabel(d),
        lastSeenAt: d.lastSeenAt ?? null,
        animal: d.assignedAnimal
          ? {
              id: String(d.assignedAnimal._id),
              earTag: d.assignedAnimal.earTag,
              breed: d.assignedAnimal.breed ?? '',
              birthDate: d.assignedAnimal.birthDate ?? null,
            }
          : null,
      })),
      // Gateway durumu cihaz akisindan turetilir: son 45 dk icinde en az bir
      // cihazdan veri geldiyse gateway "online" kabul edilir.
      gateway: {
        online: !!lastSeen?.lastSeenAt && new Date(lastSeen.lastSeenAt) >= offlineThreshold,
        lastSeenAt: lastSeen?.lastSeenAt ?? null,
        connectedDevices: total - offline,
        signalLabel: offline === 0 ? 'Güçlü' : offline < total / 4 ? 'Orta' : 'Zayıf',
      },
    },
  });
});

export default { summary, assign, rotateApiKey };
