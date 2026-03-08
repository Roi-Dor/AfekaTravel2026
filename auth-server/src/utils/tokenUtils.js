const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    developers: jwtConfig.developers
  };

  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiresIn
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    type: 'refresh'
  };

  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiresIn
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.accessTokenSecret);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshTokenSecret);
  } catch (error) {
    return null;
  }
};

const canSilentRefresh = (lastRefreshDate) => {
  if (!lastRefreshDate) return true;
  
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const lastRefresh = new Date(lastRefreshDate);
  
  return (now - lastRefresh) >= oneDayInMs;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  canSilentRefresh
};
