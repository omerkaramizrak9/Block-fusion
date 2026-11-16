// Döndürme hakkı sayacı + ödüllü reklam teklifi.
//
// Akışlar:
//   refill : Hak bitti ve oyuncu parçaya dokundu (veya ▶ butonuna bastı)
//            -> "Reklam izle, +5 hak" teklifi. Reddederse oyun normal devam eder.
//   rescue : Hiçbir parça sığmıyor ama döndürme kurtarabilir, hak yok
//            -> son şans teklifi. Reddederse / reklam yoksa oyun biter.
//
// Ödül yalnızca AdService "rewarded: true" döndürürse verilir.
import { CONFIG } from '../config.js';

const MESSAGES = {
  dismissed: 'Reklam tamamlanmadığı için ödül verilmedi.',
  failed: 'Reklam gösterilemedi. Daha sonra tekrar dene.',
  load_failed: 'Reklam şu an yüklenemedi. Daha sonra tekrar dene.',
  timeout: 'Reklam zamanında yüklenemedi. Daha sonra tekrar dene.',
  unavailable: 'Reklam şu an kullanılamıyor.',
  busy: 'Bir reklam zaten açık.'
};

export class RotationUI {
  constructor({ game, bus, ads, els }) {
    this.game = game;
    this.ads = ads;
    this.els = els;
    this.mode = null;     // açık teklif: 'refill' | 'rescue' | null
    this.busy = false;    // reklam sürerken çift tıklamayı engeller
    this.amount = CONFIG.rewards.rotationAdAmount;

    els.rotAdLabel.textContent = `+${this.amount} hak`;
    els.rotAdBtn.addEventListener('click', () => this.open('refill'));
    els.rewardWatch.addEventListener('click', () => this._watch());
    els.rewardSkip.addEventListener('click', () => this.skip());

    bus.on('rotations', (e) => this._onRotations(e));
    bus.on('rotate-denied', ({ reason }) => {
      if (reason === 'no-rights') this.open('refill');
      else if (reason === 'symmetric') this.toast('Bu parça dönmez');
    });
    // Son hamlenin animasyonu görünsün diye kısa bekleme
    bus.on('stuck', () => setTimeout(() => this._onStuck(), 650));
    bus.on('start', () => this.close());
  }

  /** Dokunma ile döndürme isteği (DragController'dan). */
  requestRotate(slot) {
    this.game.rotatePiece(slot);
  }

  /** Bu oyunda kalan ödüllü reklam sayısı (sınırsızsa Infinity). */
  get adsLeft() {
    const max = CONFIG.rewards.maxAdsPerGame;
    return max ? Math.max(0, max - this.game.adsWatched) : Infinity;
  }

  get canOfferAd() {
    return this.ads.enabled && this.adsLeft > 0;
  }

  get isOpen() { return this.mode !== null; }

  open(mode) {
    if (this.isOpen || this.busy) return;
    if (mode === 'refill' && this.game.state !== 'playing') return;
    if (!this.canOfferAd) {
      if (mode === 'rescue') this.game.declineRescue();
      else this.toast('Döndürme hakkın kalmadı');
      return;
    }
    this.mode = mode;
    const { rewardTitle, rewardText, rewardSkip, rewardWatch, reward } = this.els;
    if (mode === 'rescue') {
      rewardTitle.textContent = 'Döndürerek devam et!';
      rewardText.innerHTML = `Hamle kalmadı ama bir parçayı döndürürsen sığabilir. Reklam izle, <b>${this.amount} döndürme hakkı</b> kazan.`;
      rewardSkip.textContent = 'Hayır, oyunu bitir';
    } else {
      rewardTitle.textContent = 'Döndürme hakkın bitti';
      rewardText.innerHTML = `Kısa bir reklam izleyerek <b>${this.amount} döndürme hakkı</b> kazanabilirsin. İzlemezsen oyun normal devam eder.`;
      rewardSkip.textContent = 'Hayır, teşekkürler';
    }
    if (Number.isFinite(this.adsLeft)) {
      rewardText.innerHTML += `<br><small class="ads-left">Bu oyunda kalan reklam: ${this.adsLeft}/${CONFIG.rewards.maxAdsPerGame}</small>`;
    }
    rewardWatch.textContent = `▶ Reklam İzle (+${this.amount})`;
    this._setError(null);
    this._setBusy(false);
    reward.classList.remove('hidden');
  }

  close() {
    this.mode = null;
    this.els.reward.classList.add('hidden');
  }

  /** Teklifi reddet. Rescue'da oyun biter, refill'de oyun devam eder. */
  skip() {
    if (this.busy) return;
    const wasRescue = this.mode === 'rescue';
    this.close();
    if (wasRescue) this.game.declineRescue();
  }

  async _watch() {
    if (this.busy || !this.mode) return;
    const placement = this.mode === 'rescue' ? 'rotation_rescue' : 'rotation_refill';
    this._setBusy(true);
    this._setError(null);
    const result = await this.ads.showRewarded(placement);
    this._setBusy(false);

    if (result.rewarded) {
      this.close();
      this.game.adsWatched += 1;
      this.game.addRotations(this.amount, 'ad');
      this.toast(`+${this.amount} döndürme hakkı!`, 'good');
      return;
    }
    // Ödül yok: pencere açık kalır, oyuncu tekrar deneyebilir ya da vazgeçebilir
    this._setError(MESSAGES[result.reason] || MESSAGES.failed);
    if (!this.canOfferAd) this.els.rewardWatch.disabled = true;
  }

  _onStuck() {
    if (this.game.state === 'stuck') this.open('rescue');
  }

  _onRotations({ count, delta }) {
    const { rotCount, rotCountWrap, rotHint, rotAdBtn } = this.els;
    rotCount.textContent = String(count);
    const empty = count < this.game.rotationCost;
    rotCountWrap.classList.toggle('empty', empty);
    const anim = delta > 0 ? 'gain' : delta < 0 ? 'bump' : null;
    if (anim) {
      rotCountWrap.classList.remove('gain', 'bump');
      void rotCountWrap.offsetWidth;
      rotCountWrap.classList.add(anim);
    }
    const showAd = empty && this.canOfferAd;
    rotAdBtn.classList.toggle('hidden', !showAd);
    rotHint.textContent = empty
      ? (showAd ? 'Hak kalmadı' : 'Döndürme hakkı kalmadı')
      : 'Döndürmek için parçaya dokun';
  }

  _setBusy(on) {
    this.busy = on;
    this.els.rewardWatch.disabled = on;
    this.els.rewardSkip.disabled = on;
    if (on) this.els.rewardWatch.textContent = 'Reklam yükleniyor…';
    else this.els.rewardWatch.textContent = `▶ Reklam İzle (+${this.amount})`;
  }

  _setError(msg) {
    const el = this.els.rewardError;
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  toast(text, kind = '') {
    const el = this.els.toast;
    el.textContent = text;
    el.className = `toast show ${kind}`;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { el.className = 'toast'; }, 1800);
  }
}
