import { Router } from 'express';
import * as controller from './auth.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authLimiter } from '../../common/middlewares/rateLimiters.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.validation.js';

const router = Router();

// Hassas uclar siki rate limit altinda (kaba-kuvvete karsi).
router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', authLimiter, validate({ body: refreshSchema }), controller.refresh);

// Kimlik gerektiren uclar.
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  controller.changePassword
);

export default router;
