import User from '../user/user.model.js';
import Farm from '../farm/farm.model.js';
import { ApiError } from '../../common/errors/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/security/tokens.js';
import { ROLES } from '../../common/constants.js';
import { logger } from '../../config/logger.js';

/**
 * Kullaniciya ait access + refresh token uretir.
 * Payload minimal tutulur; hassas veri konmaz.
 */
function issueTokens(user) {
  const base = { sub: String(user._id), role: user.role, farm: user.farm ? String(user.farm) : null };
  return {
    accessToken: signAccessToken({ ...base, tv: user.tokenVersion ?? 0 }),
    refreshToken: signRefreshToken({ sub: base.sub, tv: user.tokenVersion ?? 0 }),
  };
}

/**
 * Kayit: yeni kullanici + kullaniciya ait yeni ciftlik olusturur.
 * Ilk kullanici ciftligin sahibi (FARMER) olur.
 */
export async function register({ name, email, password, farmName }) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Bu e-posta zaten kayitli');

  // 1) Kullaniciyi olustur (parola model pre-save hook'unda hash'lenir).
  const user = await User.create({ name, email, password, role: ROLES.FARMER });

  // 2) Ciftligi olustur, sahibi bu kullanici.
  const farm = await Farm.create({ name: farmName, owner: user._id });

  // 3) Kullaniciyi ciftlige bagla.
  user.farm = farm._id;
  await user.save();

  logger.info({ user: String(user._id), farm: String(farm._id) }, '[auth] yeni kayit');

  const tokens = issueTokens(user);
  return { user: user.toJSON(), farm: farm.toJSON(), ...tokens };
}

/**
 * Giris. Kullanici bulunamasa bile ayni generik hata doner (kullanici
 * numaralandirmasini/enumeration onlemek icin).
 */
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password +tokenVersion');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('E-posta veya parola hatali');
  }

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('E-posta veya parola hatali');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return { user: user.toJSON(), ...tokens };
}

/**
 * Refresh token ile yeni access token uretir.
 * tokenVersion eslesmezse (cikis/parola degisimi) reddedilir.
 */
export async function refresh({ refreshToken }) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Gecersiz refresh token');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive) throw ApiError.unauthorized('Hesap bulunamadi');
  if ((payload.tv ?? 0) !== user.tokenVersion) {
    throw ApiError.unauthorized('Oturum gecersiz, tekrar giris yapin');
  }

  return issueTokens(user);
}

/**
 * Global cikis: tokenVersion arttirilir -> mevcut tum access/refresh tokenlar
 * gecersiz olur. (Sunucu tarafinda token deposu tutmadan iptal saglar.)
 */
export async function logout(userId) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password +tokenVersion');
  if (!user) throw ApiError.notFound('Kullanici bulunamadi');

  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Mevcut parola hatali');

  user.password = newPassword; // pre-save hook hash'ler
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // eski oturumlari dusur
  await user.save();
}

export default { register, login, refresh, logout, changePassword };
