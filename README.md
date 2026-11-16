# Block Fusion

Android ve iPhone (iOS) için özgün blok bulmaca oyunu.
**Tek kod tabanı:** HTML5 + CSS + JavaScript (`www/` klasörü).
Aynı kod; telefon tarayıcısında, ana ekrana eklenmiş web uygulaması olarak ve
Capacitor ile paketlenmiş Google Play / App Store uygulaması olarak çalışır.

## Sonsuz Mod (prototip)

- 8×8 tahta, altta rastgele 3 parça
- Parmakla sürükle-bırak (parça parmağın biraz üstünde durur; gölge önizleme ve
  temizlenecek hatların vurgusu)
- Dolu satır ve sütunlar temizlenir
- Puan: her kare 1 puan; `n` hat temizlenirse ayrıca `10 × n² × kombo`
- Kombo: art arda temizlemelerde artar, 3 hamle temizleme olmazsa sıfırlanır
- Tahta tamamen boşalırsa +300 bonus
- Sığmayan parçalar soluk görünür; hiçbir parça sığmazsa oyun biter
- En iyi skor ve **yarım kalan oyun** saklanır (uygulama kapansa da kaldığı yerden devam)
- Dokunsal geri bildirim (Android titreşim; uygulamada iOS Haptics)
- **Parça döndürme:** tepsideki parçaya **dokun** → 90° döner (sürükle → yerleştir)
  - Her oyunda 5 ücretsiz hak, her döndürme 1 hak; kare/tek blok dönmez ve hak harcatmaz
  - Hak bitince isteğe bağlı **ödüllü reklam** ile +5 hak (şu an test/simülasyon reklamı)
  - Döndürünce sığacak parçalar ↻ işaretiyle gösterilir
  - Oyun başına en fazla 3 ödüllü reklam (+5 hak); zorunlu reklam yok
  - Ayrıntılar ve gelir planı: [docs/MONETIZATION.md](docs/MONETIZATION.md)
- **Paletler:** normal oyunda mat pastel renkler. Macera: Bölüm 1–20 *Soft Ocean*,
  21–40 *Velvet Night*, 41–60 *Forest Mist*. Sonsuz Mod'da açılan temalar Ayarlar'dan seçilir
- **Animasyonlar:** yerleştirmede esneme, temizlemede birleşme + ışık dalgası, hat sayısıyla
  kademeli artan güç, büyük kombolarda karartma + geometrik parçacık + COMBO yazısı,
  en büyük kombolarda 1,8 sn sinematik kutlama, rekor kutlaması
- **Ses ve titreşim:** cihazda üretilen efektler ve sakin müzik; Android/iOS haptik desenleri
- **Ayarlar (⚙):** ses efektleri, müzik, ses seviyeleri, titreşim + yoğunluk, ekran sarsıntısı,
  özel animasyonlar, animasyon yoğunluğu, azaltılmış hareket, varsayılana dön, tema
  — ayrıntılar: [docs/EFFECTS.md](docs/EFFECTS.md)

## Proje yapısı

```
www/                       ← ORTAK OYUN KODU (web + Android + iOS)
  index.html
  manifest.webmanifest     PWA / ana ekrana ekleme
  css/style.css
  assets/                  web simgeleri
  js/
    main.js                açılış, modülleri bağlar
    config.js              ayarlar, renkler, parça şekilleri
    storage.js             kalıcı kayıt (localStorage + yerel Preferences)
    platform/Platform.js   ★ Android / iOS / web farkları yalnızca burada
    core/                  oyun mantığı (DOM'suz): Board, Pieces, Rotation, Score, Game, EventBus
    modes/EndlessMode.js   Sonsuz Mod kuralları
    modes/AdventureMode.js Macera Modu iskeleti (dünya atmosferi hazır)
    theme/                 temalar, Macera dünyaları, ThemeManager
    settings/Settings.js   oyuncu ayarları
    fx/                    animasyon sistemi (FXDirector, Shake, LineClearFX, Particles, Celebration)
    feedback/              titreşim (Haptics) ve ses+titreşim girişi (Feedback)
    audio/                 ses efektleri ve müzik (Web Audio, dosyasız)
    powerups/PowerUps.js   Bomba / Yıldırım / Gökkuşağı (mantık hazır, arayüze bağlı değil)
    monetization/ads/      ödüllü reklam servisi (simülasyon + AdMob iskeleti)
    monetization/store/    uygulama içi satın alma kataloğu ve servis iskeleti
    ui/                    Renderer, DragController, Layout, RotationUI, SettingsUI
android/                   Capacitor Android projesi (Android Studio ile açılır)
ios/                       Capacitor iOS projesi (Xcode ile açılır)
assets/                    uygulama simgesi ve açılış ekranı kaynak görselleri
capacitor.config.json      uygulama kimliği, adı, eklenti ayarları
package.json               Capacitor bağımlılıkları ve komutlar
index.html                 GitHub Pages için www/ klasörüne yönlendirme
```

### Platform uyumluluğu (ne yapıldı)

