const redis = require('redis');
const logger = require('./logger');

const pub = redis.createClient();
const sub = redis.createClient();

sub.on('message', async (channel, message) => {
    try {
        const data = JSON.parse(message);
        logger.info(`📩 Получено сообщение в очереди ${channel}:`, data);

        switch (channel) {
            case 'transaction_confirmations':
                // Логика подтверждения транзакции
                break;
            case 'notifications':
                // Логика отправки уведомлений
                break;
            default:
                logger.warn(`⚠️ Неизвестный канал очереди: ${channel}`);
        }
    } catch (error) {
        logger.error(`❌ Ошибка обработки сообщения из очереди: ${error.message}`);
    }
});

const publish = async (channel, message) => {
    try {
        await pub.publish(channel, JSON.stringify(message));
        logger.info(`✅ Сообщение отправлено в очередь ${channel}`);
    } catch (error) {
        logger.error(`❌ Ошибка публикации сообщения в очередь: ${error.message}`);
    }
};

// Подписка на очереди
sub.subscribe('transaction_confirmations');
sub.subscribe('notifications');

module.exports = { publish };
