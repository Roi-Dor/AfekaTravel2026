const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  silentRefresh,
  logout,
  getProfile,
  validateToken
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/refresh', silentRefresh);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);
router.get('/validate', authenticateToken, validateToken);

module.exports = router;
