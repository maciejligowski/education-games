// english-irregular-verbs/app.js

// ======================
// USTAWIENIA GŁOSU / TTS
// ======================

// Cache na głosy
let britishVoice = null;
let polishVoice = null;

// Ładowanie głosów, gdy tylko będą dostępne
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();

  // Brytyjski angielski – preferowany
  britishVoice =
    voices.find(v => v.lang === "en-GB") ||
    voices.find(v => v.lang.startsWith("en"));

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
      lang = "en-GB";
    }
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;

  // Wybór głosu
  if (lang.startsWith("en") && britishVoice) {
    utter.voice = britishVoice;
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

// Dane czasowników są w osobnym pliku verbs-en-irregular.js
// i dodają tablicę window.irregularVerbsEn
const verbs = window.irregularVerbsEn || [];

let currentVerb = null;
// Pula: tylko czasowniki, których jeszcze NIE oznaczyliśmy jako „umiem”
let remainingPool = [...verbs];

function updateStats() {
  const remaining = remainingPool.length;
  const total = verbs.length;
  const known = total - remaining;

  const stats = document.getElementById("statsInfo");
  stats.textContent =
    `Do nauczenia zostało: ${remaining} z ${total} | Opanowane: ${known}`;
}

function pickRandomVerb() {
  if (!verbs.length) {
    console.warn("Brak danych czasowników (verbs). Upewnij się, że verbs-en-irregular.js jest poprawnie załadowany.");
  }

  if (remainingPool.length === 0) {
    currentVerb = null;
    document.getElementById("baseForm").textContent = "Koniec puli 🎉";
    document.getElementById("phonetic").textContent = "";
    document.getElementById("answerBox").style.display = "none";
    updateStats();
    return;
  }

  const index = Math.floor(Math.random() * remainingPool.length);
  currentVerb = remainingPool[index];

  const showPolishQuestion = document.getElementById("togglePolish").checked;
  const labelElement = document.querySelector(".label");
  
  if (showPolishQuestion) {
    // Pytanie po polsku
    document.getElementById("baseForm").textContent = currentVerb.pl;
    labelElement.textContent = "Znaczenie po polsku:";
    speak(currentVerb.pl, "pl-PL");
  } else {
    // Pytanie po angielsku
    document.getElementById("baseForm").textContent = currentVerb.base;
    labelElement.textContent = "Forma podstawowa (po angielsku):";
    speak(currentVerb.base, "en-GB");
  }
  
  document.getElementById("phonetic").textContent =
    currentVerb.phon ? `Wymowa: ${currentVerb.phon}` : "";
  document.getElementById("phonetic").style.display = "none";
  document.getElementById("answerBox").style.display = "none";

  updateStats();
}

function showAnswer() {
  if (!currentVerb) return;

  document.getElementById("baseFormAnswer").textContent = currentVerb.base;
  document.getElementById("pastSimple").textContent = currentVerb.past;
  document.getElementById("pastParticiple").textContent = currentVerb.pp;
  document.getElementById("polish").textContent = currentVerb.pl;

  // Always hide Polish row in answer since we show English forms
  document.getElementById("polishRow").style.display = "none";
  document.getElementById("phonetic").style.display = "block";
  document.getElementById("answerBox").style.display = "block";

  // Odpowiedź – czytamy trzy formy po angielsku
  speak(`${currentVerb.base}, ${currentVerb.past}, ${currentVerb.pp}`, "en-GB");
}

function repeatQuestion() {
  if (currentVerb) {
    const showPolishQuestion = document.getElementById("togglePolish").checked;
    if (showPolishQuestion) {
      speak(currentVerb.pl, "pl-PL");
    } else {
      speak(currentVerb.base, "en-GB");
    }
  }
}

function repeatAnswer() {
  if (currentVerb) {
    speak(`${currentVerb.base}, ${currentVerb.past}, ${currentVerb.pp}`, "en-GB");
  }
}

function markKnown() {
  if (!currentVerb) return;
  const idx = remainingPool.indexOf(currentVerb);
  if (idx !== -1) {
    remainingPool.splice(idx, 1); // usuwamy z puli tylko jeśli „umiem”
  }
  pickRandomVerb();
}

function markUnknown() {
  if (!currentVerb) return;
  // Nic nie usuwamy – dalej zostaje w puli
  pickRandomVerb();
}

function resetPool() {
  remainingPool = [...verbs];
  currentVerb = null;
  pickRandomVerb();
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
    if (currentVerb) {
      const showPolishQuestion = document.getElementById("togglePolish").checked;
      const labelElement = document.querySelector(".label");
      
      if (showPolishQuestion) {
        document.getElementById("baseForm").textContent = currentVerb.pl;
        labelElement.textContent = "Znaczenie po polsku:";
      } else {
        document.getElementById("baseForm").textContent = currentVerb.base;
        labelElement.textContent = "Forma podstawowa (po angielsku):";
      }
      
      // Hide answer when switching modes
      document.getElementById("answerBox").style.display = "none";
      document.getElementById("phonetic").style.display = "none";
    }
  });

  // Startujemy od losowego czasownika
  pickRandomVerb();
});
// ======================
// KONIEC PLIKU app.js
// ======================   
