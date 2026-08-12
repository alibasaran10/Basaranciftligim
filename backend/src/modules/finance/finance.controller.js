import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import FinanceTransaction from './financeTransaction.model.js';
import Account from './account.model.js';
import Budget from './budget.model.js';
import {
  FINANCE_TYPE,
  FINANCE_STATUS,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
} from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';
import { monthlySeries, percentChange, share } from '../../common/utils/series.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const PAYMENT_METHOD_LABELS = Object.freeze({
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Banka Havalesi',
  [PAYMENT_METHOD.EFT]: 'EFT',
  [PAYMENT_METHOD.WIRE]: 'Havale',
  [PAYMENT_METHOD.CASH]: 'Nakit',
  [PAYMENT_METHOD.CREDIT_CARD]: 'Kredi Kartı',
  [PAYMENT_METHOD.CHECK]: 'Çek',
});

/** Durum etiketi gelir/gider baglamina gore degisir. */
function statusLabel(status, type) {
  const income = type === FINANCE_TYPE.INCOME;
  if (status === FINANCE_STATUS.COMPLETED) return income ? 'Tahsil Edildi' : 'Ödendi';
  if (status === FINANCE_STATUS.PARTIAL) return income ? 'Kısmi Tahsil' : 'Kısmi Ödendi';
  return 'Beklemede';
}

function present(tx) {
  return {
    id: String(tx._id),
    type: tx.type,
    code: tx.code ?? '—',
    date: tx.date,
    description: tx.description,
    category: tx.category,
    counterparty: tx.counterparty ?? '—',
    paymentMethod: tx.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? 'Diğer',
    amount: tx.amount,
    paidAmount: tx.paidAmount ?? 0,
    remaining: Math.max(0, Number(tx.amount) - Number(tx.paidAmount ?? 0)),
    status: tx.status,
    statusLabel: statusLabel(tx.status, tx.type),
    dueDate: tx.dueDate ?? null,
  };
}

/** GET /finance/transactions */
export const listTransactions = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  if (req.query.type) filter.type = String(req.query.type);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.category) filter.category = String(req.query.category).slice(0, 120);
  
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.date.$lte = new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999));
  } else if (req.query.days) {
    filter.date = { $gte: new Date(Date.now() - Number(req.query.days) * 86400000) };
  }

  if (req.query.minAmount || req.query.maxAmount) {
    filter.amount = {};
    if (req.query.minAmount) filter.amount.$gte = Number(req.query.minAmount);
    if (req.query.maxAmount) filter.amount.$lte = Number(req.query.maxAmount);
  }

  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { description: { $regex: safe, $options: 'i' } },
      { counterparty: { $regex: safe, $options: 'i' } },
      { code: { $regex: safe, $options: 'i' } },
    ];
  }

  let sort = { date: -1 };
  if (req.query.sortBy === 'amount_asc') sort = { amount: 1 };
  if (req.query.sortBy === 'amount_desc') sort = { amount: -1 };
  if (req.query.sortBy === 'date_asc') sort = { date: 1 };
  if (req.query.sortBy === 'date_desc') sort = { date: -1 };

  const [items, total] = await Promise.all([
    FinanceTransaction.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    FinanceTransaction.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(present),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/** POST /finance/transactions */
export const createTransaction = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const payload = { ...req.body, farm, recordedBy: req.auth.userId };

  // Belge no verilmemisse otomatik uret: GEL-2026-0001 / GID-2026-0001
  if (!payload.code) {
    const year = new Date(payload.date ?? Date.now()).getFullYear();
    const prefix = payload.type === FINANCE_TYPE.INCOME ? 'GEL' : 'GID';
    const count = await FinanceTransaction.countDocuments({ farm, type: payload.type });
    payload.code = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  const tx = await FinanceTransaction.create(payload);
  return sendCreated(res, { data: present(tx.toObject()) });
});

/** PATCH /finance/transactions/:id */
export const updateTransaction = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const payload = { ...req.body };
  delete payload.farm;

  const tx = await FinanceTransaction.findOneAndUpdate(
    { _id: req.params.id, farm },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!tx) throw ApiError.notFound('Islem bulunamadi');

  return sendSuccess(res, { data: present(tx), message: 'Guncellendi' });
});

/** DELETE /finance/transactions/:id */
export const removeTransaction = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const tx = await FinanceTransaction.findOneAndDelete({ _id: req.params.id, farm });
  if (!tx) throw ApiError.notFound('Islem bulunamadi');
  return sendSuccess(res, { message: 'Silindi' });
});

