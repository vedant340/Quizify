// Quiz Application JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
const state = {
    quizzes: [],
    currentQuiz: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    timeRemaining: 0,
    timerInterval: null,
    startTime: null,
    userName: ''
};

// DOM Elements
const elements = {
    pages: document.querySelectorAll('.page'),
    navLinks: document.querySelectorAll('.nav-link'),
    quizzesGrid: document.getElementById('quizzes-grid'),
    categoryFilter: document.getElementById('category-filter'),
    difficultyFilter: document.getElementById('difficulty-filter'),
    searchInput: document.getElementById('search-input'),
    noResults: document.getElementById('no-results'),
    totalQuizzes: document.getElementById('total-quizzes'),
    totalAttempts: document.getElementById('total-attempts'),
    loadingOverlay: document.getElementById('loading-overlay')
};

// Initialize App
async function init() {
    setupEventListeners();
    await loadQuizzes();
    await loadCategories();
    updateStats();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Filters
    elements.categoryFilter.addEventListener('change', filterQuizzes);
    elements.difficultyFilter.addEventListener('change', filterQuizzes);
    elements.searchInput.addEventListener('input', filterQuizzes);

    // Quiz controls
    document.getElementById('back-to-home')?.addEventListener('click', () => navigateToPage('home'));
    document.getElementById('start-quiz-btn')?.addEventListener('click', startQuiz);
    document.getElementById('next-question')?.addEventListener('click', nextQuestion);
    document.getElementById('prev-question')?.addEventListener('click', previousQuestion);
    document.getElementById('submit-quiz')?.addEventListener('click', submitQuiz);
    document.getElementById('view-answers-btn')?.addEventListener('click', toggleDetailedResults);
    document.getElementById('retry-quiz-btn')?.addEventListener('click', retryQuiz);
    document.getElementById('back-home-btn')?.addEventListener('click', () => navigateToPage('home'));

    // Create quiz
    document.getElementById('add-question-btn')?.addEventListener('click', addQuestionToForm);
    document.getElementById('create-quiz-form')?.addEventListener('submit', handleCreateQuiz);
    document.getElementById('leaderboard-quiz-filter')?.addEventListener('change', loadLeaderboard);
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.target.dataset.page;
    navigateToPage(page);
}

function navigateToPage(page) {
    // Update nav links
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Update pages
    elements.pages.forEach(p => {
        p.classList.toggle('active', p.id === `${page}-page`);
    });

    // Load page-specific data
    if (page === 'leaderboard') {
        loadLeaderboard();
    } else if (page === 'create') {
        initializeCreateForm();
    }
}

