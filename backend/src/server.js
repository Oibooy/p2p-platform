// src/server.js
const express = require('express');
const { monitorIncomingTransactions } = require('./services/hotWalletService');

const app = express();
const PORT = process.env.PORT || 5000;

// Запуск мониторинга входящих транзакций
monitorIncomingTransactions();

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