/** Belirli bir tur/yil icin toplamlari doner (yardimci). */
async function totalsFor(farm, type, from, to) {
  const match = { farm, type };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = from;
    if (to) match.date.$lt = to;
  }

  const rows = await FinanceTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        amount: { $sum: '$amount' },
        paid: { $sum: { $ifNull: ['$paidAmount', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);
  return rows[0] ?? { amount: 0, paid: 0, count: 0 };
}

/**
 * GET /finance/summary?year=
 * Finansal genel bakis: toplam gelir/gider/kar, aylik bar grafigi,
 * gider dagilimi, nakit durumu, son islemler, butce ve ozet kalemler.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const prevStart = new Date(year - 1, 0, 1);
  /**
   * Icinde bulunulan yil icin karsilastirma ADIL olmali: yil-basindan-bugune
   * (YTD) tutar, gecen yilin AYNI donemiyle kiyaslanir; tum yiliyla degil.
   */
  const prevEnd =
    year === now.getFullYear()
      ? new Date(year - 1, now.getMonth(), now.getDate() + 1)
      : yearStart;

  const [
    income,
    expense,
    prevIncome,
    prevExpense,
    monthlyAgg,
    expenseByCategory,
    accounts,
    recent,
    budgets,
    receivables,
    payables,
  ] = await Promise.all([
    totalsFor(farm, FINANCE_TYPE.INCOME, yearStart, yearEnd),
    totalsFor(farm, FINANCE_TYPE.EXPENSE, yearStart, yearEnd),
    totalsFor(farm, FINANCE_TYPE.INCOME, prevStart, prevEnd),
    totalsFor(farm, FINANCE_TYPE.EXPENSE, prevStart, prevEnd),
    FinanceTransaction.aggregate([
      { $match: { farm, date: { $gte: yearStart, $lt: yearEnd } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: { $cond: [{ $eq: ['$type', FINANCE_TYPE.INCOME] }, '$amount', 0] } },
          secondary: { $sum: { $cond: [{ $eq: ['$type', FINANCE_TYPE.EXPENSE] }, '$amount', 0] } },
        },
      },
    ]),
    FinanceTransaction.aggregate([
      { $match: { farm, type: FINANCE_TYPE.EXPENSE, date: { $gte: yearStart, $lt: yearEnd } } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $sort: { value: -1 } },
    ]),
    Account.find({ farm, isActive: true }).lean(),
    FinanceTransaction.find({ farm }).sort({ date: -1 }).limit(6).lean(),
    Budget.find({ farm, year }).lean(),
    // Alacaklar: tahsil edilmemis gelir bakiyesi.
    FinanceTransaction.aggregate([
      { $match: { farm, type: FINANCE_TYPE.INCOME, status: { $ne: FINANCE_STATUS.COMPLETED } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] } } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { farm, type: FINANCE_TYPE.EXPENSE, status: { $ne: FINANCE_STATUS.COMPLETED } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] } } } },
    ]),
  ]);

  const net = income.amount - expense.amount;
  const prevNet = prevIncome.amount - prevExpense.amount;

  // Butce gerceklesmeleri: kategori bazli gider toplamlari.
  const spentByCategory = new Map(expenseByCategory.map((c) => [c._id, c.value]));

  const cash = accounts
    .filter((a) => a.type === ACCOUNT_TYPE.CASH)
    .reduce((acc, a) => acc + Number(a.balance || 0), 0);
  const bank = accounts
    .filter((a) => a.type === ACCOUNT_TYPE.BANK)
    .reduce((acc, a) => acc + Number(a.balance || 0), 0);

  return sendSuccess(res, {
    data: {
      year,
      totals: {
        income: Math.round(income.amount),
        incomeChangePercent: percentChange(income.amount, prevIncome.amount),
        expense: Math.round(expense.amount),
        expenseChangePercent: percentChange(expense.amount, prevExpense.amount),
        net: Math.round(net),
        netChangePercent: percentChange(net, prevNet),
        marginPercent: income.amount ? Math.round((net / income.amount) * 1000) / 10 : 0,
        marginChangePercent: percentChange(
          income.amount ? net / income.amount : 0,
          prevIncome.amount ? prevNet / prevIncome.amount : 0
        ),
      },
      monthly: monthlySeries(monthlyAgg, year, ['total', 'secondary']).map((p) => ({
        name: p.name,
        value: Math.round(p.total),
        secondary: Math.round(p.secondary),
        profit: Math.round(p.total - p.secondary),
      })),
      expenseDistribution: expenseByCategory.map((c) => ({
        name: c._id,
        value: Math.round(c.value),
        percent: share(c.value, expense.amount),
      })),
      cash: {
        total: Math.round(cash + bank),
        cash: Math.round(cash),
        bank: Math.round(bank),
        accounts: accounts.map((a) => ({
          id: String(a._id),
          name: a.name,
          type: a.type,
          bankName: a.bankName ?? null,
          balance: Math.round(a.balance || 0),
        })),
      },
      recentTransactions: recent.map(present),
      budgets: budgets
        .map((b) => {
          const spent = spentByCategory.get(b.category) ?? 0;
          return {
            id: String(b._id),
            category: b.category,
            planned: Math.round(b.plannedAmount),
            spent: Math.round(spent),
            usagePercent: b.plannedAmount
              ? Math.min(100, Math.round((spent / b.plannedAmount) * 100))
              : 0,
          };
        })
        .sort((a, b) => b.usagePercent - a.usagePercent),
      balances: {
        receivables: Math.round(receivables[0]?.total ?? 0),
        payables: Math.round(payables[0]?.total ?? 0),
        netCashFlow: Math.round(income.paid - expense.paid),
        annualInvestment: Math.round(
          expenseByCategory
            .filter((c) => /yatırım|makine|ekipman/i.test(c._id))
            .reduce((acc, c) => acc + c.value, 0)
        ),
      },
    },
  });
});

