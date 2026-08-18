import { z } from 'zod';
import {
  FINANCE_TYPE,
  FINANCE_STATUS,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
} from '../../common/constants.js';
import { objectId } from '../../common/validation/common.schemas.js';

const isoDate = z.string();

export const createTransactionSchema = z
  .object({
    type: z.nativeEnum(FINANCE_TYPE),
    code: z.string().trim().max(40).optional(),
    date: isoDate.optional(),
    description: z.string().trim().min(1).max(300),
    category: z.string().trim().min(1).max(120),
    counterparty: z.string().trim().max(160).optional(),
    paymentMethod: z.nativeEnum(PAYMENT_METHOD).optional(),
    account: objectId.optional(),
    amount: z.number().min(0).max(1e12),
    paidAmount: z.number().min(0).max(1e12).optional(),
    status: z.nativeEnum(FINANCE_STATUS).optional(),
    dueDate: isoDate.optional(),
    field: objectId.optional(),
    animal: objectId.optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateTransactionSchema = createTransactionSchema.partial().strict();

export const listTransactionsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    type: z.nativeEnum(FINANCE_TYPE).optional(),
    status: z.nativeEnum(FINANCE_STATUS).optional(),
    category: z.string().trim().max(120).optional(),
    days: z.coerce.number().int().min(1).max(3650).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    sortBy: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export const summaryQuerySchema = z
  .object({
    type: z.nativeEnum(FINANCE_TYPE).optional(),
    year: z.coerce.number().int().min(2000).max(2200).optional(),
  })
  .strict();

export const createAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.nativeEnum(ACCOUNT_TYPE),
    bankName: z.string().trim().max(120).optional(),
    iban: z.string().trim().max(34).optional(),
    balance: z.number().max(1e12).optional(),
  })
  .strict();

export default {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  summaryQuerySchema,
  createAccountSchema,
};
