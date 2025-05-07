
// Author: Alamin
// Description: A modular Express router for a fuzzy-question answering API with GitHub Gist-based JSON storage.

const express = require('express');
const axios = require('axios');
const fuzzy = require('fuzzy');
const path = require('path');
const router = express.Router();

// GitHub Gist Config
const GITHUB_TOKEN = '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';
const GITHUB_USERNAME = 'Alit-dev';
const GIST_ID = '1e244da3fd8790812e008afa66d5bdfc';
const FILE_NAME = 'sara.json';

// In-memory cache for knowledge base
let knowledgeBaseCache = null;

// Middleware
router.use(express.json());
router.use(express.static(path.join(__dirname)));

// GitHub API headers
const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'FuzzyLearningBot/1.0'
};

// Helper: Fetch JSON from Gist with error handling
async function fetchGist() {
  try {
    const url = `https://api.github.com/gists/${GIST_ID}`;
    const { data } = await axios.get(url, { headers });
    if (!data.files[FILE_NAME]) {
      console.error(`File ${FILE_NAME} not found in Gist ${GIST_ID}`);
      return {};
    }
    const content = data.files[FILE_NAME].content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error('Failed to fetch Gist:', error.response?.data || error.message);
    return {};
  }
}

// Helper: Initialize or get cached knowledge base
async function getJSON() {
  if (knowledgeBaseCache === null) {
    knowledgeBaseCache = await fetchGist();
    knowledgeBaseCache = normalizeKnowledgeBase(knowledgeBaseCache);
  }
  return knowledgeBaseCache;
}

// Helper: Normalize knowledge base keys to lowercase
function normalizeKnowledgeBase(knowledgeBase) {
  const normalized = {};
  for (const [question, data] of Object.entries(knowledgeBase)) {
    const lowerQuestion = question.toLowerCase();
    if (!normalized[lowerQuestion]) {
      normalized[lowerQuestion] = { answers: [], teacher: data.teacher };
    }
    for (const answer of data.answers) {
      if (!normalized[lowerQuestion].answers.includes(answer)) {
        normalized[lowerQuestion].answers.push(answer);
      }
    }
  }
  return normalized;
}

// Helper: Update JSON in Gist and cache
async function updateJSON(updatedData) {
  try {
    const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
    const files = {
      [FILE_NAME]: {
        content: JSON.stringify(updatedData, null, 2)
      }
    };
    await axios.patch(gistUrl, { files }, { headers });
    knowledgeBaseCache = updatedData;
    console.log('Gist updated successfully');
  } catch (error) {
    console.error('Failed to update Gist:', error.response?.data || error.message);
    throw new Error('Failed to update knowledge base');
  }
}

// Optimized Fuzzy match
function fuzzyMatch(query, target) {
  const result = fuzzy.filter(query, [target], { extract: str => str });
  return result.length > 0 && result[0].score > 40;
}

