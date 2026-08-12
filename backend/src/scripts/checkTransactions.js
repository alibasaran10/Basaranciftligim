import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Farm from '../modules/farm/farm.model.js';
import FinanceTransaction from '../modules/finance/financeTransaction.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-farm';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const farms = await Farm.find().lean();
  console.log('Farms in DB:', farms.map(f => ({ id: String(f._id), name: f.name })));

  for (const farm of farms) {
    const incomeCount = await FinanceTransaction.countDocuments({ farm: farm._id, type: 'gelir' });
    const expenseCount = await FinanceTransaction.countDocuments({ farm: farm._id, type: 'gider' });
    console.log(`Farm ${farm.name} (${farm._id}): Income=${incomeCount}, Expense=${expenseCount}`);

    const latest = await FinanceTransaction.find({ farm: farm._id, type: 'gelir' }).sort({ date: -1 }).limit(3).lean();
    console.log('Latest income for farm:', latest.map(l => ({ code: l.code, desc: l.description, amount: l.amount, date: l.date })));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
