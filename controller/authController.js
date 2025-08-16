const bcrypt = require('bcryptjs');
const { User, Charity } = require('../config/database'); 
const { generateToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/emailService'); 
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid'); 


const registerUser = async (req, res, next) => {
  const { email, password, fullName, userType, charityName, registrationNumber, mission, description, website, contactEmail } = req.body;

  if (!email || !password || !userType) {
    const error = new Error('Please enter all required fields: email, password, userType.');
    error.statusCode = 400;
    return next(error);
  }

  if (userType === 'charity' && (!charityName || !registrationNumber)) {
    const error = new Error('Charity name and registration number are required for charity accounts.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      const error = new Error('Email already registered.');
      error.statusCode = 400;
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await sequelize.transaction(async (t) => {
      const newUserId = uuidv4();

      const newUser = await User.create({
        id: newUserId,
        email,
        password_hash: hashedPassword,
        full_name: fullName || null,
        user_type: userType,
      }, { transaction: t });

      if (userType === 'charity') {
        await Charity.create({
          id: newUser.id,
          name: charityName,
          registration_number: registrationNumber,
          mission: mission || null,
          description: description || null,
          website: website || null,
          contact_email: contactEmail || email,
          status: 'pending', 
        }, { transaction: t });
      }
      return newUser;
    });


    res.status(201).json({
      message: 'Registration successful. If you registered as a charity, your account is pending admin approval.',
      user: {
        id: result.id,
        email: result.email,
        userType: result.user_type,
        isVerified: result.is_verified,
        createdAt: result.created_at,
      },
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    next(new Error('Server error during registration.'));
  }
};


const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please enter email and password.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      return next(error);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      return next(error);
    }

    let charityId = null;
    if (user.user_type === 'charity') {
      const charity = await Charity.findOne({ where: { id: user.id } });
      if (charity) {
        charityId = charity.id;
        if (charity.status !== 'approved') {
          const error = new Error(`Your charity account is ${charity.status}. Please wait for admin approval or contact support.`);
          error.statusCode = 403;
          return next(error);
        }
      }
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user.id, user.user_type, charityId),
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
        charityId: charityId,
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    next(new Error('Server error during login.'));
  }
};

module.exports = {
  registerUser,
  loginUser,
};
