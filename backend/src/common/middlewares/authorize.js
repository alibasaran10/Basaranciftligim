import { ApiError } from '../errors/ApiError.js';

/**
 * Rol tabanli yetkilendirme (RBAC).
 * authenticate'ten SONRA kullanilir.
 *
 * Kullanim: router.delete('/:id', authenticate, authorize(ROLES.ADMIN), handler)
 */
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('Bu islem icin yetkiniz yok'));
  }
  next();
};

export default authorize;
