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

  const today = new Date();

  const customTransactions = [
    {
      farm: farm._id,
      type: 'gelir',
      code: 'GEL-2026-0888',
      date: today,
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
      code: 'GEL-2026-0889',
      date: today,
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
      code: 'GEL-2026-0890',
      date: new Date(Date.now() - 86400000 * 2),
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
      code: 'GID-2026-0888',
      date: today,
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
      code: 'GID-2026-0889',
      date: today,
      description: '100 Torba Süt Yemi ve Kesif Yem Alımı',
      category: 'Yem',
      counterparty: 'Karaova Yem Sanayi',
      paymentMethod: 'banka_havalesi',
      amount: 340000,
      paidAmount: 340000,
      status: 'tamamlandi',
    },
    {
      farm: farm._id,
      type: 'gider',
      code: 'GID-2026-0890',
      date: new Date(Date.now() - 86400000 * 3),
      description: 'Sonbahar Periyodik Aşılama ve Sağlık Taraması',
      category: 'İlaç / Aşılama',
      counterparty: 'VetMed Kliniği',
      paymentMethod: 'nakit',
      amount: 45000,
      paidAmount: 45000,
      status: 'tamamlandi',
    },
  ];

  await FinanceTransaction.insertMany(customTransactions);
  console.log('Özel işlemler başarıyla veritabanına eklendi!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