// API Functions
async function loadQuizzes() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`);
        state.quizzes = await response.json();
        renderQuizzes(state.quizzes);
    } catch (error) {
        console.error('Error loading quizzes:', error);
        showNotification('Failed to load quizzes', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        
        elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            elements.categoryFilter.appendChild(option);
        });

        // Also populate leaderboard filter
        const leaderboardFilter = document.getElementById('leaderboard-quiz-filter');
        if (leaderboardFilter) {
            leaderboardFilter.innerHTML = '<option value="">All Quizzes</option>';
            state.quizzes.forEach(quiz => {
                const option = document.createElement('option');
                option.value = quiz.id;
                option.textContent = quiz.title;
                leaderboardFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadQuiz(quizId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
        state.currentQuiz = await response.json();
        
        // Initialize quiz state
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        state.timeRemaining = state.currentQuiz.timeLimit;
        state.userName = '';
        
        // Show quiz page
        navigateToPage('quiz');
        renderQuizStart();
    } catch (error) {
        console.error('Error loading quiz:', error);
        showNotification('Failed to load quiz', 'error');
    } finally {
        hideLoading();
    }
}

// Render Functions
function renderQuizzes(quizzes) {
    elements.quizzesGrid.innerHTML = '';
    
    if (quizzes.length === 0) {
        elements.noResults.style.display = 'block';
        return;
    }
    
    elements.noResults.style.display = 'none';
    
    quizzes.forEach((quiz, index) => {
        const card = createQuizCard(quiz, index);
        elements.quizzesGrid.appendChild(card);
    });
}

function createQuizCard(quiz, index) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const difficultyBadge = `<span class="quiz-badge ${quiz.difficulty}">${quiz.difficulty}</span>`;
    
    card.innerHTML = `
        ${difficultyBadge}
        <h3 class="quiz-card-title">${quiz.title}</h3>
        <p class="quiz-card-description">${quiz.description}</p>
        <div class="quiz-card-meta">
            <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${Math.floor(quiz.timeLimit / 60)} min
            </div>
            <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                ${quiz.questionCount} questions
            </div>
        </div>
        <div class="quiz-card-footer">
            <span class="category-tag">${quiz.category}</span>
            <button class="btn btn-primary" onclick="loadQuiz(${quiz.id})">
                Start Quiz
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    `;
    
    return card;
}

function renderQuizStart() {
    document.getElementById('quiz-title').textContent = state.currentQuiz.title;
    document.getElementById('quiz-description').textContent = state.currentQuiz.description;
    document.getElementById('time-limit-display').textContent = `${Math.floor(state.currentQuiz.timeLimit / 60)} minutes`;
    document.getElementById('questions-count').textContent = state.currentQuiz.questions.length;
    document.getElementById('passing-score-display').textContent = state.currentQuiz.passingScore;
    document.getElementById('total-questions').textContent = state.currentQuiz.questions.length;
    
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('question-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
}

function renderQuestion() {
    const question = state.currentQuiz.questions[state.currentQuestionIndex];
    const isLastQuestion = state.currentQuestionIndex === state.currentQuiz.questions.length - 1;
    
    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuiz.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-question').textContent = state.currentQuestionIndex + 1;
    document.getElementById('question-num').textContent = state.currentQuestionIndex + 1;
    
    // Update question
    document.getElementById('question-text').textContent = question.question;
    
    // Render options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        // Check if this option was previously selected
        const previousAnswer = state.userAnswers.find(a => a.questionId === question.id);
        if (previousAnswer && previousAnswer.answer === index) {
            optionDiv.classList.add('selected');
        }
        
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        
        optionDiv.innerHTML = `
            <div class="option-label">
                <span class="option-letter">${letter}</span>
                <span>${option}</span>
            </div>
        `;
        
        optionDiv.addEventListener('click', () => selectOption(question.id, index, optionDiv));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prev-question').style.display = state.currentQuestionIndex > 0 ? 'inline-flex' : 'none';
    document.getElementById('next-question').style.display = !isLastQuestion ? 'inline-flex' : 'none';
    document.getElementById('submit-quiz').style.display = isLastQuestion ? 'inline-flex' : 'none';
    
    // Enable/disable next button based on answer
    const hasAnswer = state.userAnswers.some(a => a.questionId === question.id);
    document.getElementById('next-question').disabled = !hasAnswer;
    document.getElementById('submit-quiz').disabled = !hasAnswer;
}

function selectOption(questionId, answerIndex, optionElement) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection
    optionElement.classList.add('selected');
    
    // Update answer
    const existingAnswerIndex = state.userAnswers.findIndex(a => a.questionId === questionId);
    if (existingAnswerIndex >= 0) {
        state.userAnswers[existingAnswerIndex].answer = answerIndex;
    } else {
        state.userAnswers.push({ questionId, answer: answerIndex });
    }
    
    // Enable next/submit button
    const isLastQuestion = state.currentQuestionIndex === state.currentQuiz.questions.length - 1;
    if (isLastQuestion) {
        document.getElementById('submit-quiz').disabled = false;
    } else {
        document.getElementById('next-question').disabled = false;
    }
}

function renderResults(results) {
    // Hide question screen, show results
    document.getElementById('question-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    
    // Stop timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    // Calculate time taken
    const timeSpent = state.currentQuiz.timeLimit - state.timeRemaining;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    // Update results
    const passed = results.passed;
    const emoji = passed ? '🎉' : '💪';
    const title = passed ? 'Congratulations!' : 'Keep Practicing!';
    
    document.getElementById('results-badge').textContent = emoji;
    document.getElementById('results-title').textContent = title;
    document.getElementById('score-percentage').textContent = Math.round(results.score);
    document.getElementById('correct-count').textContent = results.correctAnswers;
    document.getElementById('incorrect-count').textContent = results.totalQuestions - results.correctAnswers;
    document.getElementById('time-taken').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Animate score circle
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (results.score / 100) * circumference;
    
    setTimeout(() => {
        const scoreRing = document.getElementById('score-ring-progress');
        if (scoreRing) {
            scoreRing.style.strokeDashoffset = offset;
            
            // Add gradient definition
            if (!document.getElementById('scoreGradient')) {
                const svg = scoreRing.closest('svg');
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                defs.innerHTML = `
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#00D9FF;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
                    </linearGradient>
                `;
                svg.insertBefore(defs, svg.firstChild);
            }
        }
    }, 100);
    
    // Render detailed answers
    renderDetailedAnswers(results.results);
}

function renderDetailedAnswers(results) {
    const answersReview = document.getElementById('answers-review');
    answersReview.innerHTML = '';
    
    results.forEach((result, index) => {
        const answerItem = document.createElement('div');
        answerItem.className = `answer-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
        
        const userAnswerText = result.userAnswer !== null 
            ? state.currentQuiz.questions[index].options[result.userAnswer]
            : 'Not answered';
        const correctAnswerText = state.currentQuiz.questions[index].options[result.correctAnswer];
        
        answerItem.innerHTML = `
            <div class="answer-question">
                <strong>Question ${index + 1}:</strong> ${result.question}
            </div>
            <div class="answer-options">
                <div style="color: ${result.isCorrect ? 'var(--color-success)' : 'var(--color-error)'}">
                    <strong>Your answer:</strong> ${userAnswerText}
                </div>
                ${!result.isCorrect ? `
                    <div style="color: var(--color-success)">
                        <strong>Correct answer:</strong> ${correctAnswerText}
                    </div>
                ` : ''}
            </div>
            ${result.explanation ? `
                <div class="answer-explanation">
                    <strong>💡 Explanation:</strong> ${result.explanation}
                </div>
            ` : ''}
        `;
        
        answersReview.appendChild(answerItem);
    });
}

