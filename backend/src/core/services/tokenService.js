const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateAccessToken = (userId) => {
  return jwt.sign({ userId, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

exports.generateRefreshToken = (userId) => {
  const tokenId = crypto.randomBytes(32).toString('hex');
  const refreshToken = jwt.sign(
    { userId, tokenId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { refreshToken, tokenId };
};