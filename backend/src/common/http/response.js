/**
 * Tum endpoint'ler icin tek tip yanit zarfi.
 * Frontend her zaman ayni sekli bekler: { success, data, meta?, message? }
 */
export function sendSuccess(res, { data = null, meta = undefined, message = undefined, status = 200 } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendCreated(res, { data, message = 'Kayit olusturuldu' } = {}) {
  return sendSuccess(res, { data, message, status: 201 });
}

export default { sendSuccess, sendCreated };
