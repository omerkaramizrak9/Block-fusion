// Mağaza ürün kataloğu (PLAN – henüz satışta değil, arayüze bağlı değil).
// Fiyatlar burada değil, mağazalarda (Google Play Console / App Store Connect)
// belirlenir ve çalışma anında oradan okunur.
//
// Karar: Başlangıç sürümünde "reklam kaldırma" ürünü YOK (zorunlu reklam da yok).
// Satış odağı: kozmetik içerik (temalar, kozmetik paketler).
//
// type:
//   'non_consumable'  bir kez alınır, kalıcıdır (geri yüklenebilir)
//   'consumable'      tükenir, tekrar alınabilir
//
// grants:
//   { entitlement: 'id' | ['id', ...] }   kalıcı kilit açma
//     'theme:<temaId>'      → www/js/theme/themes.js içindeki tema
//     'cosmetic:<id>'       → gelecekteki kozmetikler (blok stili, efekt paketi)

export const PRODUCTS = [
  // --- Tekil temalar (themes.js'te unlock: { type: 'product', productId } olanlar)
  {
    id: 'theme_neon',
    type: 'non_consumable',
    title: 'Neon Gece Teması',
    grants: { entitlement: 'theme:neon' }
  },
  {
    id: 'theme_sakura',
    type: 'non_consumable',
    title: 'Sakura Teması',
    grants: { entitlement: 'theme:sakura' }
  },
  // --- Kozmetik paketler (birden fazla öğe)
  {
    id: 'pack_cosmetic_1',
    type: 'non_consumable',
    title: 'Kozmetik Paket 1',
    grants: { entitlement: ['theme:neon', 'theme:sakura', 'cosmetic:blockstyle_gem'] },
    note: 'Paket içeriği yayından önce netleştirilecek.'
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
