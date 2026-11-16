// Mağaza ürün kataloğu (PLAN). Fiyatlar burada değil, mağazalarda (Google Play
// Console / App Store Connect) belirlenir ve çalışma anında oradan okunur.
//
// type:
//   'non_consumable'  bir kez alınır, kalıcıdır (geri yüklenebilir)
//   'consumable'      tükenir, tekrar alınabilir
//   'subscription'    abonelik
//
// grants: satın alma sonrası verilecek haklar
//   { entitlement: 'id' }          kalıcı kilit açma
//   { inventory: { item: miktar } } tüketilebilir envanter

export const PRODUCTS = [
  {
    id: 'remove_ads',
    type: 'non_consumable',
    title: 'Reklamları Kaldır',
    grants: { entitlement: 'no_ads' },
    note: 'Zorunlu reklamları kaldırır. Ödüllü reklamlar isteğe bağlı kalır.'
  },
  {
    id: 'theme_neon',
    type: 'non_consumable',
    title: 'Neon Tema',
    grants: { entitlement: 'theme:neon' }
  },
  {
    id: 'theme_ocean',
    type: 'non_consumable',
    title: 'Okyanus Teması',
    grants: { entitlement: 'theme:ocean' }
  },
  {
    id: 'rotations_25',
    type: 'consumable',
    title: '25 Döndürme Hakkı',
    grants: { inventory: { rotations: 25 } }
  },
  {
    id: 'powerpack_small',
    type: 'consumable',
    title: 'Küçük Güç Paketi',
    grants: { inventory: { bomb: 3, lightning: 2, rainbow: 1 } }
  },
  {
    id: 'premium',
    type: 'non_consumable',
    title: 'Block Fusion Premium',
    grants: { entitlement: ['no_ads', 'theme:neon', 'theme:ocean', 'adventure:all'] }
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