// Quiz Control Functions
function startQuiz() {
    const userName = document.getElementById('user-name-input').value.trim();
    state.userName = userName || 'Anonymous';
    state.startTime = Date.now();
    
    // Show question screen
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('question-screen').style.display = 'block';
    
    // Start timer
    startTimer();
    
    // Render first question
    renderQuestion();
}

function startTimer() {
    updateTimerDisplay();
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        if (state.timeRemaining <= 0) {
            clearInterval(state.timerInterval);
            submitQuiz();
        }
        
        // Warning at 1 minute
        if (state.timeRemaining === 60) {
            document.getElementById('timer').classList.add('warning');
            showNotification('Only 1 minute remaining!', 'warning');
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    document.getElementById('time-remaining').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function nextQuestion() {
    if (state.currentQuestionIndex < state.currentQuiz.questions.length - 1) {
        state.currentQuestionIndex++;
        renderQuestion();
    }
}

function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderQuestion();
    }
}

async function submitQuiz() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    const timeSpent = state.currentQuiz.timeLimit - state.timeRemaining;
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${state.currentQuiz.id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: state.userAnswers,
                userName: state.userName,
                timeSpent
            })
        });
        
        const results = await response.json();
        renderResults(results);
        updateStats();
    } catch (error) {
        console.error('Error submitting quiz:', error);
        showNotification('Failed to submit quiz', 'error');
    } finally {
        hideLoading();
    }
}

function toggleDetailedResults() {
    const detailedResults = document.getElementById('detailed-results');
    const button = document.getElementById('view-answers-btn');
    
    if (detailedResults.style.display === 'none' || !detailedResults.style.display) {
        detailedResults.style.display = 'block';
        button.textContent = 'Hide Detailed Results';
    } else {
        detailedResults.style.display = 'none';
        button.textContent = 'View Detailed Results';
    }
}

function retryQuiz() {
    loadQuiz(state.currentQuiz.id);
}

// Leaderboard
async function loadLeaderboard() {
    const quizId = document.getElementById('leaderboard-quiz-filter')?.value;
    const url = quizId ? `${API_BASE_URL}/leaderboard?quizId=${quizId}` : `${API_BASE_URL}/leaderboard`;
    
    showLoading();
    try {
        const response = await fetch(url);
        const leaderboard = await response.json();
        renderLeaderboard(leaderboard);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showNotification('Failed to load leaderboard', 'error');
    } finally {
        hideLoading();
    }
}

