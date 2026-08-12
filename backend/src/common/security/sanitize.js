import xss from 'xss';

/**
 * XSS temizligi. Kullanicidan gelen serbest metin alanlarini (ad, aciklama,
 * not vb.) depolamadan once temizler. Boylece stored-XSS engellenir.
 *
 * Not: Bu, cikti kodlamasinin YERINE gecmez; frontend yine de degeri
 * kodlamalidir. Katmanli savunma (defense-in-depth) prensibi.
 */
const xssOptions = {
  whiteList: {}, // hicbir HTML etiketine izin verme (duz metin)
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

export function cleanString(value) {
  if (typeof value !== 'string') return value;
  return xss(value.trim(), xssOptions);
}

/**
 * Nesne/dizi icindeki tum string degerleri ozyinelemeli temizler.
 * Anahtarlarda "$" ve "." ile baslayan/nokta iceren operator enjeksiyonu
 * (NoSQL injection) express-mongo-sanitize ile ayrica engellenir; burada
 * deger temizligi yapilir.
 */
export function deepClean(input, depth = 0) {
  if (depth > 8) return input; // asiri derin/yinelemeli yapilarda dur
  if (Array.isArray(input)) return input.map((v) => deepClean(v, depth + 1));
  if (input && typeof input === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(input)) {
      out[key] = deepClean(val, depth + 1);
    }
    return out;
  }
  return cleanString(input);
}

export default { cleanString, deepClean };
