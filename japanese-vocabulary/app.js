// Japanese Vocabulary Learning App - Main JavaScript
class JapaneseVocabularyApp {
    constructor() {
        this.currentMode = 'menu';
        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.progress = this.loadProgress();
        this.streak = this.loadStreak();
        this.shuffledIndices = [];
        this.quizScore = 0;
        this.quizCurrentQuestion = 0;
        this.quizQuestions = [];
        this.quizAnswers = [];
        this.settings = this.loadSettings();
        
        this.initializeApp();
        this.bindEvents();
        this.updateStats();
    }

    initializeApp() {
        // Shuffle the vocabulary array for random order
        this.shuffleVocabulary();
        this.updateProgressBar();
    }

    bindEvents() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Flashcard events
        document.getElementById('back-to-menu').addEventListener('click', () => this.switchMode('menu'));
        document.getElementById('flip-btn').addEventListener('click', () => this.flipCard());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousCard());
        document.getElementById('next-btn').addEventListener('click', () => this.nextCard());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleVocabulary());

        // Difficulty buttons
        document.getElementById('hard-btn').addEventListener('click', () => this.markDifficulty('hard'));
        document.getElementById('good-btn').addEventListener('click', () => this.markDifficulty('good'));
        document.getElementById('easy-btn').addEventListener('click', () => this.markDifficulty('easy'));

        // Quiz events
        document.getElementById('quiz-back-btn').addEventListener('click', () => this.switchMode('menu'));
        document.getElementById('next-question-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('retry-quiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('back-to-main').addEventListener('click', () => this.switchMode('menu'));

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.toggleSettings());

        // Settings checkboxes
        document.getElementById('show-kanji').addEventListener('change', (e) => {
            this.settings.showKanji = e.target.checked;
            this.saveSettings();
            this.updateCardDisplay();
        });
        document.getElementById('show-hiragana').addEventListener('change', (e) => {
            this.settings.showHiragana = e.target.checked;
            this.saveSettings();
            this.updateCardDisplay();
        });
        document.getElementById('show-romaji').addEventListener('change', (e) => {
            this.settings.showRomaji = e.target.checked;
            this.saveSettings();
            this.updateCardDisplay();
        });
        document.getElementById('auto-audio').addEventListener('change', (e) => {
            this.settings.autoAudio = e.target.checked;
            this.saveSettings();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    switchMode(mode) {
        // Hide all containers
        document.querySelectorAll('.main-content > div').forEach(div => {
            div.classList.add('hidden');
        });

        this.currentMode = mode;

        switch(mode) {
            case 'menu':
                document.getElementById('mode-selection').classList.remove('hidden');
                break;
            case 'flashcards':
                document.getElementById('flashcard-container').classList.remove('hidden');
                this.loadCard();
                break;
            case 'quiz':
                this.startQuiz();
                break;
            case 'listening':
                // Future implementation
                alert('Listening mode coming soon!');
                this.switchMode('menu');
                break;
            case 'writing':
                // Future implementation
                alert('Writing mode coming soon!');
                this.switchMode('menu');
                break;
        }
    }

    shuffleVocabulary() {
        this.shuffledIndices = Array.from({length: vocabularyData.length}, (_, i) => i);
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
        }
        this.currentCardIndex = 0;
        if (this.currentMode === 'flashcards') {
            this.loadCard();
        }
    }

    loadCard() {
        if (!vocabularyData || vocabularyData.length === 0) {
            console.error('Vocabulary data not loaded');
            return;
        }

        const actualIndex = this.shuffledIndices[this.currentCardIndex];
        const word = vocabularyData[actualIndex];
        
        // Update card counter
        document.getElementById('current-card').textContent = this.currentCardIndex + 1;
        document.getElementById('total-cards').textContent = vocabularyData.length;

        // Reset card state
        this.isFlipped = false;
        document.getElementById('english-text').classList.add('hidden');
        document.getElementById('flip-btn').textContent = 'Show Answer';

        this.updateCardDisplay();
    }

    updateCardDisplay() {
        const actualIndex = this.shuffledIndices[this.currentCardIndex];
        const word = vocabularyData[actualIndex];

        // Update Japanese text based on settings
        document.getElementById('kanji').textContent = word.kanji || word.hiragana;
        document.getElementById('kanji').style.display = this.settings.showKanji && word.kanji ? 'block' : 'none';
        
        document.getElementById('hiragana').textContent = word.hiragana;
        document.getElementById('hiragana').style.display = this.settings.showHiragana ? 'block' : 'none';
        
        document.getElementById('romaji').textContent = word.romaji;
        document.getElementById('romaji').style.display = this.settings.showRomaji ? 'block' : 'none';

        // Update English text
        document.getElementById('translation').textContent = word.english;
        document.getElementById('example').textContent = word.example || `Example: ${word.english} is important to learn.`;

        // Auto-play audio if enabled
        if (this.settings.autoAudio && 'speechSynthesis' in window) {
            this.speakJapanese(word.hiragana);
        }
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        const englishText = document.getElementById('english-text');
        const flipBtn = document.getElementById('flip-btn');

        if (this.isFlipped) {
            englishText.classList.remove('hidden');
            flipBtn.textContent = 'Hide Answer';
        } else {
            englishText.classList.add('hidden');
            flipBtn.textContent = 'Show Answer';
        }
    }

    nextCard() {
        this.currentCardIndex = (this.currentCardIndex + 1) % this.shuffledIndices.length;
        this.loadCard();
    }

    previousCard() {
        this.currentCardIndex = this.currentCardIndex > 0 ? this.currentCardIndex - 1 : this.shuffledIndices.length - 1;
        this.loadCard();
    }

    markDifficulty(level) {
        const actualIndex = this.shuffledIndices[this.currentCardIndex];
        
        // Update progress based on difficulty
        if (!this.progress.includes(actualIndex)) {
            this.progress.push(actualIndex);
            this.updateStreak(true);
        }

        // Save progress
        this.saveProgress();
        this.updateStats();
        this.updateProgressBar();

        // Move to next card automatically
        setTimeout(() => {
            this.nextCard();
        }, 500);
    }

    startQuiz() {
        document.getElementById('quiz-container').classList.remove('hidden');
        document.getElementById('results-container').classList.add('hidden');
        
        this.quizScore = 0;
        this.quizCurrentQuestion = 0;
        this.quizAnswers = [];
        
        // Generate 10 random questions
        this.generateQuizQuestions();
        this.showQuestion();
    }

    generateQuizQuestions() {
        this.quizQuestions = [];
        const usedIndices = new Set();
        
        while (this.quizQuestions.length < 10 && usedIndices.size < vocabularyData.length) {
            const randomIndex = Math.floor(Math.random() * vocabularyData.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                this.quizQuestions.push(randomIndex);
            }
        }
    }

    showQuestion() {
        if (this.quizCurrentQuestion >= this.quizQuestions.length) {
            this.showResults();
            return;
        }

        const questionIndex = this.quizQuestions[this.quizCurrentQuestion];
        const correctWord = vocabularyData[questionIndex];
        
        // Update question display
        document.getElementById('quiz-current').textContent = this.quizCurrentQuestion + 1;
        document.getElementById('quiz-total').textContent = this.quizQuestions.length;
        document.getElementById('quiz-score').textContent = this.quizScore;
        document.getElementById('quiz-japanese').textContent = correctWord.kanji || correctWord.hiragana;

        // Generate options
        const options = this.generateOptions(correctWord.english, questionIndex);
        this.displayOptions(options);

        // Hide feedback
        document.getElementById('quiz-feedback').classList.add('hidden');
    }

    generateOptions(correctAnswer, correctIndex) {
        const options = [correctAnswer];
        const usedIndices = new Set([correctIndex]);
        
        while (options.length < 4) {
            const randomIndex = Math.floor(Math.random() * vocabularyData.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                options.push(vocabularyData[randomIndex].english);
            }
        }
        
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        return options;
    }

    displayOptions(options) {
        const container = document.getElementById('quiz-options');
        container.innerHTML = '';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.textContent = option;
            button.addEventListener('click', () => this.selectAnswer(option, button));
            container.appendChild(button);
        });
    }

    selectAnswer(selectedAnswer, buttonElement) {
        const questionIndex = this.quizQuestions[this.quizCurrentQuestion];
        const correctAnswer = vocabularyData[questionIndex].english;
        const isCorrect = selectedAnswer === correctAnswer;
        
        // Disable all options
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn === buttonElement && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // Update score and answers
        if (isCorrect) {
            this.quizScore++;
            this.updateStreak(true);
        } else {
            this.updateStreak(false);
        }
        
        this.quizAnswers.push({
            question: vocabularyData[questionIndex],
            selected: selectedAnswer,
            correct: correctAnswer,
            isCorrect: isCorrect
        });

        // Show feedback
        const feedbackText = document.getElementById('feedback-text');
        feedbackText.textContent = isCorrect ? 'Correct! 🎉' : `Incorrect. The answer is: ${correctAnswer}`;
        feedbackText.className = `feedback-text ${isCorrect ? 'correct' : 'incorrect'}`;
        document.getElementById('quiz-feedback').classList.remove('hidden');
    }

    nextQuestion() {
        this.quizCurrentQuestion++;
        this.showQuestion();
    }

    showResults() {
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('results-container').classList.remove('hidden');
        
        const accuracy = Math.round((this.quizScore / this.quizQuestions.length) * 100);
        const correctAnswers = this.quizScore;
        const wrongAnswers = this.quizQuestions.length - this.quizScore;
        
        document.getElementById('final-score').textContent = this.quizScore;
        document.getElementById('correct-answers').textContent = correctAnswers;
        document.getElementById('wrong-answers').textContent = wrongAnswers;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        
        this.updateStats();
    }

    updateStats() {
        document.getElementById('progress-count').textContent = this.progress.length;
        document.getElementById('streak-count').textContent = this.streak;
    }

    updateProgressBar() {
        const percentage = (this.progress.length / vocabularyData.length) * 100;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
    }

    updateStreak(correct) {
        if (correct) {
            this.streak++;
        } else {
            this.streak = 0;
        }
        this.saveStreak();
        this.updateStats();
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('active');
        
        // Update settings display
        document.getElementById('show-kanji').checked = this.settings.showKanji;
        document.getElementById('show-hiragana').checked = this.settings.showHiragana;
        document.getElementById('show-romaji').checked = this.settings.showRomaji;
        document.getElementById('auto-audio').checked = this.settings.autoAudio;
    }

    speakJapanese(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    handleKeyboard(e) {
        if (this.currentMode === 'flashcards') {
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'ArrowRight':
                case 'n':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case 'ArrowLeft':
                case 'p':
                    e.preventDefault();
                    this.previousCard();
                    break;
                case '1':
                    e.preventDefault();
                    this.markDifficulty('hard');
                    break;
                case '2':
                    e.preventDefault();
                    this.markDifficulty('good');
                    break;
                case '3':
                    e.preventDefault();
                    this.markDifficulty('easy');
                    break;
            }
        }
    }

    // Local Storage Methods
    loadProgress() {
        const saved = localStorage.getItem('japanese-vocab-progress');
        return saved ? JSON.parse(saved) : [];
    }

    saveProgress() {
        localStorage.setItem('japanese-vocab-progress', JSON.stringify(this.progress));
    }

    loadStreak() {
        const saved = localStorage.getItem('japanese-vocab-streak');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveStreak() {
        localStorage.setItem('japanese-vocab-streak', this.streak.toString());
    }

    loadSettings() {
        const saved = localStorage.getItem('japanese-vocab-settings');
        const defaultSettings = {
            showKanji: true,
            showHiragana: true,
            showRomaji: true,
            autoAudio: false
        };
        return saved ? Object.assign(defaultSettings, JSON.parse(saved)) : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('japanese-vocab-settings', JSON.stringify(this.settings));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if vocabulary data is loaded
    if (typeof vocabularyData === 'undefined') {
        console.error('Vocabulary data not loaded. Make sure vocabulary-data.js is included.');
        return;
    }
    
    new JapaneseVocabularyApp();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}