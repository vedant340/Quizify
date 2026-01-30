const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database (replace with real database in production)
let quizzes = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of core JavaScript concepts",
    category: "Programming",
    difficulty: "intermediate",
    timeLimit: 600, // seconds
    passingScore: 70,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        question: "What is the output of: typeof null?",
        options: ["null", "undefined", "object", "number"],
        correctAnswer: 2,
        explanation: "typeof null returns 'object' due to a legacy bug in JavaScript."
      },
      {
        id: 2,
        question: "Which method is used to add elements to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: 0,
        explanation: "push() adds elements to the end of an array."
      },
      {
        id: 3,
        question: "What is a closure in JavaScript?",
        options: [
          "A function that has access to variables in its outer scope",
          "A way to close a program",
          "A type of loop",
          "A method to close files"
        ],
        correctAnswer: 0,
        explanation: "A closure is a function that retains access to variables from its outer scope even after the outer function has returned."
      },
      {
        id: 4,
        question: "What does 'use strict' do in JavaScript?",
        options: [
          "Makes code run faster",
          "Enables strict mode with stricter parsing and error handling",
          "Compresses the code",
          "Makes variables immutable"
        ],
        correctAnswer: 1,
        explanation: "'use strict' enables strict mode, which catches common coding errors and prevents certain actions."
      },
      {
        id: 5,
        question: "What is the difference between '==' and '===' in JavaScript?",
        options: [
          "No difference",
          "'==' checks type and value, '===' only checks value",
          "'===' checks type and value, '==' only checks value",
          "Both are deprecated"
        ],
        correctAnswer: 2,
        explanation: "'===' (strict equality) checks both type and value, while '==' (loose equality) performs type coercion."
      }
    ]
  },
  {
    id: 2,
    title: "Web Development Basics",
    description: "Essential concepts for web developers",
    category: "Web Development",
    difficulty: "beginner",
    timeLimit: 480,
    passingScore: 60,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlinks and Text Markup Language"
        ],
        correctAnswer: 0,
        explanation: "HTML stands for Hyper Text Markup Language, the standard markup language for web pages."
      },
      {
        id: 2,
        question: "Which CSS property is used to change text color?",
        options: ["text-color", "font-color", "color", "text-style"],
        correctAnswer: 2,
        explanation: "The 'color' property in CSS is used to change the color of text."
      },
      {
        id: 3,
        question: "What is the correct HTML tag for the largest heading?",
        options: ["<heading>", "<h6>", "<h1>", "<head>"],
        correctAnswer: 2,
        explanation: "<h1> is the largest heading tag in HTML, with <h6> being the smallest."
      },
      {
        id: 4,
        question: "Which property is used to change the background color in CSS?",
        options: ["bgcolor", "background-color", "color", "background"],
        correctAnswer: 1,
        explanation: "background-color is the CSS property used to set the background color of an element."
      }
    ]
  },
  {
    id: 3,
    title: "Data Science Essentials",
    description: "Key concepts in data science and analytics",
    category: "Data Science",
    difficulty: "advanced",
    timeLimit: 900,
    passingScore: 75,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        question: "What is overfitting in machine learning?",
        options: [
          "When a model performs poorly on training data",
          "When a model performs well on training data but poorly on new data",
          "When a model uses too few features",
          "When a model is too simple"
        ],
        correctAnswer: 1,
        explanation: "Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data."
      },
      {
        id: 2,
        question: "Which measure is NOT affected by outliers?",
        options: ["Mean", "Median", "Standard Deviation", "Range"],
        correctAnswer: 1,
        explanation: "The median is resistant to outliers as it represents the middle value, unlike mean or standard deviation."
      },
      {
        id: 3,
        question: "What is the purpose of cross-validation?",
        options: [
          "To validate user input",
          "To assess model performance and prevent overfitting",
          "To cross-reference data sources",
          "To validate data types"
        ],
        correctAnswer: 1,
        explanation: "Cross-validation is used to assess how well a model generalizes to unseen data and helps prevent overfitting."
      }
    ]
  }
];

let attempts = [];
let users = [];

// API Routes

