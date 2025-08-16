const jwt = require('jsonwebtoken');
const { User } = require('../config/database'); 
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; 
  }

  if (!token) {
    const error = new Error('Not authorized, no token');
    error.statusCode = 401; 
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    req.user = decoded;
    next(); 
  } catch (error) {
    console.error('Token verification failed:', error.message);
    const err = new Error('Not authorized, token failed');
    err.statusCode = 401;
    next(err); 
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userType)) {
      const error = new Error('Forbidden: You do not have permission to perform this action');
      error.statusCode = 403; 
      return next(error); 
    }
    next(); 
  };
};

module.exports = { protect, authorizeRoles };
