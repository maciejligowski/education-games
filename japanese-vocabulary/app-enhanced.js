// Enhanced Japanese Vocabulary Learning App
// Multiple question modes, voice control, and category filtering

// ======================
// TTS VOICE SETUP
// ======================
let japaneseVoice = null;
let polishVoice = null;
let voicesLoaded = false;

function initializeVoices() {
  const voices = window.speechSynthesis.getVoices();
  console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  
  // Find Japanese voice
  japaneseVoice =
    voices.find(v => v.lang === "ja-JP") ||
    voices.find(v => v.lang.startsWith("ja")) ||
    voices.find(v => v.name.toLowerCase().includes("japan")) ||
    voices.find(v => v.name.toLowerCase().includes("jp"));
  
  // Find Polish voice
  polishVoice =
    voices.find(v => v.lang === "pl-PL") ||
    voices.find(v => v.lang.startsWith("pl")) ||
    voices.find(v => v.name.toLowerCase().includes("polish"));
  
  console.log('Selected Japanese voice:', japaneseVoice?.name || 'None');
  console.log('Selected Polish voice:', polishVoice?.name || 'None');
  
  voicesLoaded = true;
}

// Initialize voices when they're available
if (window.speechSynthesis.getVoices().length > 0) {
  initializeVoices();
}
window.speechSynthesis.onvoiceschanged = initializeVoices;

