import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  isSupported: boolean;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // Arabic language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript + interimTranscript);
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('لم يتم اكتشاف أي صوت. يرجى المحاولة مرة أخرى.');
          break;
        case 'audio-capture':
          setError('لم يتم العثور على ميكروفون. يرجى التحقق من إعدادات الميكروفون.');
          break;
        case 'not-allowed':
          setError('تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول في إعدادات المتصفح.');
          break;
        case 'network':
          setError('خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.');
          break;
        default:
          setError('حدث خطأ في التعرف على الصوت. يرجى المحاولة مرة أخرى.');
      }
      
      setIsListening(false);
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    
    try {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('فشل بدء التسجيل. يرجى المحاولة مرة أخرى.');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported,
  };
}
