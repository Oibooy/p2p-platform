// Auth routes implementation
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/emailSender');
const redisClient = require('../utils/redisClient');
const router = express.Router();
const crypto = require('crypto');

// Запрос на сброс пароля
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 час

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(
      email,
      'Password Reset Request',
      `To reset your password, click the link: ${resetLink}\nThis link will expire in 1 hour.`
    );

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Error sending reset email' });
  }
});

// Сброс пароля
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = await User.findOne({ email }).populate('role');
      console.log('Login attempt:', { 
        email, 
        userFound: !!user,
        isEmailConfirmed: user?.isEmailConfirmed
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('Checking password for user:', user.email);
      console.log('Password details:', {
        providedPassword: password,
        storedHashLength: user.password.length,
        storedHashStart: user.password.substring(0, 10)
      });
      
      // Используем bcrypt.compare для сравнения паролей
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Password validation failed for user:', user.email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!user.role) {
        const Role = require('../models/Role');
        const userRole = await Role.findOne({ name: 'user' });
        if (userRole) {
          user.role = userRole;
          await user.save();
        }
      }
      
      if (isEmailConfirmationEnabled && !user.isEmailConfirmed) {
        return res.status(403).json({ error: 'Please confirm your email to log in.' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        console.error('JWT secrets are not properly configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Создаем уникальный tokenId для refresh токена
      const tokenId = crypto.randomBytes(32).toString('hex');
      
      const token = jwt.sign(
        { userId: user._id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user._id, tokenId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Сохраняем refresh token в Redis
      const redis = await redisClient.getClient();
      await redis.set(
        `refresh_token:${user._id}:${tokenId}`,
        JSON.stringify({
          refreshToken,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          createdAt: new Date().toISOString()
        }),
        'EX',
        7 * 24 * 60 * 60 // 7 дней
      );
      
      res.status(200).json({ 
        message: 'Login successful.',
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role.name,
          isActive: user.isActive
        }
      });
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
    const { id, tokenId } = decoded;

    const storedData = await redisClient.get(`refresh_token:${id}:${tokenId}`);
    if (!storedData) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    const storedToken = JSON.parse(storedData);
    if (storedToken.refreshToken !== refreshToken) {
      // Возможная попытка повторного использования токена
      await redisClient.del(`refresh_token:${id}:${tokenId}`);
      return res.status(401).json({ error: 'Token reuse detected' });
    }

    // Создание нового access token
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // Создание нового refresh token
    const newTokenId = crypto.randomBytes(32).toString('hex');
    const newRefreshToken = jwt.sign(
      { id, tokenId: newTokenId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Удаление старого refresh token
    await redisClient.del(`refresh_token:${id}:${tokenId}`);

    // Сохранение нового refresh token
    await redisClient.set(
      `refresh_token:${id}:${newTokenId}`,
      JSON.stringify({
        refreshToken: newRefreshToken,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        createdAt: new Date().toISOString()
      }),
      'EX',
      7 * 24 * 60 * 60
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
