/**
 * Async controller'lardaki hatalari otomatik olarak Express hata
 * middleware'ine iletir. Boylece her handler'da try/catch tekrar edilmez.
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
