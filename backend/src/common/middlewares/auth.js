import { ApiError } from '../errors/ApiError.js';
import { verifyAccessToken } from '../security/tokens.js';
import { catchAsync } from '../http/catchAsync.js';
import User from '../../modules/user/user.model.js';

/**
 * Kullanici kimlik dogrulama: "Authorization: Bearer <token>" bekler.
 * Token gecerliyse ilgili kullaniciyi DB'den ceker (iptal/pasif kontrolu icin)
 * ve req.user'a yerlestirir.
 */
export const authenticate = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Erisim tokeni eksik');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Gecersiz veya suresi dolmus token');
  }

  // Token gecerli olsa da kullanici pasiflenmis/silinmis olabilir.
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Hesap bulunamadi veya pasif');
  }

  // Sifre degistiginde / cikis yapildiginda tum eski tokenlari gecersiz kilmak icin.
  if (typeof payload.tv === 'number' && payload.tv !== user.tokenVersion) {
    throw ApiError.unauthorized('Oturum sonlandirilmis, tekrar giris yapin');
  }

  req.user = user;
  req.auth = { userId: String(user._id), role: user.role, farmId: user.farm ? String(user.farm) : null };
  next();
});

export default authenticate;
