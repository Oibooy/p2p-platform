// User.js - Модель пользователей
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Review = require('./Review');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wallet: { type: String, required: false }, // Кошелёк Tron для USDT
    isEmailConfirmed: { type: Boolean, default: false }, // Поле для подтверждения email
    isActive: { type: Boolean, default: true }, // Поле активности пользователя
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    rating: { type: Number, default: 0 }, // Средний рейтинг пользователя
    notificationSettings: { // Настройки уведомлений
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true } // Добавляет createdAt и updatedAt
);

// Хэширование пароля перед сохранением
UserSchema.pre('save', async function (next) {
  // Проверяем, что пароль был изменен и не является уже хэшированным
  if (!this.isModified('password') || this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Автоматическое назначение роли по умолчанию
UserSchema.pre('save', async function (next) {
  if (!this.role) {
    const Role = require('./Role');
    const userRole = await Role.findOne({ name: 'user' });
    if (userRole) {
      this.role = userRole._id;
    } else {
      return next(new Error('Роль "user" не найдена в базе данных'));
    }
  }
  next();
});

// Метод для проверки пароля
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Метод для обновления рейтинга
UserSchema.methods.updateRating = async function() {
  const reviews = await mongoose.model('Review').find({ to: this._id });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = (totalRating / reviews.length).toFixed(1);
    await this.save();
  } else {
    this.rating = 0;
    await this.save();
  }
};


// Автоматический пересчёт рейтинга пользователя
UserSchema.methods.recalculateRating = async function () {
  try {
    const reviews = await Review.find({ user: this._id });
    if (reviews.length === 0) {
      this.rating = 0;
    } else {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      this.rating = (totalRating / reviews.length).toFixed(2);
    }
    await this.save();
  } catch (error) {
    console.error('Ошибка при пересчёте рейтинга:', error);
  }
};

module.exports = mongoose.model('User', UserSchema);