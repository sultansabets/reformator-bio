import { useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistant() {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.start();

    setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };
  };

  const handleVoiceCommand = (text: string) => {
    console.log("Распознано:", text);

    // Вода
    if (text.includes("вода") || text.includes("выпил")) {
      const match = text.match(/\d+/);
      if (match) {
        const amount = parseInt(match[0]);
        const saved = JSON.parse(localStorage.getItem("reformator_bio_water") || '{"totalMl":0}');
        saved.totalMl += amount;
        localStorage.setItem("reformator_bio_water", JSON.stringify(saved));
        alert(`Добавлено ${amount} мл воды`);
      }
    }

    // Тренировка
    if (text.includes("бег") || text.includes("тренировка")) {
      alert("Тренировка добавлена (демо)");
    }

    // Еда
    if (text.includes("грамм")) {
      alert("Еда добавлена (демо)");
    }
  };

  return (
    <button
      onClick={startListening}
      className={`fixed bottom-20 right-4 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition ${
        listening ? "bg-status-green text-background" : "bg-primary text-primary-foreground"
      }`}
    >
      🎤
    </button>
  );
}
