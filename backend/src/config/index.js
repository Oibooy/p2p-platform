require('dotenv').config();

const config = {
  mongo_uri: process.env.MONGO_URI,
  redis_url: process.env.REDIS_URL,
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '5000',
  host: process.env.HOST || '0.0.0.0',
  frontend_url: process.env.FRONTEND_URL,

  // Безопасность
  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,

  // Blockchain
  mtt_rpc_url: process.env.MTT_RPC_URL,
  mtt_escrow_address: process.env.MTT_ESCROW_ADDRESS,
  tron_api_url: process.env.TRON_API_URL,
  tron_escrow_address: process.env.TRON_ESCROW_ADDRESS,
  usdt_token_address: process.env.USDT_TOKEN_ADDRESS,

  // Telegram
  telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
  telegram_chat_id: process.env.TELEGRAM_CHAT_ID,

  // Email
  email_user: process.env.EMAIL_USER,
  email_from_name: process.env.EMAIL_FROM_NAME,
  email_confirmation_enabled: process.env.EMAIL_CONFIRMATION_ENABLED === 'true',
};

if (!config.mongo_uri || !config.jwt_secret || !config.tron_api_url) {
  throw new Error('❌ Ошибка: Отсутствуют критические переменные окружения! Проверьте .env');
}

module.exports = config;
