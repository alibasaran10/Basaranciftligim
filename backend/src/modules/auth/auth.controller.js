import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import * as authService from './auth.service.js';

export const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  return sendCreated(res, { data: result, message: 'Kayit basarili' });
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, { data: result, message: 'Giris basarili' });
});

export const refresh = catchAsync(async (req, res) => {
  const tokens = await authService.refresh(req.body);
  return sendSuccess(res, { data: tokens });
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.auth.userId);
  return sendSuccess(res, { message: 'Cikis yapildi' });
});

export const me = catchAsync(async (req, res) => {
  return sendSuccess(res, { data: req.user.toJSON() });
});

export const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.auth.userId, req.body);
  return sendSuccess(res, { message: 'Parola guncellendi, tekrar giris yapin' });
});

export default { register, login, refresh, logout, me, changePassword };
