// english-irregular-verbs/app.js

// korzystamy z danych z verbs-en-irregular.js:
const verbs = window.irregularVerbsEn;

let currentVerb = null;
let remainingPool = [...verbs];

function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window)) {
    alert("Twoja przeglądarka nie obsługuje mowy (speechSynthesis). Spróbuj w Chrome lub Edge.");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

function updateStats() {
  const remaining = remainingPool.length;
  const total = verbs.length;
  const known = total - remaining;

  const stats = document.getElementById("statsInfo");
  stats.textContent =
    `Do nauczenia zostało: ${remaining} z ${total} | Opanowane: ${known}`;
}

function pickRandomVerb() {
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

  document.getElementById("baseForm").textContent = currentVerb.base;
  document.getElementById("phonetic").textContent =
    currentVerb.phon ? `Wymowa: ${currentVerb.phon}` : "";
  document.getElementById("answerBox").style.display = "none";

  speak(currentVerb.base, "en-US");
  updateStats();
}

function showAnswer() {
  if (!currentVerb) return;

  document.getElementById("pastSimple").textContent = currentVerb.past;
  document.getElementById("pastParticiple").textContent = currentVerb.pp;
  document.getElementById("polish").textContent = currentVerb.pl;

  const showPL = document.getElementById("togglePolish").checked;
  document.getElementById("polishRow").style.display = showPL ? "block" : "none";
  document.getElementById("answerBox").style.display = "block";

  speak(`${currentVerb.base}, ${currentVerb.past}, ${currentVerb.pp}`, "en-US");
}

function repeatQuestion() {
  if (currentVerb) speak(currentVerb.base, "en-US");
}

function repeatAnswer() {
  if (currentVerb) speak(`${currentVerb.base}, ${currentVerb.past}, ${currentVerb.pp}`, "en-US");
}

function markKnown() {
  if (!currentVerb) return;
  const idx = remainingPool.indexOf(currentVerb);
  if (idx !== -1) {
    remainingPool.splice(idx, 1);
  }
  pickRandomVerb();
}

function markUnknown() {
  if (!currentVerb) return;
  pickRandomVerb();
}

function resetPool() {
  remainingPool = [...verbs];
  currentVerb = null;
  pickRandomVerb();
}

// Start gry i eventy
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("showAnswerBtn").addEventListener("click", showAnswer);
  document.getElementById("repeatQuestionBtn").addEventListener("click", repeatQuestion);
  document.getElementById("repeatAnswerBtn").addEventListener("click", repeatAnswer);
  document.getElementById("knowBtn").addEventListener("click", markKnown);
  document.getElementById("dontKnowBtn").addEventListener("click", markUnknown);
  document.getElementById("resetBtn").addEventListener("click", resetPool);

  document.getElementById("togglePolish").addEventListener("change", () => {
    const showPL = document.getElementById("togglePolish").checked;
    document.getElementById("polishRow").style.display = showPL ? "block" : "none";
  });

  pickRandomVerb();
});
