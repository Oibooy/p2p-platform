// src/api/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserRepository = require('../../db/repositories/UserRepository');
const sendEmail = require('../../infrastructure/emailSender');
const redisClient = require('../../infrastructure/redisClient');
const crypto = require('crypto');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../../core/services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../../core/services/tokenService');
const { saveRefreshToken } = require('../../core/services/redisService');

const isEmailConfirmationEnabled = process.env.EMAIL_CONFIRMATION_ENABLED === 'true';

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await UserRepository.findOne({ email: email.toLowerCase() }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new UserRepository({
      username,
      email,
      password: hashedPassword,
      isEmailConfirmed: !isEmailConfirmationEnabled,
    });
    await user.save();

    if (isEmailConfirmationEnabled) {
      await sendConfirmationEmail(user);
      return res.status(201).json({ message: 'User registered. Please confirm your email.' });
    }

    res.status(201).json({ message: 'User registered successfully.', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await UserRepository.findOne({
      $or: [
        { email: { $regex: new RegExp('^' + email + '$', 'i') } },
        { username: { $regex: new RegExp('^' + email + '$', 'i') } }
      ]
    }).populate('role');

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please register first' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    await assignDefaultRole(user);

    const accessToken = generateAccessToken(user._id);
    const { refreshToken, tokenId } = generateRefreshToken(user._id);

    await saveRefreshToken(user._id, tokenId, refreshToken, req.headers['user-agent'], req.ip);

    res.status(200).json({
      message: 'Login successful.',
      accessToken,
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
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await UserRepository.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user, resetToken);
    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const user = await UserRepository.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

exports.confirmEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserRepository.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

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
};

exports.resendConfirmation = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserRepository.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({ error: 'Email is already confirmed.' });
    }

    await sendConfirmationEmail(user);
    res.status(200).json({ message: 'Confirmation email resent.' });
  } catch (error) {
    console.error('Error resending confirmation email:', error.message);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await UserRepository.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};