// Route 1: /text=:query - Answer a question with fuzzy matching
router.get('/text=:query', async (req, res) => {
  try {
    const question = req.params.query;
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }
    const knowledgeBase = await getJSON();
    const normalizedQuestion = question.toLowerCase().trim();
    for (const [storedQuestion, data] of Object.entries(knowledgeBase)) {
      if (fuzzyMatch(normalizedQuestion, storedQuestion)) {
        const randomAnswer = data.answers[Math.floor(Math.random() * data.answers.length)];
        return res.json({
          question: storedQuestion,
          answer: randomAnswer,
          teacher: data.teacher
        });
      }
    }
    res.status(404).json({ error: 'No matching question found', suggestions: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Route 2 & 4: /sikho/question:ans/teacher or /sikho/q1:ans1,ans2/teacher
router.get('/sikho/:qa/:teacher', async (req, res) => {
  try {
    const rawQA = req.params.qa;
    const teacher = req.params.teacher;
    if (rawQA.includes('?') || rawQA.includes('%3F')) {
      return res.status(400).json({ error: 'Invalid format! Use: question:answer1,answer2/teacher' });
    }
    const [questionRaw, answersRaw] = rawQA.split(':');
    if (!questionRaw || !answersRaw) {
      return res.status(400).json({ error: 'Invalid format! Use: question:answer1,answer2/teacher' });
    }
    const question = decodeURIComponent(questionRaw.trim());
    const normalizedQuestion = question.toLowerCase();
    const answers = answersRaw.split(',').map(a => decodeURIComponent(a.trim()));
    const knowledgeBase = await getJSON();
    const teacherQuestionCount = Object.values(knowledgeBase).filter(
      data => data.teacher === teacher
    ).length;
    if (!knowledgeBase[normalizedQuestion]) {
      knowledgeBase[normalizedQuestion] = { answers: [], teacher };
    }
    for (const answer of answers) {
      if (!knowledgeBase[normalizedQuestion].answers.includes(answer)) {
        knowledgeBase[normalizedQuestion].answers.push(answer);
      }
    }
    await updateJSON(knowledgeBase);
    res.json({
      message: 'Learned!',
      teacher,
      total_questions_taught_by_teacher: teacherQuestionCount + 1,
      question: normalizedQuestion,
      answers: knowledgeBase[normalizedQuestion].answers
    });
  } catch (error) {
    res.status(500).json({ error: 'Learning failed', details: error.message });
  }
});

// Route 3: /sikho/q1:ans1 - q2:ans2/teacher - Bulk teach
router.get('/sikho/:bulkData/:teacher', async (req, res) => {
  try {
    const bulkData = req.params.bulkData.split(' - ').map(pair => pair.split(':'));
    const teacher = req.params.teacher;
    const knowledgeBase = await getJSON();
    let addedCount = 0;
    let skippedCount = 0;
    for (const [questionRaw, answersRaw] of bulkData) {
      const question = decodeURIComponent(questionRaw.trim());
      if (question.includes('?')) {
        skippedCount++;
        continue;
      }
      const normalizedQuestion = question.toLowerCase();
      const answers = answersRaw.split(',').map(a => decodeURIComponent(a.trim()));
      if (!knowledgeBase[normalizedQuestion]) {
        knowledgeBase[normalizedQuestion] = { answers: [], teacher };
      }
      for (const answer of answers) {
        if (!knowledgeBase[normalizedQuestion].answers.includes(answer)) {
          knowledgeBase[normalizedQuestion].answers.push(answer);
        }
      }
      addedCount++;
    }
    await updateJSON(knowledgeBase);
    res.json({
      message: 'Bulk teach completed',
      teacher,
      addedQuestions: addedCount,
      skippedQuestions: skippedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Bulk teach failed', details: error.message });
  }
});

// Route 5 & 6: /count and /count?teacher=Name
router.get('/count', async (req, res) => {
  try {
    const teacher = req.query.teacher;
    const knowledgeBase = await getJSON();
    if (teacher) {
      let questions = 0;
      let answers = 0;
      for (const [, data] of Object.entries(knowledgeBase)) {
        if (data.teacher === teacher) {
          questions += 1;
          answers += data.answers.length;
        }
      }
      if (questions === 0) {
        return res.status(404).json({ error: `No questions found for teacher ${teacher}` });
      }
      return res.json({ teacher, questions, answers });
    }
    res.json({
      totalQuestions: Object.keys(knowledgeBase).length,
      totalAnswers: Object.values(knowledgeBase).reduce((sum, q) => sum + q.answers.length, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count', details: error.message });
  }
});

// Route 7: /delete/question:ans
router.get('/delete/:qa', async (req, res) => {
  try {
    const [questionRaw, answerRaw] = req.params.qa.split(':');
    const question = decodeURIComponent(questionRaw);
    const normalizedQuestion = question.toLowerCase();
    const answer = decodeURIComponent(answerRaw);
    const knowledgeBase = await getJSON();
    if (knowledgeBase[normalizedQuestion]) {
      knowledgeBase[normalizedQuestion].answers = knowledgeBase[normalizedQuestion].answers.filter(a => a !== answer);
      if (knowledgeBase[normalizedQuestion].answers.length === 0) {
        delete knowledgeBase[normalizedQuestion];
      }
      await updateJSON(knowledgeBase);
      return res.json({
        message: 'Deleted successfully',
        question: normalizedQuestion,
        remainingAnswers: knowledgeBase[normalizedQuestion]?.answers || []
      });
    }
    res.status(404).json({ error: 'Question not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete', details: error.message });
  }
});

// Route 8: /admin - Serve admin panel


// Route 9: /help - Usage guide
router.get('/help', (req, res) => {
  const guide = {
    endpoints: [
      { path: '/text=:query', method: 'GET', description: 'Answer a question with fuzzy matching' },
      { path: '/sikho/:question:answer(s)/:teacher', method: 'GET', description: 'Teach a question with one or more answers' },
      { path: '/sikho/:q1:ans1 - q2:ans2/:teacher', method: 'GET', description: 'Bulk teach multiple Q&A pairs' },
      { path: '/count', method: 'GET', description: 'Get total Q&A count' },
      { path: '/count?teacher=Name', method: 'GET', description: 'Get Q&A count for a specific teacher' },
      { path: '/delete/:question:answer', method: 'GET', description: 'Delete a Q&A pair' },
      { path: '/admin', method: 'GET', description: 'Access HTML-based admin panel' },
      { path: '/bulk', method: 'POST', description: 'Bulk upload Q&A pairs' },
      { path: '/teachers', method: 'GET', description: 'List all teachers' },
      { path: '/show/all', method: 'GET', description: 'Show all Q&A pairs' },
      { path: '/show/teacher?name=Name', method: 'GET', description: 'Show Q&A for a specific teacher' },
      { path: '/teacher/:name', method: 'GET', description: 'Legacy route for teacher data' },
      { path: '/help', method: 'GET', description: 'Show this usage guide' }
    ]
  };
  res.json(guide);
});

// Route: List all teachers
router.get('/teachers', async (req, res) => {
  try {
    const knowledgeBase = await getJSON();
    const teachers = [...new Set(Object.values(knowledgeBase).map(v => v.teacher))];
    res.json({ count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers', details: error.message });
  }
});

// Route: Show all questions and answers
router.get('/show/all', async (req, res) => {
  try {
    const knowledgeBase = await getJSON();
    const questions = Object.entries(knowledgeBase).map(([question, data]) => ({
      question,
      answers: data.answers,
      teacher: data.teacher
    }));
    res.json({ count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all questions', details: error.message });
  }
});

// Route: Show questions and answers for a specific teacher
router.get('/show/teacher', async (req, res) => {
  try {
    const teacherName = req.query.name;
    if (!teacherName) {
      return res.status(400).json({ error: 'Teacher name not provided' });
    }
    const knowledgeBase = await getJSON();
    const questions = Object.entries(knowledgeBase)
      .filter(([, data]) => data.teacher === teacherName)
      .map(([question, data]) => ({ question, answers: data.answers, teacher: data.teacher }));
    res.json({ teacher: teacherName, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher questions', details: error.message });
  }
});

// Route: Legacy teacher data
router.get('/teacher/:name', async (req, res) => {
  try {
    const teacherName = req.params.name;
    const knowledgeBase = await getJSON();
    const result = {};
    for (const [question, data] of Object.entries(knowledgeBase)) {
      if (data.teacher === teacherName) {
        result[question] = data;
      }
    }
    res.json({ teacher: teacherName, count: Object.keys(result).length, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher data', details: error.message });
  }
});

// Route: Bulk upload questions and answers
router.post('/bulk', async (req, res) => {
  try {
    const { teacher, questions } = req.body;
    if (!teacher || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Teacher name and valid questions array required' });
    }
    const knowledgeBase = await getJSON();
    let addedCount = 0;
    let skippedCount = 0;
    for (const qa of questions) {
      const { question, answers } = qa;
      if (!question || !answers || !Array.isArray(answers) || answers.length === 0 || question.includes('?')) {
        skippedCount++;
        continue;
      }
      const normalizedQuestion = question.toLowerCase();
      if (!knowledgeBase[normalizedQuestion]) {
        knowledgeBase[normalizedQuestion] = { answers: [], teacher };
      }
      for (const answer of answers) {
        if (!knowledgeBase[normalizedQuestion].answers.includes(answer)) {
          knowledgeBase[normalizedQuestion].answers.push(answer);
        }
      }
      addedCount++;
    }
    await updateJSON(knowledgeBase);
    res.json({ message: 'Bulk upload completed', teacher, addedQuestions: addedCount, skippedQuestions: skippedCount });
  } catch (error) {
    res.status(500).json({ error: 'Bulk upload failed', details: error.message });
  }
});

module.exports = router;
