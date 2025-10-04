/**
 * Text-to-Speech Service
 * Provides voice synthesis for NPC agent responses
 */

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
  description: string;
}

export interface SpeechSettings {
  voice: string;
  rate: number; // 0.1 to 2.0
  pitch: number; // 0 to 2.0
  volume: number; // 0 to 1.0
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private settings: SpeechSettings = {
    voice: "",
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();

    // Voices may not be loaded immediately
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();

    // Set default voice if not already set
    if (!this.settings.voice && this.voices.length > 0) {
      // Prefer English voices
      const englishVoice =
        this.voices.find(
          (voice) =>
            voice.lang.startsWith("en") && voice.name.includes("Google"),
        ) || this.voices.find((voice) => voice.lang.startsWith("en"));

      this.settings.voice = englishVoice?.name || this.voices[0].name;
    }
  }

  /**
   * Get available voice options formatted for UI
   */
  getAvailableVoices(): VoiceOption[] {
    return this.voices
      .filter((voice) => voice.lang.startsWith("en")) // English only for now
      .map((voice) => ({
        id: voice.name,
        name: voice.name,
        language: voice.lang,
        gender: this.inferGender(voice.name),
        description: `${voice.name} (${voice.lang})`,
      }));
  }

  private inferGender(voiceName: string): "male" | "female" | "neutral" {
    const name = voiceName.toLowerCase();

    // Common patterns in voice names
    if (
      name.includes("female") ||
      name.includes("woman") ||
      name.includes("karen") ||
      name.includes("samantha") ||
      name.includes("susan") ||
      name.includes("victoria") ||
      name.includes("allison") ||
      name.includes("zoe")
    ) {
      return "female";
    }

    if (
      name.includes("male") ||
      name.includes("man") ||
      name.includes("daniel") ||
      name.includes("alex") ||
      name.includes("tom") ||
      name.includes("fred") ||
      name.includes("jorge") ||
      name.includes("diego")
    ) {
      return "male";
    }

    return "neutral";
  }

  /**
   * Update speech settings
   */
  updateSettings(newSettings: Partial<SpeechSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): SpeechSettings {
    return { ...this.settings };
  }

  /**
   * Speak text with current settings
   */
  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = this.voices.find(
        (voice) => voice.name === this.settings.voice,
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Get recommended voice for NPC profile
   */
  getRecommendedVoice(npcProfile: {
    name: string;
    personality?: any;
  }): string | null {
    const voices = this.getAvailableVoices();

    // Simple heuristics based on profile characteristics
    const profileName = npcProfile.name.toLowerCase();

    if (profileName.includes("analytical") || profileName.includes("skeptic")) {
      // Prefer more formal, measured voices
      return (
        voices.find((v) => v.name.includes("Daniel") || v.name.includes("Alex"))
          ?.id || null
      );
    }

    if (
      profileName.includes("charismatic") ||
      profileName.includes("manipulator")
    ) {
      // Prefer smoother, persuasive voices
      return (
        voices.find(
          (v) => v.name.includes("Karen") || v.name.includes("Samantha"),
        )?.id || null
      );
    }

    if (profileName.includes("paranoid") || profileName.includes("survivor")) {
      // Prefer more tense, careful voices
      return (
        voices.find((v) => v.name.includes("Susan") || v.name.includes("Tom"))
          ?.id || null
      );
    }

    if (profileName.includes("naive") || profileName.includes("helper")) {
      // Prefer friendlier, warmer voices
      return (
        voices.find((v) => v.name.includes("Allison") || v.name.includes("Zoe"))
          ?.id || null
      );
    }

    if (profileName.includes("chaos") || profileName.includes("agent")) {
      // Prefer more dynamic, unpredictable voices
      return (
        voices.find(
          (v) => v.name.includes("Victoria") || v.name.includes("Fred"),
        )?.id || null
      );
    }

    return null;
  }

  /**
   * Check if browser supports speech synthesis
   */
  static isSupported(): boolean {
    return "speechSynthesis" in window;
  }
}

// Singleton instance
export const textToSpeechService = new TextToSpeechService();
