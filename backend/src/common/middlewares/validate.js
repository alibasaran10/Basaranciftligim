import { ApiError } from '../errors/ApiError.js';
import { deepClean } from '../security/sanitize.js';

/**
 * Zod semasi ile istek dogrulama middleware'i.
 * - body/query/params ayri ayri dogrulanir.
 * - Basarili olursa, dogrulanmis + tip donusturulmus deger req uzerine yazilir
 *   (whitelist: semada olmayan alanlar otomatik elenir -> mass-assignment korumasi).
 * - String degerler XSS'e karsi temizlenir.
 *
 * Kullanim:
 *   router.post('/', validate({ body: createAnimalSchema }), handler)
 */
export const validate = (schemas = {}) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        throw ApiError.badRequest('Dogrulama hatasi', details);
      }
      // Temizlenmis ve semaya gore filtrelenmis veriyi geri yaz.
      // query/params bazi Express surumlerinde salt-okunur olabilir; bu yuzden
      // req uzerinde ayri "valid*" alanlarina da koyariz.
      const cleaned = deepClean(result.data);
      if (key === 'body') req.body = cleaned;
      req[`valid${key[0].toUpperCase()}${key.slice(1)}`] = cleaned;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
