const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const sendEmail = async (to, subject, text, html = null) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('❌ Ошибка: Почтовые учетные данные не настроены');
  }

  const transporter = createTransporter();

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'MTT P2P'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`✅ Email отправлен: ${subject} → ${to}`);
    return result;
  } catch (error) {
    logger.error(`❌ Ошибка отправки Email: ${error.message}`);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
