
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    debug: true
  });
};

const sendEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email credentials not configured');
  }

  const transporter = createTransporter();

  try {
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'MTT P2P'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
