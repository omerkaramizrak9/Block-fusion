# MAJOR BLOCK – Gelir Modeli ve Altyapı Planı

## 1. Şu an çalışan: Döndürme hakkı + ödüllü reklam (simülasyon)

| Kural | Uygulama |
|---|---|
| Her yeni oyunda 5 ücretsiz hak | `CONFIG.rotation.startingRights`, `resetEachGame: true` |
| Oyun başına en fazla 3 ödüllü reklam, her biri +5 hak | `CONFIG.rewards.maxAdsPerGame = 3`, `rotationAdAmount = 5` |
| Zorunlu reklam yok | Yalnızca oyuncunun seçtiği ödüllü reklam |
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

## 4. Mağaza (uygulama içi satın alma) planı — yalnızca kozmetik

Karar: Başlangıç sürümünde **reklam kaldırma ürünü yok** (zorunlu reklam da yok).
Satış odağı özel temalar ve kozmetik paketler.

| Ürün | Tür | Etki |
|---|---|---|
| `theme_neon` | kalıcı | Neon Gece teması |
| `theme_sakura` | kalıcı | Sakura teması |
| `pack_cosmetic_1` | kalıcı | Tema(lar) + gelecekteki kozmetikler (ör. blok stili) |

Nasıl bağlı:
- Temalar `www/js/theme/themes.js` içinde; mağaza teması `unlock: { type: 'product', productId }`
- Satın alma → `Entitlements.grant('theme:<id>')` → tema Ayarlar'da otomatik açılır
- Yeni kozmetik türü (blok stili, efekt paketi): `cosmetic:<id>` hakkı + ilgili görsel kod

Uygulama önerisi: **RevenueCat** (Capacitor eklentisi; Google Play Billing + StoreKit tek
API, makbuz doğrulaması) veya `cordova-plugin-purchase`.

Zorunlu kurallar:
- Dijital içerik **yalnızca** Google Play Billing / Apple IAP ile satılabilir
- Kalıcı ürünler için **"Satın alımları geri yükle"** butonu (Apple şartı)
- Hak, mağaza onayından **sonra** verilir
- Fiyatlar koda yazılmaz, mağazadan yerel para birimiyle okunur

## 5. Ücretsiz ilerleme ile açılan temalar
| Tema | Koşul |
|---|---|
| Soft Ocean | Varsayılan (Macera Bölüm 1–20) |
| Gece Mavisi | Baştan açık |
| Velvet Night | Sonsuz en iyi skor 1500 **veya** Macera Dünya 2 (Bölüm 21–40) |
| Forest Mist | Skor 3000 **veya** Macera Dünya 3 (Bölüm 41–60) |
| Kor | Skor 4500 veya Macera Dünya 6 |
| Kutup Işığı | Skor 6000 veya Macera Dünya 5 |
| Çöl Akşamı | Macera Dünya 4 |
| Neon Gece, Sakura | Mağaza (kozmetik, ileride) |
