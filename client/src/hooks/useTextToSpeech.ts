import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isEnabled: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggleEnabled: () => void;
  error: string | null;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Auto-read enabled by default
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      setError('متصفحك لا يدعم تحويل النص إلى صوت. يرجى استخدام Chrome أو Edge.');
      return;
    }

    setIsSupported(true);

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Try to find Arabic voice
      const arabicVoice = availableVoices.find(voice => 
        voice.lang.startsWith('ar') || voice.lang === 'ar-SA'
      );
      
      if (arabicVoice) {
        setSelectedVoiceState(arabicVoice);
      } else {
        // Fallback to default voice
        setSelectedVoiceState(availableVoices[0] || null);
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !isEnabled || !text.trim()) return;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
        
        if (event.error === 'canceled') {
          // Ignore cancel errors (user stopped manually)
          return;
        }
        
        setError('حدث خطأ في قراءة النص. يرجى المحاولة مرة أخرى.');
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Error speaking text:', err);
      setError('فشل في قراءة النص. يرجى المحاولة مرة أخرى.');
      setIsSpeaking(false);
    }
  }, [isSupported, isEnabled, selectedVoice]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (err) {
      console.error('Error pausing speech:', err);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (err) {
      console.error('Error resuming speech:', err);
    }
  }, [isSupported, isPaused]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    } catch (err) {
      console.error('Error stopping speech:', err);
    }
  }, [isSupported]);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (!newValue) {
        // If disabling, stop any ongoing speech
        stop();
      }
      return newValue;
    });
  }, [stop]);

  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoiceState(voice);
  }, []);

  return {
    isSpeaking,
    isPaused,
    isEnabled,
    speak,
    pause,
    resume,
    stop,
    toggleEnabled,
    error,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
