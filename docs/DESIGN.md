# MAJOR BLOCK – Görsel Tasarım Sistemi

Seçilen yön: **yumuşak mürdüm + gece mavisi zemin, retro-fütüristik, ince bakır/altın detaylar,
PASTEL ama belirgin bloklar** (açık pastel bloklar koyu zeminde net seçilir, gözü yormaz).

## Katmanlar
| Dosya | Görev |
|---|---|
| `www/js/theme/themes.js` | Temalar: renkler, 8 blok rengi, kutlama (fx) renkleri, metal tonları |
| `www/js/theme/ThemeManager.js` | Temayı CSS değişkenlerine yazar (anında, sayfa yenilemeden) |
| `www/css/style.css` | Yerleşim ve bileşen yapısı |
| `www/css/theme-major.css` | Premium görünüm: arka plan, metal çerçeveler, bloklar, tipografi |

Renkler yalnızca temadan gelir. Yeni palet = `themes.js`'e bir kayıt; CSS'e dokunmak gerekmez.
Macera Modu'nda her 20 bölümde `atmosphereForLevel(level)` başka bir temayı seçer; çerçeve,
tipografi ve blok yüzeyi aynı kalır, yalnızca renkler değişir.

## Tema değişkenleri
`--bg-1/2`, `--bg-glow-1/2` (sinematik arka plan) · `--panel`, `--panel-2` · `--cell-empty`,
`--cell-empty-edge` (boş hücre) · `--text`, `--text-dim`, `--accent` · `--p0…--p7` (bloklar) ·
`--fx0…--fx3` (yalnızca büyük kombolar) · `--metal-copper`, `--metal-gold`, `--metal-dark`

## Kurallar
- **Bloklar asla gömülmez:** boş hücreler içe gömük (iç gölge), bloklar dışa çıkık
  (koyu dış hat + üst kenar ışığı + gölge). Her blok rengi boş hücreye göre ≥ 3:1 kontrast
  (Major Pastel'de en düşük 5,4:1), tonlar arası ≥ 20°.
- **Kontrollü parlaklık:** mat, hafif dokulu yüzey; sürekli neon/parlama yok. Güçlü efektler
  yalnızca büyük kombolarda (`docs/EFFECTS.md`).
- **Tipografi:** Chakra Petch (OFL, `www/assets/fonts/`, internetsiz çalışır, Türkçe karakterli)
  skor, başlık, düğme ve etiketlerde; açıklama metinlerinde sistem fontu.
- **Dokunma alanı:** etkileşimli düğmeler en az 44 px.

## Major Pastel blok renkleri
nane `#5fe0c8` · pembe `#ff8fc3` · şeftali `#ffad75` · fıstık yeşili `#a3e27c` ·
lavanta `#b9a0ff` · tereyağı sarısı `#ffdc72` · gök mavisi `#82c6ff` · mercan `#ff8b85`

Blok yüzeyi: üst ışık kenarı + yumuşak iç parlaklık + alt pah + ince koyu dış hat (sabit, yanıp sönmez).
Tepsi parçaları kalan boşluğa göre büyür; uzun parçalar yuvaya sığacak kadar küçülür.

## Canlı sunucu karakteri (yer ayrıldı, içerik yok)
HUD'un solunda 58 px dairesel, metal çerçeveli yuva (`#presenter`, `www/js/ui/PresenterSlot.js`).
Oyun alanını kapatmaz, dokunuşu engellemez. Oyun olaylarına göre `data-mood` güncellenir:
`idle`, `happy` (hat), `excited` (kombo ≥3), `cheer` (sinematik/rekor), `sad` (oyun sonu).

Animasyon eklemek için bir sürücü yazılır ve takılır:
```js
presenter.mount({
  attach(stageEl) { /* Lottie / Rive / sprite / video öğesini stageEl içine yerleştir */ },
  play(mood) { /* ruh hâline uygun klibi oynat */ },
  detach() { /* temizle */ }
});
```
Azaltılmış hareket açıkken sürücü sakin bir duruş göstermelidir.