// Get all quizzes
app.get('/api/quizzes', (req, res) => {
  const { category, difficulty } = req.query;
  let filteredQuizzes = [...quizzes];

  if (category && category !== 'all') {
    filteredQuizzes = filteredQuizzes.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }

  if (difficulty && difficulty !== 'all') {
    filteredQuizzes = filteredQuizzes.filter(q => q.difficulty === difficulty);
  }

  // Return quizzes without correct answers
  const publicQuizzes = filteredQuizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    timeLimit: quiz.timeLimit,
    passingScore: quiz.passingScore,
    questionCount: quiz.questions.length,
    createdAt: quiz.createdAt
  }));

  res.json(publicQuizzes);
});

// Get single quiz (for starting the quiz)
app.get('/api/quizzes/:id', (req, res) => {
  const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
  
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Return quiz with questions but without correct answers
  const publicQuiz = {
    ...quiz,
    questions: quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }))
  };

  res.json(publicQuiz);
});

// Submit quiz answers
app.post('/api/quizzes/:id/submit', (req, res) => {
  const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
  
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const { answers, userName, timeSpent } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers format' });
  }

  // Calculate score
  let correctAnswers = 0;
  const results = quiz.questions.map(question => {
    const userAnswer = answers.find(a => a.questionId === question.id);
    const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
    
    if (isCorrect) correctAnswers++;

    return {
      questionId: question.id,
      question: question.question,
      userAnswer: userAnswer ? userAnswer.answer : null,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation
    };
  });

  const score = (correctAnswers / quiz.questions.length) * 100;
  const passed = score >= quiz.passingScore;

  // Save attempt
  const attempt = {
    id: attempts.length + 1,
    quizId: quiz.id,
    quizTitle: quiz.title,
    userName: userName || 'Anonymous',
    score,
    correctAnswers,
    totalQuestions: quiz.questions.length,
    passed,
    timeSpent,
    completedAt: new Date().toISOString(),
    results
  };

  attempts.push(attempt);

  res.json({
    attemptId: attempt.id,
    score,
    correctAnswers,
    totalQuestions: quiz.questions.length,
    passed,
    passingScore: quiz.passingScore,
    results
  });
});

// Get quiz statistics
app.get('/api/quizzes/:id/stats', (req, res) => {
  const quizId = parseInt(req.params.id);
  const quiz = quizzes.find(q => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const quizAttempts = attempts.filter(a => a.quizId === quizId);

  if (quizAttempts.length === 0) {
    return res.json({
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0
    });
  }

  const scores = quizAttempts.map(a => a.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passedCount = quizAttempts.filter(a => a.passed).length;
  const passRate = (passedCount / quizAttempts.length) * 100;

  res.json({
    totalAttempts: quizAttempts.length,
    averageScore: Math.round(averageScore * 10) / 10,
    passRate: Math.round(passRate * 10) / 10,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    recentAttempts: quizAttempts.slice(-5).reverse()
  });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  const categories = [...new Set(quizzes.map(q => q.category))];
  res.json(categories);
});

// Create new quiz (admin function)
app.post('/api/quizzes', (req, res) => {
  const { title, description, category, difficulty, timeLimit, passingScore, questions } = req.body;

  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: 'Title and questions are required' });
  }

  const newQuiz = {
    id: quizzes.length + 1,
    title,
    description: description || '',
    category: category || 'General',
    difficulty: difficulty || 'intermediate',
    timeLimit: timeLimit || 600,
    passingScore: passingScore || 70,
    createdAt: new Date().toISOString(),
    questions: questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }))
  };

  quizzes.push(newQuiz);
  res.status(201).json(newQuiz);
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { quizId } = req.query;

  let relevantAttempts = attempts;
  
  if (quizId) {
    relevantAttempts = attempts.filter(a => a.quizId === parseInt(quizId));
  }

  // Group by userName and get best score
  const leaderboard = {};
  relevantAttempts.forEach(attempt => {
    if (!leaderboard[attempt.userName] || leaderboard[attempt.userName].score < attempt.score) {
      leaderboard[attempt.userName] = {
        userName: attempt.userName,
        score: attempt.score,
        quizTitle: attempt.quizTitle,
        completedAt: attempt.completedAt
      };
    }
  });

  const sortedLeaderboard = Object.values(leaderboard)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(sortedLeaderboard);
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Quiz Application Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});