/**
 * GET /finance/ledger?type=gelir|gider&year=
 * Gelirler / Giderler ekraninin tum bloklari (kartlar, trend, dagilim,
 * tahsilat orani, yaklasan tahsilat/odemeler, en cok kalemler).
 */
export const ledger = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const type = req.query.type === FINANCE_TYPE.EXPENSE ? FINANCE_TYPE.EXPENSE : FINANCE_TYPE.INCOME;
  const income = type === FINANCE_TYPE.INCOME;
  const year = Number(req.query.year) || new Date().getFullYear();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const prevYearStart = new Date(year - 1, 0, 1);
  // Icinde bulunulan yilda kiyas gecen yilin AYNI donemine yapilir (YTD).
  const prevYearEnd =
    year === now.getFullYear()
      ? new Date(year - 1, now.getMonth(), now.getDate() + 1)
      : yearStart;

  const [all, prevYear, thisMonth, prevMonth, monthlyAgg, byCategory, upcoming] = await Promise.all([
    totalsFor(farm, type, yearStart, yearEnd),
    totalsFor(farm, type, prevYearStart, prevYearEnd),
    totalsFor(farm, type, monthStart, null),
    totalsFor(farm, type, prevMonthStart, monthStart),
    FinanceTransaction.aggregate([
      { $match: { farm, type, date: { $gte: yearStart, $lt: yearEnd } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
    FinanceTransaction.aggregate([
      { $match: { farm, type, date: { $gte: yearStart, $lt: yearEnd } } },
      { $group: { _id: '$category', value: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    FinanceTransaction.find({
      farm,
      type,
      status: { $ne: FINANCE_STATUS.COMPLETED },
      dueDate: { $gte: now },
    })
      .sort({ dueDate: 1 })
      .limit(4)
      .lean(),
  ]);

  const pending = all.amount - all.paid;
  const topValue = byCategory[0]?.value ?? 0;

  return sendSuccess(res, {
    data: {
      type,
      year,
      totals: {
        total: Math.round(all.amount),
        totalChangePercent: percentChange(all.amount, prevYear.amount),
        month: Math.round(thisMonth.amount),
        monthChangePercent: percentChange(thisMonth.amount, prevMonth.amount),
        settled: Math.round(all.paid),
        settledPercent: share(all.paid, all.amount),
        pending: Math.round(pending),
        pendingPercent: share(pending, all.amount),
        averageTransaction: all.count ? Math.round(all.amount / all.count) : 0,
        transactionCount: all.count,
      },
      monthly: monthlySeries(monthlyAgg, year).map((p) => ({
        name: p.name,
        value: Math.round(p.total),
      })),
      categoryDistribution: byCategory.map((c) => ({
        name: c._id,
        value: Math.round(c.value),
        percent: share(c.value, all.amount),
      })),
      topCategories: byCategory.slice(0, 5).map((c) => ({
        name: c._id,
        value: Math.round(c.value),
        // En yuksek kaleme gore normalize edilmis oran (ilerleme cubuklari).
        percent: topValue ? Math.round((c.value / topValue) * 100) : 0,
      })),
      settlementPercent: share(all.paid, all.amount),
      upcoming: upcoming.map((tx) => ({
        id: String(tx._id),
        date: tx.dueDate,
        title: tx.description,
        amount: Math.round(Number(tx.amount) - Number(tx.paidAmount ?? 0)),
        label: income ? 'Tahsilat' : 'Ödeme',
      })),
    },
  });
});

/** GET /finance/accounts */
export const listAccounts = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const accounts = await Account.find({ farm, isActive: true }).sort({ type: 1, name: 1 }).lean();
  return sendSuccess(res, {
    data: accounts.map((a) => ({
      id: String(a._id),
      name: a.name,
      type: a.type,
      bankName: a.bankName ?? null,
      balance: Math.round(a.balance || 0),
      currency: a.currency,
    })),
  });
});

/** POST /finance/accounts */
export const createAccount = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const account = await Account.create({ ...req.body, farm });
  return sendCreated(res, { data: account.toJSON() });
});

export default {
  listTransactions,
  createTransaction,
  updateTransaction,
  removeTransaction,
  summary,
  ledger,
  listAccounts,
  createAccount,
};
