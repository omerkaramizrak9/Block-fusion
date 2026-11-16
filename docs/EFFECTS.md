# Block Fusion – Animasyon, Ses ve Titreşim

## İlkeler
- Normal oynanış sakin, mat ve akıcı. Parlak (yine pastel) renkler yalnızca kutlamalarda.
- Sürekli yanıp sönen ışık, aşırı parlama, jeton/para/yıldız gibi "casino" görselleri yok.
- Tüm efektler `pointer-events: none`: dokunmatik kontrol hiçbir an engellenmez.
- Sarsıntı yalnızca oyun alanına (tahta) uygulanır. Parça bırakma hedefi
  sarsıntıdan etkilenmeyen ölçülerle hesaplanır (12 px sarsıntıda bile doğru hücre).
- Yalnızca `transform`/`opacity` animasyonu; her efekt öğesi bitince silinir,
  parçacık sayısı üst sınırlı (70).

## Seviyeler (`www/js/fx/levels.js`)

| Olay | Görsel | Sarsıntı | Titreşim | Ses |
|---|---|---|---|---|
| Blok yerleştirme | kısa esneme (squash & stretch) | hafif "tok" darbe | hafif tık | yumuşak tık |
| 1 hat | bloklar birleşir → ışık dalgası | çok kısa | kısa | akor |
| 2 hat | daha güçlü dalga | kısa | **çift** | zengin akor |
| 3+ hat | güçlü dalga + birkaç parçacık | **belirgin** | **güçlü** | akor + bas |
| Kombo ≥3 | arka plan hafif kararır, geometrik pastel parçacıklar, **COMBO** yazısı | sinematik | **ritmik** | süpürme + darbe + akor |
| Kombo ≥5 / 4+ hat / tahta temiz | **1,8 sn sinematik**: koyu arka plan, yavaş ışık, ritmik halkalar, dalga dalga parçacık | ritmik, azalan | sinematik desen | uzun süpürme + arpej |
| Rekor kırıldı (oyunda bir kez) | "YENİ REKOR!" şeridi + parçacık (diğer kutlama bitince) | – | özel desen | fanfar |

"Animasyon yoğunluğu" (Hafif / Normal / Güçlü) genlik ve parçacık sayısını 0,6 / 1 / 1,4 ile çarpar.

## Ayarlar (`www/js/settings/Settings.js`)
| Ayar | Etkisi |
|---|---|
| Ses efektleri + seviye | Tüm oyun sesleri |
| Arka plan müziği + seviye | Cihazda üretilen sakin ambient müzik |
| Telefon titreşimi + yoğunluk | Hafif: kısa/zayıf, Güçlü: uzun/güçlü (yine kısa) |
| Ekran sarsıntısı | Oyun alanı sarsıntısı ve yerleştirme darbesi |
| Özel animasyonlar ve parçacıklar | Karartma, parçacık, halka, sinematik; kapalıyken sade yazı |
| Animasyon yoğunluğu | Hafif / Normal / Güçlü |
| Azaltılmış hareket | Sistem / Açık / Kapalı. Açıkken sarsıntı, parçacık, karartma yok; geçişler sade solma |

Tümü anında uygulanır, cihazda saklanır, "Varsayılan ayarlara dön" ile sıfırlanır (tema korunur).

## Platform
| | Android uygulama | iOS uygulama | Android tarayıcı | iPhone Safari |
|---|---|---|---|---|
| Titreşim | Capacitor Haptics | Capacitor Haptics (Taptic Engine) | `navigator.vibrate` | **yok** (ayar pasif, hata yok) |
| Ses | Web Audio | Web Audio | Web Audio | Web Audio (sessiz modda duyulmaz) |

Ses ilk dokunuşta açılır (tarayıcı kuralı) ve uygulama arka plana geçince askıya alınır.

## Modüller
```
www/js/fx/levels.js        seviye kuralları ve güç tablosu
www/js/fx/FXDirector.js    olay → efekt + ses + titreşim
www/js/fx/Shake.js         oyun alanı sarsıntısı (Web Animations API)
www/js/fx/LineClearFX.js   birleşme + ışık dalgası
www/js/fx/Particles.js     geometrik parçacıklar
www/js/fx/Celebration.js   COMBO, sinematik, rekor
www/js/feedback/Haptics.js titreşim desenleri (kısa, üst üste binmez)
www/js/feedback/Feedback.js ses + titreşim tek giriş
www/js/audio/AudioEngine.js, Music.js  efektler ve müzik (dosyasız)
```
