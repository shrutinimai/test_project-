
const jwt = require('jsonwebtoken');
require('dotenv').config();


const generateToken = (id, userType, charityId = null) => {
  return jwt.sign({ id, userType, charityId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, 
  });
};

module.exports = { generateToken };