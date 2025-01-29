const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../db/repositories/UserRepository');
const Role = require('../../db/models/Role');
const { sendEmail } = require('../../infrastructure/emailSender');
const logger = require('../../infrastructure/logger');

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Валидация входных данных
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    // Проверка существующего пользователя
    const userRepository = new UserRepository();
    const existingUser = await userRepository.findByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? 'Email уже используется' : 'Имя пользователя уже занято'
      });
    }

    // Хэширование пароля
    console.log('Hashing password for new user:', { password });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully:', { 
      hashedPasswordStart: hashedPassword.substring(0, 10),
      hashedPasswordLength: hashedPassword.length 
    });

    // Получение или создание роли пользователя
    let userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      userRole = new Role({ name: 'user' });
      await userRole.save();
    }

    // Создание пользователя
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole._id,
      isEmailConfirmed: true // Временно установим true для тестирования
    });

    const savedUser = await newUser.save();

    // Генерация токена для подтверждения email
    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const confirmLink = `${process.env.FRONTEND_URL}/confirm-email/${token}`;

    await sendEmail(email, 'Подтверждение регистрации', 
      `Здравствуйте, ${username}!\n\nДля подтверждения регистрации перейдите по ссылке: ${confirmLink}`);

    res.status(201).json({
      message: 'Регистрация успешна. Проверьте email для подтверждения.',
      userId: savedUser._id
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRepository = new UserRepository();
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.isEmailConfirmed) {
      return res.status(403).json({ error: 'Пожалуйста, подтвердите email для входа' });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
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
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
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