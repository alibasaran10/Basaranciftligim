/**
 * Grafik serisi yardimcilari.
 *
 * Mongo aggregate ciktilari seyrektir (veri olmayan ay hic donmez). Grafikler
 * ise 12 aylik / 24 saatlik TAM seri bekler. Buradaki fonksiyonlar seyrek
 * aggregate sonucunu sifirlarla doldurulmus tam seriye cevirir.
 */

export const MONTH_LABELS_TR = Object.freeze([
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
]);

export const DAY_LABELS_TR = Object.freeze([
  'Paz',
  'Pzt',
  'Sal',
  'Çar',
  'Per',
  'Cum',
  'Cmt',
]);

/**
 * `{ _id: { y, m }, ... }` seklindeki aggregate sonucunu takvim yilina gore
 * 12 elemanli tam seriye cevirir.
 *
 * @param {Array<{_id:{y:number,m:number}}>} rows
 * @param {number} [year] - varsayilan: icinde bulunulan yil
 * @param {string[]} [fields] - toplanacak sayisal alanlar
 */
export function monthlySeries(rows = [], year = new Date().getFullYear(), fields = ['total']) {
  const byMonth = new Map();
  for (const row of rows) {
    if (!row?._id || row._id.y !== year) continue;
    byMonth.set(row._id.m, row);
  }

  return MONTH_LABELS_TR.map((name, index) => {
    const row = byMonth.get(index + 1);
    const point = { name, month: index + 1 };
    for (const field of fields) point[field] = Number(row?.[field] ?? 0);
    return point;
  });
}

/**
 * Gunun 24 saatini 4'er saatlik dilimlere bolen seri (aktivite grafikleri).
 * Aggregate satirlari `{ _id: <saat 0-23>, ... }` bicimindedir.
 */
export function hourlySeries(rows = [], step = 4, fields = ['value']) {
  const byHour = new Map(rows.map((r) => [Number(r._id), r]));
  const points = [];

  for (let hour = 0; hour <= 24; hour += step) {
    const label = `${String(hour % 24).padStart(2, '0')}:00`;
    const point = { name: hour === 24 ? '24:00' : label, hour };
    for (const field of fields) {
      // Dilim icindeki saatlerin ortalamasi.
      let sum = 0;
      let count = 0;
      for (let h = hour; h < hour + step && h < 24; h += 1) {
        const row = byHour.get(h);
        if (row) {
          sum += Number(row[field] ?? 0);
          count += 1;
        }
      }
      point[field] = count ? Math.round(sum / count) : 0;
    }
    points.push(point);
  }

  return points;
}

/**
 * Yerel saat diliminde "YYYY-MM-DD" anahtari uretir.
 *
 * ONEMLI: toISOString() UTC'ye cevirir; UTC+3'te gece yarisi kayitlari bir
 * onceki gune duser ve seride bosluk olusur. Mongo tarafinda da $dateToString
 * ayni timezone ile cagrildigi icin iki taraf birebir eslesir.
 */
export function localDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Son N gunun tam serisini uretir. Aggregate satirlari
 * `{ _id: 'YYYY-MM-DD', ... }` bicimindedir.
 */
export function dailySeries(rows = [], days = 30, fields = ['total']) {
  const byDay = new Map(rows.map((r) => [String(r._id), r]));
  const points = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * 86400000);
    const key = localDayKey(date);
    const row = byDay.get(key);
    const point = {
      name: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      date: key,
    };
    for (const field of fields) point[field] = Number(row?.[field] ?? 0);
    points.push(point);
  }

  return points;
}

/**
 * Yuzde degisim hesabi (kartlardaki "%12,5 artis" metinleri icin).
 * Onceki deger 0 ise 0 doner (sonsuz/NaN uretmez).
 */
export function percentChange(current, previous) {
  const prev = Number(previous) || 0;
  const curr = Number(current) || 0;
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/** Toplam icindeki payi tam sayi yuzde olarak dondurur. */
export function share(value, total) {
  const t = Number(total) || 0;
  if (!t) return 0;
  return Math.round((Number(value) / t) * 1000) / 10;
}

export default {
  MONTH_LABELS_TR,
  DAY_LABELS_TR,
  localDayKey,
  monthlySeries,
  hourlySeries,
  dailySeries,
  percentChange,
  share,
};