| Konu | Çözüm |
|---|---|
| Dokunmatik | Pointer Events (Android Chrome + iOS Safari 13+); `touch-action: none` |
| iOS kaydırma/yakınlaştırma | `gesturestart`, çift dokunma ve lastik kaydırma engellenir |
| Çentik / Dynamic Island / ana ekran çubuğu | `viewport-fit=cover` + `env(safe-area-inset-*)`, ölçüler JS'de güvenli alana göre hesaplanır |
| Safari adres çubuğu yüksekliği | `visualViewport` ile görünür yükseklik ölçülür (`--app-h`) |
| Farklı ekranlar | Hücre boyutu ekrana göre hesaplanır (iPhone SE'den iPad'e test edildi) |
| Performans | Animasyonlar yalnızca `transform`/`opacity`; sürükleme `requestAnimationFrame` ile |
| Eski tarayıcı CSS'i | `color-mix()` kaldırıldı, `-webkit-backdrop-filter` eklendi |
| Titreşim | iOS Safari'de titreşim API'si yok → uygulamada `@capacitor/haptics` |
| Kayıt silinmesi | iOS WebView depolaması temizlenebilir → uygulamada `@capacitor/preferences` |
| Arka plana alma | Oyun otomatik kaydedilir, sürükleme iptal edilir |
| Android geri tuşu | Açık pencereyi kapatır, yoksa uygulamayı arka plana alır |
| Yönlendirme | Dikey kilit (AndroidManifest + Info.plist) |

### Genişletme

- **Macera Modu:** `www/js/modes/AdventureMode.js` oluşturup `EndlessMode` ile aynı
  metotları (`setup`, `createTray`, `afterMove`, `isGameOver`, `bestKey`, `saveKey`)
  yazın, `main.js`'de `new EndlessMode()` yerine verin.
- **Güçler:** `PowerUps.register({...})` ile tanımlanır, `game.usePowerUp(id, satır, sütun)`
  ile uygulanır. Kalan iş: arayüzde güç butonu ve hedef seçimi.
- **Yeni yerel özellik** (ses, reklam, satın alma, liderlik tablosu): yalnızca
  `Platform.js` içine eklenir; oyun kodu değişmez.

## 1. Aşama – Telefonda tarayıcıdan test (ücretsiz)

GitHub Pages:
1. Depo → **Settings** → **Pages**
2. **Source:** "Deploy from a branch" → dal seçin, klasör **/(root)** → **Save**
3. 1–2 dk sonra: `https://<kullanıcı-adı>.github.io/Block-fusion/`
   (otomatik olarak `/www/` adresine yönlenir)

- **Android:** Chrome'da açın → ⋮ menü → **Ana ekrana ekle**
- **iPhone:** **Safari**'de açın → Paylaş (□↑) → **Ana Ekrana Ekle**

Not: Ücretsiz hesapta Pages için depo **Public** olmalıdır.

Bilgisayarda: `npm run serve` → `http://localhost:8080`
(ES modülleri nedeniyle `index.html`'i çift tıklayarak açmak çalışmaz.)

## 2. Aşama – Android ve iOS uygulaması (Capacitor)

`android/` ve `ios/` projeleri oluşturuldu; simgeler ve açılış ekranları üretildi.
Oyun kodu değiştikçe:

```bash
npm install          # ilk seferde
npx cap sync         # www/ içeriğini android/ ve ios/ projelerine kopyalar
```

### Android → Google Play
1. Bilgisayara **Android Studio** kurun (ücretsiz) → `npx cap open android`
2. Telefonu USB ile bağlayıp ▶ ile çalıştırın
3. Yayın: **Build → Generate Signed App Bundle** (.aab) → Google Play Console'a yükleyin
4. İmza anahtarını (`.jks`) güvenli saklayın; kaybolursa güncelleme yayınlanamaz (depoya eklenmez)

### iOS → App Store
1. iOS derlemesi **macOS + Xcode** gerektirir (Apple kuralı). Mac yoksa seçenekler:
   GitHub Actions macOS sunucuları veya Codemagic gibi bulut derleme servislerinin ücretsiz kotaları
2. `npx cap open ios` → Xcode'da **Signing & Capabilities** → Apple ekibinizi seçin
3. **Product → Archive** → App Store Connect'e yükleyin → **TestFlight** ile iPhone'da test

### Yayın öncesi kontrol listesi
- [ ] `capacitor.config.json` içindeki `appId` (şu an `com.blockfusion.game`) –
      **yayından sonra değiştirilemez**, size ait bir alan adıyla seçin
- [ ] Gizlilik politikası sayfası (iki mağaza da istiyor; GitHub Pages'te barındırılabilir)
- [ ] Mağaza ekran görüntüleri ve açıklamalar (TR/EN)
- [ ] Sürüm numarası: Android `versionCode/versionName`, iOS `Version/Build`

### Zorunlu mağaza ücretleri (Capacitor ve geliştirme ücretsizdir)
- Google Play geliştirici hesabı: tek seferlik kayıt ücreti
- Apple Developer Program: yıllık üyelik (App Store ve TestFlight için şart)
