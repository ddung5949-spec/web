// Text-To-Speech / AI Voice Helper for Vietnamese Language
// Uses Web Speech Synthesis with voice profiling, pitch, rate adjustments, and sentence queue

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  region: 'north' | 'south' | 'military';
  description: string;
  lang: string;
  pitch: number; // 0.5 to 1.5
  rate: number; // 0.7 to 1.5
}

export const VIETNAMESE_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vn-female-north',
    name: 'Nữ Miền Bắc (Hà Nội)',
    gender: 'female',
    region: 'north',
    description: 'Thanh lịch, chuẩn mực, truyền cảm',
    lang: 'vi-VN',
    pitch: 1.05,
    rate: 0.95,
  },
  {
    id: 'vn-female-south',
    name: 'Nữ Miền Nam',
    gender: 'female',
    region: 'south',
    description: 'Ấm áp, nhẹ nhàng, diễn cảm',
    lang: 'vi-VN',
    pitch: 1.15,
    rate: 0.95,
  },
  {
    id: 'vn-male-military',
    name: 'Nam Quân đội (Chính trị)',
    gender: 'male',
    region: 'military',
    description: 'Dõng dạc, hào hùng, trang nghiêm',
    lang: 'vi-VN',
    pitch: 0.85,
    rate: 0.92,
  },
  {
    id: 'vn-male-warm',
    name: 'Nam Miền Bắc (Trầm ấm)',
    gender: 'male',
    region: 'north',
    description: 'Trầm ấm, rõ ràng, dễ nghe',
    lang: 'vi-VN',
    pitch: 0.9,
    rate: 0.95,
  },
];

class AISpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPaused = false;
  private isSpeaking = false;
  private listeners: Set<() => void> = new Set();
  private progressListeners: Set<(progress: number, currentSentence: string) => void> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.availableVoices.filter((v) => v.lang.includes('vi') || v.lang.includes('VI'));
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeProgress(listener: (progress: number, currentSentence: string) => void) {
    this.progressListeners.add(listener);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private notifyProgress(progress: number, sentence: string) {
    this.progressListeners.forEach((l) => l(progress, sentence));
  }

  public speak(
    text: string,
    profileId: string = 'vn-female-north',
    customRate: number = 1.0
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('Speech synthesis not supported on this browser.');
        resolve(false);
        return;
      }

      // Stop any existing speech
      this.stop();

      // Clean and sanitize text for military & news content reading
      const cleanText = text
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/[*_~`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        resolve(false);
        return;
      }

      const profile =
        VIETNAMESE_VOICE_PROFILES.find((p) => p.id === profileId) ||
        VIETNAMESE_VOICE_PROFILES[0];

      // Split into sentences for better natural cadence and progress tracking
      const sentences = cleanText
        .split(/(?<=[.!?;\n])\s+/)
        .filter((s) => s.trim().length > 0);

      let currentSentenceIndex = 0;

      // Select system voice if available
      const vnVoices = this.getAvailableSystemVoices();
      let matchedVoice: SpeechSynthesisVoice | null = null;

      if (vnVoices.length > 0) {
        if (profile.gender === 'female') {
          matchedVoice =
            vnVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nu') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('linh')) ||
            vnVoices[0];
        } else {
          matchedVoice =
            vnVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('namminh') || v.name.toLowerCase().includes('viet')) ||
            vnVoices[0];
        }
      }

      const speakNextSentence = () => {
        if (!this.synth || currentSentenceIndex >= sentences.length) {
          this.isSpeaking = false;
          this.isPaused = false;
          this.notifyProgress(100, '');
          this.notify();
          resolve(true);
          return;
        }

        const currentText = sentences[currentSentenceIndex];
        const progress = Math.round(((currentSentenceIndex + 1) / sentences.length) * 100);
        this.notifyProgress(progress, currentText);

        const utterance = new SpeechSynthesisUtterance(currentText);
        utterance.lang = 'vi-VN';
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
        utterance.pitch = profile.pitch;
        utterance.rate = (profile.rate * customRate);

        utterance.onstart = () => {
          this.isSpeaking = true;
          this.isPaused = false;
          this.notify();
        };

        utterance.onend = () => {
          currentSentenceIndex++;
          if (this.isSpeaking) {
            speakNextSentence();
          }
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis utterance error:', e);
          currentSentenceIndex++;
          if (this.isSpeaking) {
            speakNextSentence();
          } else {
            this.isSpeaking = false;
            this.notify();
            resolve(false);
          }
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
      };

      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
      speakNextSentence();
    });
  }

  public pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notifyProgress(0, '');
      this.notify();
    }
  }

  public getStatus() {
    return {
      isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const aiSpeech = new AISpeechEngine();
