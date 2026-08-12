import { Router } from 'express';
import * as controller from './finance.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants.js';
import { idParamSchema } from '../../common/validation/common.schemas.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  summaryQuerySchema,
  createAccountSchema,
} from './finance.validation.js';

const router = Router();
router.use(authenticate);

const writers = authorize(ROLES.ADMIN, ROLES.FARMER);

router.get('/summary', validate({ query: summaryQuerySchema }), controller.summary);
router.get('/ledger', validate({ query: summaryQuerySchema }), controller.ledger);

router.get('/accounts', controller.listAccounts);
router.post('/accounts', writers, validate({ body: createAccountSchema }), controller.createAccount);

router.get(
  '/transactions',
  validate({ query: listTransactionsQuerySchema }),
  controller.listTransactions
);
router.post(
  '/transactions',
  writers,
  validate({ body: createTransactionSchema }),
  controller.createTransaction
);
router.patch(
  '/transactions/:id',
  writers,
  validate({ params: idParamSchema, body: updateTransactionSchema }),
  controller.updateTransaction
);
router.delete(
  '/transactions/:id',
  writers,
  validate({ params: idParamSchema }),
  controller.removeTransaction
);

export default router;
