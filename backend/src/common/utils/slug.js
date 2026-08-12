/**
 * Turkce karakterleri dogru cevirerek URL-guvenli slug uretir.
 * ("Kuzey Tarlası" -> "kuzey-tarlasi")
 *
 * Sema uzerindeki sanal alan yerine burasi tek kaynaktir: `.lean()` sorgularinda
 * sanal alanlar gelmedigi icin sunum katmani her zaman bu fonksiyonu kullanir.
 */
export function slugifyTr(value) {
  return String(value ?? '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default { slugifyTr };
