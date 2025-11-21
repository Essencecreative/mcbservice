// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expected format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    req.user = decoded; // user info is now available in req.user
    next();
  } catch (err) {
    // Provide more specific error messages
    let message = 'Invalid or expired token.';
    let code = 'INVALID_TOKEN';

    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
      code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token format.';
      code = 'INVALID_TOKEN_FORMAT';
    } else if (err.name === 'NotBeforeError') {
      message = 'Token not active yet.';
      code = 'TOKEN_NOT_ACTIVE';
    }

    return res.status(403).json({ 
      message,
      code,
      expired: err.name === 'TokenExpiredError'
    });
  }
};

module.exports = authenticateToken;
