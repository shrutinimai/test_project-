const { User, Charity, Donation, Project, ImpactReport } = require('../config/database');
const { Op } = require('sequelize'); 
const { sendEmail } = require('../utils/emailService');
const sequelize = require('../config/database'); 


const getAllUsers = async (req, res, next) => {
  const { userType, status, limit = 10, offset = 0 } = req.query;

  const whereConditions = {};
  const includeOptions = [];

  if (userType) {
    whereConditions.user_type = userType;
    if (userType === 'charity') {
      includeOptions.push({
        model: Charity,
        as: 'charityDetails',
        attributes: ['name', 'status', 'registration_number'],
        required: true, 
        where: status ? { status } : {},
      });
    }
  } else { 
    includeOptions.push({
      model: Charity,
      as: 'charityDetails',
      attributes: ['name', 'status', 'registration_number'],
      required: false, 
      where: status ? { status } : {}, 
    });
  }

  try {
    const { count, rows: users } = await User.findAndCountAll({
      where: whereConditions,
      attributes: ['id', 'email', 'full_name', 'user_type', 'is_verified', 'created_at'],
      include: includeOptions,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      ...(user.user_type === 'charity' && user.charityDetails && {
        charityName: user.charityDetails.name,
        status: user.charityDetails.status,
        registrationNumber: user.charityDetails.registration_number,
      }),
    }));

    res.json({
      users: formattedUsers,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching all users:', error.message);
    next(new Error('Server error fetching users.'));
  }
};


const deleteUser = async (req, res, next) => {
  const userIdToDelete = req.params.id;

  try {
    if (req.user.id === userIdToDelete) {
      const error = new Error('Admin cannot delete their own account via this endpoint.');
      error.statusCode = 403;
      return next(error);
    }

    const user = await User.findByPk(userIdToDelete);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    const deletedUser = {
      id: user.id,
      email: user.email,
      userType: user.user_type,
    };

    await user.destroy(); 

    res.json({ message: 'User deleted successfully.', deletedUser: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    next(new Error('Server error deleting user.'));
  }
};


const updateCharityStatus = async (req, res, next) => {
  const charityId = req.params.id;
  const { status } = req.body; 

  if (!status || !['approved', 'rejected'].includes(status)) {
    const error = new Error('Invalid status. Must be "approved" or "rejected".');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const charity = await Charity.findByPk(charityId);

    if (!charity) {
      const error = new Error('Charity not found.');
      error.statusCode = 404;
      return next(error);
    }

    charity.status = status;
    await charity.save();

    const user = await User.findByPk(charity.id); 
    if (user && user.email) {
      await sendEmail(
        user.email,
        `Your Charity Registration Status: ${status.toUpperCase()}`,
        `<p>Dear ${charity.name},</p>
         <p>Your registration for the Charity Donation Platform has been ${status}.</p>
         ${status === 'approved' ? '<p>You can now log in and manage your profile and projects.</p>' : '<p>Please contact support for more details if you believe this is an error.</p>'}
         <p>Best regards,<br>The Admin Team</p>`
      );
    }

    res.json({ message: `Charity status updated to ${status} successfully.`, charity: { id: charity.id, name: charity.name, status: charity.status } });
  } catch (error) {
    console.error('Error updating charity status:', error.message);
    next(new Error('Server error updating charity status.'));
  }
};


const deleteCharity = async (req, res, next) => {
  const charityIdToDelete = req.params.id;

  try {
    const user = await User.findOne({ where: { id: charityIdToDelete, user_type: 'charity' } });

    if (!user) {
      const error = new Error('Charity not found or not a charity account.');
      error.statusCode = 404;
      return next(error);
    }

    const deletedCharityUser = {
      id: user.id,
      email: user.email,
    };

    await user.destroy(); 

    res.json({ message: 'Charity account deleted successfully.', deletedCharity: deletedCharityUser });
  } catch (error) {
    console.error('Error deleting charity:', error.message);
    next(new Error('Server error deleting charity.'));
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateCharityStatus,
  deleteCharity,
};