function speak(text, lang, enabled = true) {
  if (!enabled || !("speechSynthesis" in window)) {
    console.log('Speech disabled or not available');
    return;
  }

  if (!lang) {
    lang = /[ąćęłńóśźż]/i.test(text) ? "pl-PL" : "ja-JP";
  }

  console.log(`Speaking: "${text}" in language: ${lang}`);

  // Ensure voices are loaded
  if (!voicesLoaded) {
    initializeVoices();
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;

  // Set voice based on language
  if (lang.startsWith("ja")) {
    if (japaneseVoice) {
      utter.voice = japaneseVoice;
      console.log('Using Japanese voice:', japaneseVoice.name);
    } else {
      console.log('No Japanese voice found, using default');
    }
  }
  if (lang.startsWith("pl")) {
    if (polishVoice) {
      utter.voice = polishVoice;
      console.log('Using Polish voice:', polishVoice.name);
    } else {
      console.log('No Polish voice found, using default');
    }
  }

  utter.rate = 0.8;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  utter.onstart = () => console.log('Speech started');
  utter.onend = () => console.log('Speech ended');
  utter.onerror = (e) => console.error('Speech error:', e);

  window.speechSynthesis.speak(utter);
}

// ======================
// ENHANCED APP LOGIC
// ======================

// Global app state
let appState = {
  currentWord: null,
  filteredVocabulary: [],
  remainingPool: [],
  askedInCurrentCycle: [],
  learnedWords: [],
  questionMode: 'polish', // polish, hiragana, kanji
  voiceEnabled: true,
  selectedCategory: 'all'
};

// Get vocabulary data
const allWords = window.vocabularyJp || [];
console.log('Loaded vocabulary:', allWords.length, 'words');
console.log('Loaded vocabulary:', allWords.length, 'words');

// Category mapping for filtering
function getCategoryDisplayName(category) {
  const categoryNames = {
    'all': 'Wszystkie kategorie',
    'numbers': 'Liczby',
    'greetings': 'Powitania',
    'pronouns': 'Zaimki',
    'basic': 'Podstawowe',
    'family': 'Rodzina',
    'time': 'Czas',
    'people': 'Ludzie',
    'occupations': 'Zawody',
    'body': 'Ciało',
    'animals': 'Zwierzęta',
    'plants': 'Rośliny',
    'food': 'Jedzenie',
    'drink': 'Napoje',
    'weather': 'Pogoda',
    'colors': 'Kolory',
    'directions': 'Kierunki',
    'home': 'Dom',
    'clothes': 'Ubrania',
    'transport': 'Transport',
    'language': 'Język',
    'adjectives': 'Przymiotniki',
    'verbs': 'Czasowniki'
  };
  return categoryNames[category] || category;
}

function filterVocabulary() {
  if (appState.selectedCategory === 'all') {
    appState.filteredVocabulary = [...allWords];
  } else {
    appState.filteredVocabulary = allWords.filter(word => 
      word.category === appState.selectedCategory
    );
  }
  
  // Reset learning progress for new category
  appState.remainingPool = [...appState.filteredVocabulary];
  appState.askedInCurrentCycle = [];
  // Reset learned words to only include words from current category
  appState.learnedWords = appState.learnedWords.filter(word =>
    appState.filteredVocabulary.some(fWord => fWord.hiragana === word.hiragana)
  );
}

function updateStats() {
  const totalLearning = appState.remainingPool.length;
  const askedThisCycle = appState.askedInCurrentCycle.length;
  const totalLearned = appState.learnedWords.length;
  const totalWords = appState.filteredVocabulary.length;

  const stats = document.getElementById("statsInfo");
  const categoryName = getCategoryDisplayName(appState.selectedCategory);
  stats.textContent = 
    `${categoryName} | Cykl: ${askedThisCycle}/${totalLearning} | Opanowane: ${totalLearned}/${totalWords}`;
}

function updateQuestionLabel() {
  const labelElement = document.getElementById("questionLabel");
  const questionModeNames = {
    'polish': 'Znaczenie po polsku:',
    'hiragana': 'Słowo hiragana:',
    'kanji': 'Słowo kanji:'
  };
  labelElement.textContent = questionModeNames[appState.questionMode] || 'Pytanie:';
}

function displayQuestion() {
  if (!appState.currentWord) return;

  const questionElement = document.getElementById("questionText");
  let questionText = '';
  let speechText = '';
  let speechLang = '';

  switch (appState.questionMode) {
    case 'polish':
      questionText = appState.currentWord.pl;
      speechText = appState.currentWord.pl;
      speechLang = 'pl-PL';
      break;
    case 'hiragana':
      questionText = appState.currentWord.hiragana;
      speechText = appState.currentWord.hiragana;
      speechLang = 'ja-JP';
      break;
    case 'kanji':
      questionText = appState.currentWord.kanji || appState.currentWord.hiragana;
      speechText = appState.currentWord.hiragana; // Always pronounce hiragana
      speechLang = 'ja-JP';
      break;
  }

  questionElement.textContent = questionText;
  updateQuestionLabel();
  
  // Speak the question
  speak(speechText, speechLang, appState.voiceEnabled);
  
  // Hide answer initially
  document.getElementById("answerBox").style.display = "none";
  document.getElementById("pronunciation").style.display = "none";
}

function pickRandomWord() {
  console.log('pickRandomWord called, remaining pool size:', appState.remainingPool.length);
  if (appState.remainingPool.length === 0) {
    appState.currentWord = null;
    document.getElementById("questionText").textContent = "Wszystkie słowa opanowane! 🎉";
    document.getElementById("pronunciation").textContent = "";
    document.getElementById("answerBox").style.display = "none";
    updateStats();
    return;
  }

  // Check if all words in current pool have been asked
  const notAskedYet = appState.remainingPool.filter(word => 
    !appState.askedInCurrentCycle.some(asked => asked.hiragana === word.hiragana)
  );

  if (notAskedYet.length === 0) {
    // End of cycle - reset asked list
    appState.askedInCurrentCycle = [];
    document.getElementById("questionText").textContent = "Cykl zakończony! Rozpoczynam nowy...";
    document.getElementById("pronunciation").textContent = "";
    document.getElementById("answerBox").style.display = "none";
    updateStats();
    
    setTimeout(() => {
      pickRandomWord();
    }, 2000);
    return;
  }

  // Pick random word from not asked yet
  const index = Math.floor(Math.random() * notAskedYet.length);
  appState.currentWord = notAskedYet[index];
  
  // Add to asked in current cycle
  appState.askedInCurrentCycle.push(appState.currentWord);

  displayQuestion();
  updateStats();
}

function showAnswer() {
  if (!appState.currentWord) return;

  const word = appState.currentWord;

  // Update answer elements
  document.getElementById("kanji").textContent = word.kanji || "—";
  document.getElementById("hiragana").textContent = word.hiragana;
  document.getElementById("romaji").textContent = word.romaji;
  document.getElementById("polish").textContent = word.pl;
  document.getElementById("category").textContent = getCategoryDisplayName(word.category);

  // Show/hide answer rows based on question mode
  const kanjiRow = document.getElementById("kanjiRow");
  const hiraganaRow = document.getElementById("hiraganaRow");
  const romajiRow = document.getElementById("romajiRow");
  const polishRow = document.getElementById("polishRow");

  // Always show category
  document.getElementById("categoryRow").style.display = "block";

  switch (appState.questionMode) {
    case 'polish':
      // Question was in Polish, show Japanese answer
      kanjiRow.style.display = word.kanji ? "block" : "none";
      hiraganaRow.style.display = "block";
      romajiRow.style.display = "block";
      polishRow.style.display = "none"; // Don't repeat the question
      break;
    case 'hiragana':
      // Question was hiragana, show Polish answer primarily
      kanjiRow.style.display = word.kanji ? "block" : "none";
      hiraganaRow.style.display = "none"; // Don't repeat the question
      romajiRow.style.display = "block";
      polishRow.style.display = "block";
      break;
    case 'kanji':
      // Question was kanji, show Polish answer primarily
      kanjiRow.style.display = "none"; // Don't repeat the question
      hiraganaRow.style.display = "block";
      romajiRow.style.display = "block";
      polishRow.style.display = "block";
      break;
  }

  document.getElementById("pronunciation").style.display = "block";
  document.getElementById("answerBox").style.display = "block";

  // Speak the answer (always Japanese pronunciation)
  speak(word.hiragana, "ja-JP", appState.voiceEnabled);
}

function repeatQuestion() {
  if (appState.currentWord) {
    let speechText = '';
    let speechLang = '';

    switch (appState.questionMode) {
      case 'polish':
        speechText = appState.currentWord.pl;
        speechLang = 'pl-PL';
        break;
      case 'hiragana':
      case 'kanji':
        speechText = appState.currentWord.hiragana;
        speechLang = 'ja-JP';
        break;
    }

    speak(speechText, speechLang, appState.voiceEnabled);
  }
}

function repeatAnswer() {
  if (appState.currentWord) {
    speak(appState.currentWord.hiragana, "ja-JP", appState.voiceEnabled);
  }
}

function markKnown() {
  if (!appState.currentWord) return;
  
  // Add to learned words
  if (!appState.learnedWords.some(word => word.hiragana === appState.currentWord.hiragana)) {
    appState.learnedWords.push(appState.currentWord);
  }
  
  // Remove from remaining pool
  const idx = appState.remainingPool.findIndex(word => word.hiragana === appState.currentWord.hiragana);
  if (idx !== -1) {
    appState.remainingPool.splice(idx, 1);
  }
  
  // Remove from asked in current cycle
  const askedIdx = appState.askedInCurrentCycle.findIndex(word => word.hiragana === appState.currentWord.hiragana);
  if (askedIdx !== -1) {
    appState.askedInCurrentCycle.splice(askedIdx, 1);
  }
  
  pickRandomWord();
}

function markUnknown() {
  if (!appState.currentWord) return;
  // Keep in pool, just pick next word
  pickRandomWord();
}

function resetPool() {
  filterVocabulary(); // This resets the pools
  appState.learnedWords = [];
  appState.currentWord = null;
  pickRandomWord();
}

// Event handlers for controls
function handleQuestionModeChange() {
  const select = document.getElementById("questionMode");
  appState.questionMode = select.value;
  if (appState.currentWord) {
    displayQuestion();
  }
}

function handleVoiceToggle() {
  const checkbox = document.getElementById("enableVoice");
  appState.voiceEnabled = checkbox.checked;
}

function handleCategoryChange() {
  const select = document.getElementById("categoryFilter");
  appState.selectedCategory = select.value;
  filterVocabulary();
  appState.currentWord = null;
  pickRandomWord();
}

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing app...');
  // Bind control events
  document.getElementById("questionMode").addEventListener("change", handleQuestionModeChange);
  document.getElementById("enableVoice").addEventListener("change", handleVoiceToggle);
  document.getElementById("categoryFilter").addEventListener("change", handleCategoryChange);
  
  // Bind action buttons
  document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);
  document.getElementById("repeatQuestionBtn").addEventListener("click", repeatQuestion);
  document.getElementById("repeatAnswerBtn").addEventListener("click", repeatAnswer);
  document.getElementById("knowBtn").addEventListener("click", markKnown);
  document.getElementById("dontKnowBtn").addEventListener("click", markUnknown);
  document.getElementById("resetBtn").addEventListener("click", resetPool);

  // Initialize app state
  filterVocabulary();
  pickRandomWord();
});