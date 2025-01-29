const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../db/repositories/UserRepository');
const RoleRepository = require('../../db/repositories/RoleRepository');
const { sendEmail } = require('../../infrastructure/emailSender');
const logger = require('../../infrastructure/logger');
const { AppError, ValidationError, AuthError } = require('../../infrastructure/errors');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userRepository = new UserRepository();

    const existingUser = await userRepository.findByEmailOrUsername(email, username);
    if (existingUser) {
      throw new ValidationError(
        existingUser.email === email ? 'Email already in use' : 'Username already taken'
      );
    }

    logger.info({
      event: 'user_registration_attempt',
      email,
      username
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = await RoleRepository.findOne({ name: 'user' }) || 
                    await new RoleRepository({ name: 'user' }).save();

    const newUser = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: userRole._id,
      isEmailConfirmed: false
    });

    const confirmToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const confirmLink = `${process.env.FRONTEND_URL}/confirm-email/${confirmToken}`;
    await sendEmail(
      email,
      'Registration Confirmation',
      `Hello ${username}!\n\nPlease confirm your registration: ${confirmLink}`
    );

    logger.info({
      event: 'user_registered',
      userId: newUser._id,
      username
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for confirmation.',
      userId: newUser._id
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Registration error:', error);
    throw new AppError('Failed to register user', 500);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRepository = new UserRepository();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    if (!user.isEmailConfirmed) {
      throw new ValidationError('Please confirm your email to login');
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role.name);

    logger.info({
      event: 'user_login',
      userId: user._id,
      username: user.username
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof ValidationError) {
      return res.status(401).json({ error: error.message });
    }
    logger.error('Login error:', error);
    throw new AppError('Failed to login', 500);
  }
};

// Повторная отправка подтверждения email
exports.resendConfirmationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Проверка, существует ли пользователь
    const userRepository = new UserRepository();
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с указанным email не найден' });
    }

    // Проверка, подтверждён ли пользователь
    if (user.isVerified) {
      return res.status(400).json({ error: 'Пользователь уже подтвердил email' });
    }

    // Генерация нового токена для подтверждения email
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Отправка email для подтверждения
    const confirmLink = `${process.env.CLIENT_URL}/confirm-email/${token}`;
    await sendEmail(user.email, 'Повторное подтверждение регистрации', `Подтвердите свою почту: ${confirmLink}`);

    res.status(200).json({
      message: 'Повторное письмо с подтверждением отправлено. Проверьте свою почту.',
    });
  } catch (error) {
    console.error('Ошибка при повторной отправке подтверждения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Подтверждение email
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email успешно подтверждён.' });
  } catch (error) {
    console.error('Ошибка при подтверждении email:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};