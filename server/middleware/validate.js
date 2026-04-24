const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const authValidation = {
  login: [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
  ],
  register: [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
    body('name').optional().trim().escape().isLength({ max: 255 }).withMessage('Name max 255 characters'),
    handleValidationErrors
  ]
};

const essayValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }).withMessage('Title max 500 characters'),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 50000 }).withMessage('Content max 50000 characters'),
    handleValidationErrors
  ]
};

const quizValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('difficulty').trim().isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
    body('num_questions').optional().isInt({ min: 1, max: 50 }),
    handleValidationErrors
  ]
};

const musicValidation = {
  create: [
    body('instrument').trim().notEmpty().withMessage('Instrument is required'),
    body('skill_level').trim().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Skill level must be Beginner, Intermediate, or Advanced'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    handleValidationErrors
  ]
};

const readingValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 50000 }),
    handleValidationErrors
  ]
};

const learningValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('current_level').trim().notEmpty().withMessage('Current level is required'),
    body('target_level').trim().notEmpty().withMessage('Target level is required'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  essayValidation,
  quizValidation,
  musicValidation,
  readingValidation,
  learningValidation
};