function renderLeaderboard(leaderboard) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    const noLeaderboard = document.getElementById('no-leaderboard');
    
    leaderboardBody.innerHTML = '';
    
    if (leaderboard.length === 0) {
        noLeaderboard.style.display = 'block';
        return;
    }
    
    noLeaderboard.style.display = 'none';
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        const rank = index + 1;
        const rankClass = rank <= 3 ? `top-${rank}` : '';
        const date = new Date(entry.completedAt).toLocaleDateString();
        
        row.innerHTML = `
            <div class="table-cell">
                <span class="rank ${rankClass}">${rank}</span>
            </div>
            <div class="table-cell">${entry.userName}</div>
            <div class="table-cell">${entry.quizTitle}</div>
            <div class="table-cell">
                <strong style="color: var(--color-accent-primary)">${Math.round(entry.score)}%</strong>
            </div>
            <div class="table-cell">${date}</div>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Create Quiz
function initializeCreateForm() {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '';
    addQuestionToForm(); // Add first question
}

function addQuestionToForm() {
    const questionsContainer = document.getElementById('questions-container');
    const questionNumber = questionsContainer.children.length + 1;
    
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.innerHTML = `
        <div class="question-item-header">
            <span class="question-item-title">Question ${questionNumber}</span>
            <button type="button" class="remove-question-btn" onclick="removeQuestion(this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="form-group full-width">
            <label>Question Text *</label>
            <input type="text" class="form-input question-text" placeholder="Enter your question" required>
        </div>
        <div class="form-group full-width">
            <label>Options *</label>
            <div class="options-list">
                <div class="option-input-group">
                    <input type="radio" name="correct-${questionNumber}" value="0" required>
                    <input type="text" class="form-input option-text" placeholder="Option A" required>
                </div>
                <div class="option-input-group">
                    <input type="radio" name="correct-${questionNumber}" value="1" required>
                    <input type="text" class="form-input option-text" placeholder="Option B" required>
                </div>
                <div class="option-input-group">
                    <input type="radio" name="correct-${questionNumber}" value="2" required>
                    <input type="text" class="form-input option-text" placeholder="Option C" required>
                </div>
                <div class="option-input-group">
                    <input type="radio" name="correct-${questionNumber}" value="3" required>
                    <input type="text" class="form-input option-text" placeholder="Option D" required>
                </div>
            </div>
        </div>
        <div class="form-group full-width">
            <label>Explanation (Optional)</label>
            <textarea class="form-textarea question-explanation" placeholder="Explain the correct answer" rows="2"></textarea>
        </div>
    `;
    
    questionsContainer.appendChild(questionItem);
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    const questionsContainer = document.getElementById('questions-container');
    
    if (questionsContainer.children.length > 1) {
        questionItem.remove();
        updateQuestionNumbers();
    } else {
        showNotification('You must have at least one question', 'warning');
    }
}

function updateQuestionNumbers() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const title = item.querySelector('.question-item-title');
        title.textContent = `Question ${index + 1}`;
    });
}

async function handleCreateQuiz(e) {
    e.preventDefault();
    
    // Collect form data
    const title = document.getElementById('new-quiz-title').value;
    const description = document.getElementById('new-quiz-description').value;
    const category = document.getElementById('new-quiz-category').value;
    const difficulty = document.getElementById('new-quiz-difficulty').value;
    const timeLimit = parseInt(document.getElementById('new-quiz-time').value) * 60;
    const passingScore = parseInt(document.getElementById('new-quiz-passing').value);
    
    // Collect questions
    const questionItems = document.querySelectorAll('.question-item');
    const questions = [];
    
    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value;
        const optionTexts = Array.from(item.querySelectorAll('.option-text')).map(input => input.value);
        const correctAnswer = parseInt(item.querySelector(`input[name="correct-${index + 1}"]:checked`)?.value);
        const explanation = item.querySelector('.question-explanation').value;
        
        questions.push({
            question: questionText,
            options: optionTexts,
            correctAnswer,
            explanation
        });
    });
    
    // Validate
    if (questions.length === 0) {
        showNotification('Please add at least one question', 'warning');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                category,
                difficulty,
                timeLimit,
                passingScore,
                questions
            })
        });
        
        if (response.ok) {
            showNotification('Quiz created successfully!', 'success');
            document.getElementById('create-quiz-form').reset();
            initializeCreateForm();
            await loadQuizzes();
            await loadCategories();
            navigateToPage('home');
        } else {
            throw new Error('Failed to create quiz');
        }
    } catch (error) {
        console.error('Error creating quiz:', error);
        showNotification('Failed to create quiz', 'error');
    } finally {
        hideLoading();
    }
}

// Filter Functions
function filterQuizzes() {
    const category = elements.categoryFilter.value;
    const difficulty = elements.difficultyFilter.value;
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    let filtered = [...state.quizzes];
    
    if (category !== 'all') {
        filtered = filtered.filter(q => q.category === category);
    }
    
    if (difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(q => 
            q.title.toLowerCase().includes(searchTerm) ||
            q.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderQuizzes(filtered);
}

// Utility Functions
function showLoading() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced with a toast library)
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

async function updateStats() {
    try {
        elements.totalQuizzes.textContent = state.quizzes.length;
        
        // Get total attempts from all quizzes
        let totalAttempts = 0;
        for (const quiz of state.quizzes) {
            const response = await fetch(`${API_BASE_URL}/quizzes/${quiz.id}/stats`);
            const stats = await response.json();
            totalAttempts += stats.totalAttempts;
        }
        elements.totalAttempts.textContent = totalAttempts;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);