// Auth routes implementation
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/emailSender');
const redisClient = require('../utils/redisClient');
const router = express.Router();

const isEmailConfirmationEnabled = process.env.EMAIL_CONFIRMATION_ENABLED === 'true';

// Регистрация пользователя
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email }).lean();
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        isEmailConfirmed: !isEmailConfirmationEnabled,
      });
      await user.save();

      if (isEmailConfirmationEnabled) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const confirmLink = `${process.env.FRONTEND_URL}/confirm-email/${token}`;
        await sendEmail(email, 'Confirm Your Email', `Hello ${username},\n\nClick below to confirm your email:\n${confirmLink}`);
        res.status(201).json({ message: 'User registered. Please confirm your email.' });
      } else {
        res.status(201).json({ message: 'User registered successfully.' });
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
);

// Подтверждение email
router.get('/confirm-email/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.isEmailConfirmed) {
      return res.status(400).json({ error: 'Email already confirmed.' });
    }

    user.isEmailConfirmed = true;
    await user.save();
    res.status(200).json({ message: 'Email confirmed successfully.' });
  } catch (error) {
    console.error('Email confirmation error:', error.message);
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
});

// Повторная отправка подтверждения
router.post('/resend-confirmation', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({ error: 'Email is already confirmed.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const confirmLink = `${process.env.FRONTEND_URL}/confirm-email/${token}`;
    await sendEmail(email, 'Confirm Your Email', `Hello ${user.username},\n\nClick below to confirm your email:\n${confirmLink}`);
    res.status(200).json({ message: 'Confirmation email resent.' });
  } catch (error) {
    console.error('Error resending confirmation email:', error.message);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Логин
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'Invalid email or password.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid email or password.' });
      }

      if (isEmailConfirmationEnabled && !user.isEmailConfirmed) {
        return res.status(403).json({ error: 'Please confirm your email to log in.' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
);

// Получение информации о текущем пользователе
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// Выход из системы (аннулирование токена)
router.post('/logout', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(400).json({ error: 'Token is required for logout.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Отзыв токена в Redis с истечением срока действия
    await new Promise((resolve, reject) => {
      redisClient.set(token, 'revoked', 'EX', decoded.exp - Math.floor(Date.now() / 1000), (err) => {
        if (err) {
          console.error('Redis set error:', err.message);
          return reject(err);
        }
        resolve();
      });
    });

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'Failed to log out.' });
  }
});

module.exports = router;


// Обновление токена
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);

    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
