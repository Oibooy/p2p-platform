// src/api/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserRepository = require('../../db/repositories/UserRepository');
const sendEmail = require('../../infrastructure/emailSender');

const isEmailConfirmationEnabled = process.env.EMAIL_CONFIRMATION_ENABLED === 'true';

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await UserRepository.findOne({ 
      email: email.toLowerCase() 
    }).lean();

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Увеличиваем сложность хеширования

    const user = new UserRepository({
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
      res.status(201).json({ 
        message: 'User registered successfully.',
        userId: user._id
      });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};