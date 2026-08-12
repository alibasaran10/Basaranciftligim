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
  console.log('MongoDB Baglandi');

  const farm = await Farm.findOne({ name: 'Başaran Çiftliği' }) || await Farm.findOne();
  if (!farm) {
    console.error('Çiftlik bulunamadı');
    process.exit(1);
  }

  // Onceki Cirpici Mandacilik / Test verilerini temizle
  await FinanceTransaction.deleteMany({ farm: farm._id, code: { $in: ['GEL-2026-9999', 'GEL-2026-9998', 'GEL-2026-9997', 'GID-2026-9999', 'GID-2026-9998', 'GEL-2026-0888', 'GEL-2026-0889', 'GEL-2026-0890', 'GID-2026-0888', 'GID-2026-0889', 'GID-2026-0890'] } });

  // En yeni tarih (Tablonun en basinda görünmesi icin)
  const topDate = new Date('2026-09-01T12:00:00Z');
  const topDate2 = new Date('2026-08-31T10:00:00Z');
  const topDate3 = new Date('2026-08-30T09:00:00Z');

  const customTransactions = [
    {
      farm: farm._id,
      type: 'gelir',
      code: 'GEL-2026-9999',
      date: topDate,
      description: 'Çırpıcı Mandacılık Teşvik ve Destek Ödemesi',
      category: 'Devlet Teşviki / Hibe',
      counterparty: 'Çırpıcı Mandacılık',
      paymentMethod: 'banka_havalesi',
      amount: 2000000,
      paidAmount: 0,
      status: 'beklemede',
    },
    {
      farm: farm._id,
      type: 'gelir',
      code: 'GEL-2026-9998',
      date: topDate2,
      description: 'Günlük Süt Satış Bedeli',
      category: 'Süt Satışları',
      counterparty: 'Balıkesir Mandıra A.Ş.',
      paymentMethod: 'banka_havalesi',
      amount: 450000,
      paidAmount: 450000,
      status: 'tamamlandi',
    },
    {
      farm: farm._id,
      type: 'gelir',
      code: 'GEL-2026-9997',
      date: topDate3,
      description: '15 Adet Damızlık Gebe Düve Satışı',
      category: 'Hayvan Satışı',
      counterparty: 'Karesi Hayvancılık',
      paymentMethod: 'eft',
      amount: 750000,
      paidAmount: 750000,
      status: 'tamamlandi',
    },
    {
      farm: farm._id,
      type: 'gider',
      code: 'GID-2026-9999',
      date: topDate,
      description: 'Traktör ve Biçerdöver Mazot Alımı (5000 Lt)',
      category: 'Yakıt / Mazot',
      counterparty: 'Petrol Ofisi - Balıkesir',
      paymentMethod: 'kredi_karti',
      amount: 220000,
      paidAmount: 220000,
      status: 'tamamlandi',
    },
    {
      farm: farm._id,
      type: 'gider',
      code: 'GID-2026-9998',
      date: topDate2,
      description: '100 Torba Süt Yemi ve Kesif Yem Alımı',
      category: 'Yem',
      counterparty: 'Karaova Yem Sanayi',
      paymentMethod: 'banka_havalesi',
      amount: 340000,
      paidAmount: 340000,
      status: 'tamamlandi',
    },
  ];

  await FinanceTransaction.insertMany(customTransactions);
  console.log('Çırpıcı Mandacılık ve özel işlemler tablonun en tepesine yerleştirildi!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
