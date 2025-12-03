// japanese-vocabulary/app.js

// ======================
// USTAWIENIA GŁOSU / TTS
// ======================

// Cache na głosy
let japaneseVoice = null;
let polishVoice = null;

// Ładowanie głosów, gdy tylko będą dostępne
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();

  // Japoński – preferowany
  japaneseVoice =
    voices.find(v => v.lang === "ja-JP") ||
    voices.find(v => v.lang.startsWith("ja"));

  // Polski – preferowany
  polishVoice =
    voices.find(v => v.lang === "pl-PL") ||
    voices.find(v => v.lang.startsWith("pl"));
};

// Główna funkcja mówienia
function speak(text, lang) {
  if (!("speechSynthesis" in window)) {
    alert("Twoja przeglądarka nie obsługuje mowy (speechSynthesis).");
    return;
  }

  // Automatyczne wykrycie języka, jeśli nie podano
  if (!lang) {
    // Jeśli są polskie znaki – traktuj jako polski
    if (/[ąćęłńóśźż]/i.test(text)) {
      lang = "pl-PL";
    } else {
      lang = "ja-JP";
    }
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;

  // Wybór głosu
  if (lang.startsWith("ja") && japaneseVoice) {
    utter.voice = japaneseVoice;
  }
  if (lang.startsWith("pl") && polishVoice) {
    utter.voice = polishVoice;
  }

  // Styl mówienia – wolniej, jak nauczyciel
  utter.rate = 0.8;   // 1.0 = normalnie, 0.8 = trochę wolniej
  utter.pitch = 1.0;  // wysokość głosu
  utter.volume = 1.0; // głośność

  window.speechSynthesis.speak(utter);
}

// ======================
// LOGIKA GRY
// ======================

// Dane słownictwa są w osobnym pliku vocabulary-jp-basic.js
// i dodają tablicę window.vocabularyJp
const words = window.vocabularyJp || [];

let currentWord = null;
// Pula: tylko słowa, których jeszcze NIE oznaczyliśmy jako „umiem"
let remainingPool = [...words];
// Lista słów już zadanych w bieżącym cyklu
let askedInCurrentCycle = [];
// Lista słów na stałe opanowanych (nie wrócą do puli)
let learnedWords = [];

function updateStats() {
  const totalLearning = remainingPool.length;
  const askedThisCycle = askedInCurrentCycle.length;
  const totalLearned = learnedWords.length;
  const totalWords = words.length;

  const stats = document.getElementById("statsInfo");
  stats.textContent = 
    `Cykl: ${askedThisCycle}/${totalLearning} | Opanowane: ${totalLearned}/${totalWords}`;
}

function pickRandomWord() {
  if (!words.length) {
    console.warn("Brak danych słownictwa (words). Upewnij się, że vocabulary-jp-basic.js jest poprawnie załadowany.");
  }

  if (remainingPool.length === 0) {
    currentWord = null;
    document.getElementById("japanese").textContent = "Wszystkie słowa opanowane! 🎉";
    document.getElementById("pronunciation").textContent = "";
    document.getElementById("answerBox").style.display = "none";
    updateStats();
    return;
  }

  // Sprawdź czy wszystkie słowa w bieżącej puli zostały już zadane
  const notAskedYet = remainingPool.filter(word => 
    !askedInCurrentCycle.some(asked => asked.hiragana === word.hiragana)
  );

  if (notAskedYet.length === 0) {
    // Koniec cyklu - resetuj listę zadanych
    askedInCurrentCycle = [];
    document.getElementById("japanese").textContent = "Cykl zakończony! Rozpoczynam nowy...";
    document.getElementById("pronunciation").textContent = "";
    document.getElementById("answerBox").style.display = "none";
    updateStats();
    
    // Krótka przerwa przed nowym cyklem
    setTimeout(() => {
      pickRandomWord();
    }, 2000);
    return;
  }

  // Wybierz losowe słowo z tych jeszcze nie zadanych
  const index = Math.floor(Math.random() * notAskedYet.length);
  currentWord = notAskedYet[index];
  
  // Dodaj do listy zadanych w tym cyklu
  askedInCurrentCycle.push(currentWord);

  const showPolishQuestion = document.getElementById("togglePolish").checked;
  const labelElement = document.querySelector(".label");
  
  if (showPolishQuestion) {
    // Pytanie po polsku
    document.getElementById("japanese").textContent = currentWord.pl;
    labelElement.textContent = "Znaczenie po polsku:";
    speak(currentWord.pl, "pl-PL");
  } else {
    // Pytanie po japońsku
    const displayText = currentWord.kanji || currentWord.hiragana;
    document.getElementById("japanese").textContent = displayText;
    labelElement.textContent = "Słowo po japońsku:";
    speak(currentWord.hiragana, "ja-JP");
  }
  
  document.getElementById("pronunciation").textContent =
    currentWord.romaji ? `Romaji: ${currentWord.romaji}` : "";
  document.getElementById("pronunciation").style.display = "none";
  document.getElementById("answerBox").style.display = "none";

  updateStats();
}

function showAnswer() {
  if (!currentWord) return;

  document.getElementById("hiragana").textContent = currentWord.hiragana;
  document.getElementById("romaji").textContent = currentWord.romaji;
  document.getElementById("polish").textContent = currentWord.pl;

  // Show Polish meaning in answer only when toggle is unchecked (Japanese question mode)
  const showPolishQuestion = document.getElementById("togglePolish").checked;
  document.getElementById("polishRow").style.display = showPolishQuestion ? "none" : "block";
  document.getElementById("pronunciation").style.display = "block";
  document.getElementById("answerBox").style.display = "block";

  // Odpowiedź – czytamy po japońsku
  speak(currentWord.hiragana, "ja-JP");
}

function repeatQuestion() {
  if (currentWord) {
    const showPolishQuestion = document.getElementById("togglePolish").checked;
    if (showPolishQuestion) {
      speak(currentWord.pl, "pl-PL");
    } else {
      speak(currentWord.hiragana, "ja-JP");
    }
  }
}

function repeatAnswer() {
  if (currentWord) {
    speak(currentWord.hiragana, "ja-JP");
  }
}

function markKnown() {
  if (!currentWord) return;
  
  // Dodaj do listy opanowanych
  if (!learnedWords.some(word => word.hiragana === currentWord.hiragana)) {
    learnedWords.push(currentWord);
  }
  
  // Usuń z puli do nauki
  const idx = remainingPool.findIndex(word => word.hiragana === currentWord.hiragana);
  if (idx !== -1) {
    remainingPool.splice(idx, 1);
  }
  
  // Usuń również z listy zadanych w bieżącym cyklu, jeśli tam jest
  const askedIdx = askedInCurrentCycle.findIndex(word => word.hiragana === currentWord.hiragana);
  if (askedIdx !== -1) {
    askedInCurrentCycle.splice(askedIdx, 1);
  }
  
  pickRandomWord();
}

function markUnknown() {
  if (!currentWord) return;
  // Nic nie usuwamy – dalej zostaje w puli
  pickRandomWord();
}

function resetPool() {
  remainingPool = [...words];
  askedInCurrentCycle = [];
  learnedWords = [];
  currentWord = null;
  pickRandomWord();
}

// Podpinamy eventy PO załadowaniu DOM
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);
  document.getElementById("repeatQuestionBtn").addEventListener("click", repeatQuestion);
  document.getElementById("repeatAnswerBtn").addEventListener("click", repeatAnswer);
  document.getElementById("knowBtn").addEventListener("click", markKnown);
  document.getElementById("dontKnowBtn").addEventListener("click", markUnknown);
  document.getElementById("resetBtn").addEventListener("click", resetPool);

  document.getElementById("togglePolish").addEventListener("change", () => {
    // When toggle changes, update the current question display
    if (currentWord) {
      const showPolishQuestion = document.getElementById("togglePolish").checked;
      const labelElement = document.querySelector(".label");
      
      if (showPolishQuestion) {
        document.getElementById("japanese").textContent = currentWord.pl;
        labelElement.textContent = "Znaczenie po polsku:";
      } else {
        const displayText = currentWord.kanji || currentWord.hiragana;
        document.getElementById("japanese").textContent = displayText;
        labelElement.textContent = "Słowo po japońsku:";
      }
      
      // Hide answer when switching modes
      document.getElementById("answerBox").style.display = "none";
      document.getElementById("pronunciation").style.display = "none";
    }
  });

  // Startujemy od losowego słowa
  pickRandomWord();
});
// ======================
// KONIEC PLIKU app.js
// ======================