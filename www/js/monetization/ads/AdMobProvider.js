// GOOGLE ADMOB sağlayıcısı — İSKELET (sonraki aşama). Şu an KULLANILMIYOR.
//
// Android ve iOS'ta AdMob, Capacitor eklentisi ile kullanılacak:
//   npm i @capacitor-community/admob && npx cap sync
// Eklenti yerelde window.Capacitor.Plugins.AdMob olarak erişilebilir.
//
// Yapılacaklar (bkz. docs/MONETIZATION.md):
//   - Android: AndroidManifest.xml'e APPLICATION_ID meta-data
//   - iOS: Info.plist'e GADApplicationIdentifier + SKAdNetworkItems
//   - GDPR/UMP izin formu, iOS App Tracking Transparency izni
//   - Geliştirmede Google'ın TEST reklam kimlikleri (gerçek kimlikle kendi
//     reklamına tıklamak hesabın kapatılmasına yol açabilir)
//
// Ödül kuralı: show() yalnızca eklentinin "Rewarded" olayı geldiyse
// 'completed' döndürür; sadece kapatılırsa 'dismissed'.

// Google'ın resmi test ödüllü reklam kimlikleri
const TEST_IDS = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313'
};

export class AdMobProvider {
  constructor({ os, adUnitIds = TEST_IDS, testing = true } = {}) {
    this.name = 'admob';
    this.os = os;
    this.adUnitId = adUnitIds[os];
    this.testing = testing;
    this.plugin = window.Capacitor?.Plugins?.AdMob;
    this.loaded = false;
  }

  async init() {
    if (!this.plugin) throw new Error('AdMob eklentisi yok');
    // TODO: izin akışı (UMP / ATT) burada yapılacak.
    await this.plugin.initialize({ initializeForTesting: this.testing });
  }

  isLoaded() { return this.loaded; }

  async load() {
    await this.plugin.prepareRewardVideoAd({ adId: this.adUnitId, isTesting: this.testing });
    this.loaded = true;
  }

  show() {
    this.loaded = false;
    return new Promise((resolve) => {
      let rewarded = false;
      const handles = [];
      const finish = (result) => {
        handles.forEach((h) => h?.then?.((x) => x.remove()));
        resolve(result);
      };
      // Olay adları eklenti sürümüne göre doğrulanmalı (RewardAdPluginEvents)
      handles.push(this.plugin.addListener('onRewardedVideoAdReward', () => { rewarded = true; }));
      handles.push(this.plugin.addListener('onRewardedVideoAdDismissed', () => finish(rewarded ? 'completed' : 'dismissed')));
      handles.push(this.plugin.addListener('onRewardedVideoAdFailedToShow', () => finish('failed')));
      this.plugin.showRewardVideoAd().catch(() => finish('failed'));
    });
  }
}
