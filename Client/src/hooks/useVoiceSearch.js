import { useEffect, useRef, useState } from "react";

export const useVoiceSearch = ({
  onResult,
  onFinalResult,
  silenceTimeout = 2000,
  lang = "en-US",
}) => {
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
    };

    recognition.onerror = () => {
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
    };

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText) onResult(interimText);
      if (finalText) onFinalResult(finalText);

      // ⏱️ auto-stop after silence
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, silenceTimeout);
    };

    recognitionRef.current = recognition;
  }, [lang, onResult, onFinalResult, silenceTimeout]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
