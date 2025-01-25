// authController.js - Контроллер для регистрации и авторизации
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { sendEmail } = require('../utils/emailService');

// Регистрация пользователя
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Поиск роли "user"
    const userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      return res.status(500).json({ error: 'Роль "user" не найдена в базе данных' });
    }

    // Создание пользователя
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole._id, // Установка роли по умолчанию
    });

    await newUser.save();

    // Генерация токена для подтверждения email
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Отправка email для подтверждения
    const confirmLink = `${process.env.CLIENT_URL}/confirm-email/${token}`;
    await sendEmail(email, 'Подтверждение регистрации', `Подтвердите свою почту: ${confirmLink}`);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован. Проверьте email для подтверждения.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: userRole.name,
      },
    });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Повторная отправка подтверждения email
exports.resendConfirmationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Проверка, существует ли пользователь
    const user = await User.findOne({ email });
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

// Авторизация пользователя
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Неверный email или пароль' });
    }

    // Создание access token
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // Создание refresh token с уникальным идентификатором
    const tokenId = crypto.randomBytes(32).toString('hex');
    const refreshToken = jwt.sign(
      { id: user._id, tokenId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Сохранение refresh token в Redis с дополнительной информацией
    await redisClient.set(
      `refresh_token:${user._id}:${tokenId}`,
      JSON.stringify({
        refreshToken,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        createdAt: new Date().toISOString()
      }),
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );

    res.status(200).json({
      message: 'Успешный вход',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Подтверждение email
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
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




