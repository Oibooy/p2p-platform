// routes/deals.js - Маршруты для сделок
const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');
const Deal = require('../models/Deal');

const router = express.Router();

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Папка для загрузки скриншотов
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      return cb(null, true);
    }
    cb(new Error('Только изображения (jpeg, jpg, png) разрешены'));
  },
});

// Загрузка скриншота для сделки
router.post('/:id/upload-screenshot', verifyToken, upload.single('screenshot'), async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Сделка не найдена' });
    }

    // Проверка прав пользователя
    if (deal.buyer.toString() !== req.user.id && deal.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Вы не имеете права изменять эту сделку' });
    }

    // Сохранение пути к файлу
    deal.screenshot = req.file.path;
    await deal.save();

    res.status(200).json({ message: 'Скриншот загружен', screenshot: deal.screenshot });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение скриншота сделки
router.get('/:id/screenshot', verifyToken, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal || !deal.screenshot) {
      return res.status(404).json({ error: 'Скриншот не найден' });
    }

    res.sendFile(path.resolve(deal.screenshot));
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;