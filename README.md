# Block Fusion

Telefon tarayıcısında çalışan özgün bir blok bulmaca oyunu (HTML5 + CSS + JavaScript).
Kurulum, derleme veya ücretli servis gerektirmez.

## Sonsuz Mod (prototip)

- 8×8 tahta, altta rastgele 3 parça
- Parmakla sürükle-bırak (parça, parmağın biraz üstünde durur; gölge önizleme ve
  temizlenecek hatların vurgusu gösterilir)
- Dolu satır ve sütunlar temizlenir
- Puan: her kare 1 puan; temizlenen hat sayısı `n` ise `10 × n² × kombo`
- Kombo: art arda temizlemelerde artar, 3 hamle boyunca temizleme olmazsa sıfırlanır
- Tahta tamamen boşalırsa +300 bonus
- Sığmayan parçalar soluk gösterilir; hiçbir parça sığmazsa oyun biter
- En iyi skor telefonda saklanır (localStorage)
- Titreşim geri bildirimi (Android)

## Dosya yapısı

```
index.html               Sayfa iskeleti
css/style.css            Görünüm ve animasyonlar
js/config.js             Ayarlar, renkler, parça şekilleri
js/main.js               Modülleri birbirine bağlar
js/storage.js            Güvenli localStorage
js/core/EventBus.js      Mantık ↔ arayüz olay sistemi
js/core/Board.js         Tahta verisi ve kuralları
js/core/Pieces.js        Rastgele (adil) parça üretimi
js/core/Score.js         Puan ve kombo
js/core/Game.js          Oyun akışı (modlardan bağımsız)
js/modes/EndlessMode.js  Sonsuz Mod kuralları
js/powerups/PowerUps.js  Bomba / Yıldırım / Gökkuşağı (mantık hazır, arayüze bağlı değil)
js/ui/Renderer.js        Çizim ve efektler
js/ui/DragController.js  Dokunmatik sürükle-bırak
js/ui/Layout.js          Ekran boyutuna uyum
```

### Genişletme

- **Macera Modu:** `js/modes/AdventureMode.js` oluşturup `EndlessMode` ile aynı
  metotları (`setup`, `createTray`, `afterMove`, `isGameOver`) yazın, `main.js`'de
  `new EndlessMode()` yerine verin.
- **Güçler:** `PowerUps.register({...})` ile tanımlanır, `game.usePowerUp(id, satır, sütun)`
  ile uygulanır. Kalan iş: arayüzde güç butonu ve hedef seçimi.

## Telefonda test (GitHub Pages – ücretsiz)

1. GitHub'da depo → **Settings** → **Pages**.
2. **Source:** "Deploy from a branch".
3. **Branch:** oyun dosyalarının bulunduğu dalı seçin, klasör **/(root)** → **Save**.
4. 1–2 dakika sonra adres: `https://<kullanıcı-adı>.github.io/Block-fusion/`
5. Bu adresi Android Chrome'da açın. Menü → **Ana ekrana ekle** ile uygulama gibi
   tam ekran açabilirsiniz.

Not: Ücretsiz GitHub hesabında Pages için deponun **Public** olması gerekir.

Bilgisayarda yerel test: `python3 -m http.server` → `http://localhost:8000`
(ES modülleri nedeniyle dosyayı doğrudan çift tıklayarak açmak çalışmaz.)
