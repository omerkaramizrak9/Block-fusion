# Block Fusion – Gelir Modeli ve Altyapı Planı

## 1. Şu an çalışan: Döndürme hakkı + ödüllü reklam (simülasyon)

| Kural | Uygulama |
|---|---|
| Başlangıçta 5 ücretsiz hak | `CONFIG.rotation.startingRights` (her yeni oyunda yenilenir: `resetEachGame`) |
| Her 90° döndürme 1 hak | `CONFIG.rotation.costPerTurn`, `Game.rotatePiece()` |
| Kare / tek blok dönmez | Bu parçalar hak harcatmaz (`isRotationSymmetric`) |
| Hak bitince isteğe bağlı reklam teklifi | `ui/RotationUI.js` → "Reklam izle +5" / "Hayır, teşekkürler" |
| Reklam izlenmezse oyun devam eder | Teklif reddedilince sadece pencere kapanır |
| Son şans | Hiçbir parça sığmıyor ama döndürme kurtarabilir → reklam teklifi, reddedilirse oyun biter |
| Ödül yalnızca reklam tamamlanınca | `AdService` yalnızca sağlayıcı `'completed'` derse `rewarded: true` döner |
| Reklam yüklenemezse oyun bozulmaz | Hata/zaman aşımı yakalanır, mesaj gösterilir, oyun sürer |
| Haklar kaydedilir | Yarım oyun kaydında `rotations`, `adsWatched` |

### Test parametreleri (adres çubuğu)
- `?ads=fast` → test reklamı 1 sn sürer
- `?ads=fail` → reklam her zaman yüklenemez
- `?ads=slow` → yükleme zaman aşımına uğrar (8 sn)

## 2. Mimari

```
www/js/monetization/
  ads/
    AdService.js            Oyunun tek reklam kapısı (ödül garantisi, hata yönetimi)
    createAdProvider.js     Ayara göre sağlayıcı seçimi
    SimulatedAdProvider.js  Test reklamı (şu an aktif)
    AdMobProvider.js        Google AdMob iskeleti (sonraki aşama)
  store/
    catalog.js              Ürün listesi (reklam kaldırma, temalar, paketler, premium)
    StoreService.js         Satın alma + kalıcı haklar (Entitlements) iskeleti
```

Oyun kodu (core/) reklamdan habersizdir. Yalnızca `game.addRotations(n, kaynak)`
çağrılır; kaynak reklam, satın alma, günlük ödül vb. olabilir.

## 3. Sonraki aşama: Gerçek ödüllü reklam (AdMob)

1. AdMob hesabı → Android ve iOS uygulaması + "Rewarded" reklam birimleri
2. `npm i @capacitor-community/admob && npx cap sync`
3. Android `AndroidManifest.xml`: `com.google.android.gms.ads.APPLICATION_ID`
4. iOS `Info.plist`: `GADApplicationIdentifier`, `SKAdNetworkItems`,
   `NSUserTrackingUsageDescription`
5. İzinler: Avrupa için **UMP (GDPR) izin formu**, iOS için **App Tracking Transparency**
6. `config.js` → `ads.provider: 'admob'`; `AdMobProvider.js`'teki olay adlarını eklenti
   sürümüne göre doğrula
7. Geliştirmede **yalnızca Google test reklam kimlikleri** (dosyada hazır). Kendi gerçek
   reklamına tıklamak AdMob hesabının kapatılmasına yol açabilir.
8. Mümkünse ödül doğrulaması: AdMob Server-Side Verification (SSV)
9. Mağaza beyanları: Google Play "Ads" beyanı + Data Safety; App Store "Privacy Nutrition Label"

## 4. Mağaza (uygulama içi satın alma) planı

| Ürün | Tür | Etki |
|---|---|---|
| `remove_ads` | kalıcı | Zorunlu reklamları kaldırır (ödüllü reklamlar isteğe bağlı kalır) |
| `theme_neon`, `theme_ocean` | kalıcı | Özel temalar |
| `rotations_25` | tüketilebilir | 25 döndürme hakkı |
| `powerpack_small` | tüketilebilir | Bomba / Yıldırım / Gökkuşağı |
| `premium` | kalıcı | Reklamsız + tüm temalar + Macera bölümleri |

Uygulama önerisi: **RevenueCat** (Capacitor eklentisi; Google Play Billing + StoreKit'i
tek API'de birleştirir, makbuz doğrulamasını yapar, belirli gelire kadar ücretsiz) veya
`cordova-plugin-purchase`.

Zorunlu kurallar:
- Dijital içerik **yalnızca** Google Play Billing / Apple IAP ile satılabilir
- Kalıcı ürünler için **"Satın alımları geri yükle"** butonu (Apple şartı)
- Hak, mağaza onayından **sonra** verilir; tüketilebilir ürünler "consume/finish" edilir
- Fiyatlar koda yazılmaz, mağazadan yerel para birimiyle okunur

## 5. Açık kararlar (sizin belirlemeniz gerekenler)
- Döndürme hakları her oyunda mı yenilensin, yoksa oyuncunun kalıcı cüzdanı mı olsun?
  (Şu an: her oyunda 5'ten başlar. Kalıcı cüzdan için hakların oyun kaydından ayrı saklanması gerekir; küçük bir ek iş.)
- Oyun başına reklam sınırı (`rewards.maxAdsPerGame`, şu an sınırsız)
- Zorunlu (geçiş) reklam olacak mı? Olacaksa `remove_ads` ürünü anlamlı hale gelir.
