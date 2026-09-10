import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import User from './user.model.js';
import { ROLES, USER_STATUS } from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Yönetici',
  [ROLES.FARMER]: 'İşletme Yöneticisi',
  [ROLES.VIEWER]: 'Görüntüleyici',
});

export const STATUS_LABELS = Object.freeze({
  [USER_STATUS.ACTIVE]: 'Aktif',
  [USER_STATUS.INVITED]: 'Planlandı',
  [USER_STATUS.DISABLED]: 'Pasif',
});

function present(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    // Serbest unvan varsa onu goster; yoksa role etiketine dus.
    roleLabel: user.jobTitle || ROLE_LABELS[user.role] || user.role,
    jobTitle: user.jobTitle ?? null,
    accessScope: user.accessScope || 'Tüm işletme',
    phone: user.phone ?? null,
    gender: user.gender ?? 'erkek',
    birthDate: user.birthDate ?? null,
    avatarUrl: user.avatarUrl ?? null,
    status: user.status ?? USER_STATUS.ACTIVE,
    statusLabel: STATUS_LABELS[user.status ?? USER_STATUS.ACTIVE],
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  };
}

/** GET /users — ekip listesi (yalnizca ayni ciftlik). */
export const list = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(present),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/** GET /users/summary — kullanicilar ekranindaki dort kart. */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, active, admins, invited, onlineToday, roleAgg] = await Promise.all([
    User.countDocuments({ farm }),
    User.countDocuments({ farm, status: USER_STATUS.ACTIVE }),
    User.countDocuments({ farm, role: ROLES.ADMIN }),
    User.countDocuments({ farm, status: USER_STATUS.INVITED }),
    User.countDocuments({ farm, lastLoginAt: { $gte: todayStart } }),
    User.aggregate([{ $match: { farm } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  return sendSuccess(res, {
    data: {
      totals: { total, active, admins, invited, onlineToday },
      roleDistribution: roleAgg.map((r) => ({
        role: r._id,
        name: ROLE_LABELS[r._id] ?? r._id,
        count: r.count,
      })),
    },
  });
});

/** POST /users — ekibe yeni uye ekler (ayni ciftlige bagli). */
export const create = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);

  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw ApiError.conflict('Bu e-posta zaten kayitli');

  const status = req.body.status ?? USER_STATUS.ACTIVE;
  const user = await User.create({
    ...req.body,
    farm,
    status,
    isActive: status === USER_STATUS.ACTIVE,
  });

  return sendCreated(res, { data: present(user.toObject()), message: 'Kullanici olusturuldu' });
});

/** PATCH /users/:id */
export const update = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const payload = { ...req.body };
  // Parola/e-posta bu uctan degistirilemez (ayri, dogrulanmis akislar).
  delete payload.password;
  delete payload.email;
  delete payload.farm;
  if (payload.status) payload.isActive = payload.status === USER_STATUS.ACTIVE;

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, farm },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!user) throw ApiError.notFound('Kullanici bulunamadi');

  return sendSuccess(res, { data: present(user), message: 'Guncellendi' });
});

/** DELETE /users/:id — ciftlik sahibi silinemez. */
export const remove = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  if (String(req.params.id) === String(req.auth.userId)) {
    throw ApiError.badRequest('Kendi hesabinizi silemezsiniz');
  }

  const user = await User.findOneAndDelete({ _id: req.params.id, farm });
  if (!user) throw ApiError.notFound('Kullanici bulunamadi');
  return sendSuccess(res, { message: 'Silindi' });
});

/** GET /users/me/profile — profil ekrani. */
export const profile = catchAsync(async (req, res) => {
  return sendSuccess(res, { data: present(req.user.toObject()) });
});

/** PATCH /users/me/profile */
export const updateProfile = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.auth.userId,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();
  if (!user) throw ApiError.notFound('Kullanici bulunamadi');
  return sendSuccess(res, { data: present(user), message: 'Profil guncellendi' });
});

export default { list, summary, create, update, remove, profile, updateProfile };
