const sendEmail = require('../../infrastructure/emailSender');

exports.sendConfirmationEmail = async (user) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const confirmLink = `${process.env.FRONTEND_URL}/confirm-email/${token}`;
  await sendEmail(user.email, 'Confirm Your Email', `Hello ${user.username},\n\nClick below to confirm your email:\n${confirmLink}`);
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendEmail(
    user.email,
    'Password Reset Request',
    `To reset your password, click the link: ${resetLink}\nThis link will expire in 1 hour.`
  );
};