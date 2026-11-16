// Ses + titreşim için tek giriş noktası. Oyun olaylarını geri bildirim
// seviyelerine çevirir; her kanal kendi ayarına bakar (biri kapalıysa diğeri çalışır).
//
// Hat temizleme seviyeleri (FX ile aynı):
//   line1 : 1 hat            → kısa titreşim
//   line2 : 2 hat            → çift titreşim
//   line3 : 3+ hat           → güçlü titreşim
//   combo : büyük kombo      → ritmik titreşim + güçlü ses
//   epic  : en büyük kombo   → sinematik desen

export class Feedback {
  constructor({ haptics, audio }) {
    this.haptics = haptics;
    this.audio = audio;
  }

  /** Basit olaylar: place | rotate | deny | reward | gameover | record | ui */
  play(name) {
    this.haptics.play(name === 'reward' ? 'ui' : name);
    this.audio.play(name);
  }

  /** Hat temizleme / kombo. level: line1 | line2 | line3 | combo | epic */
  clear(level, { lines, combo }) {
    this.haptics.play(level);
    if (level === 'combo' || level === 'epic') this.audio.play(level, { lines, combo });
    else this.audio.play('line', { lines, combo });
  }
}
