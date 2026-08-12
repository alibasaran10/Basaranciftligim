import { ApiError } from '../errors/ApiError.js';

/**
 * Tanimli hicbir route ile eslesmeyen istekler icin 404.
 */
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Kaynak bulunamadi: ${req.method} ${req.originalUrl}`));
};

export default notFound;
