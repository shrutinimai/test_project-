const { User, Donation, Charity, Project } = require('../config/database');
const { Op } = require('sequelize'); 


const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; 
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'full_name', 'address', 'city', 'country', 'user_type', 'created_at', 'updated_at'],
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    next(new Error('Server error fetching user profile.'));
  }
};


const updateUserProfile = async (req, res, next) => {
  const { fullName, address, city, country } = req.body;
  const userId = req.user.id; 

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    user.full_name = fullName !== undefined ? fullName : user.full_name;
    user.address = address !== undefined ? address : user.address;
    user.city = city !== undefined ? city : user.city;
    user.country = country !== undefined ? country : user.country;

    await user.save(); 

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        fullName: user.full_name,
        address: user.address,
        city: user.city,
        country: user.country,
        email: user.email,
        userType: user.user_type,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    next(new Error('Server error updating user profile.'));
  }
};


const getUserDonationHistory = async (req, res, next) => {
  const userId = req.user.id; 
  const limit = parseInt(req.query.limit) || 10; 
  const offset = parseInt(req.query.offset) || 0; 

  try {
    const { count, rows: donations } = await Donation.findAndCountAll({
      where: { user_id: userId, status: 'completed' }, 
      attributes: [
        'id', 'charity_id', 'project_id', 'amount', 'currency', 'status',
        'transaction_id', 'donated_at', 'is_anonymous'
      ],
      include: [
        { model: Charity, as: 'charity', attributes: ['name'] },
        { model: Project, as: 'project', attributes: ['title'], required: false }, 
      ],
      order: [['donated_at', 'DESC']], 
      limit: limit,
      offset: offset,
    });

    const formattedDonations = donations.map(donation => ({
      id: donation.id,
      charityId: donation.charity_id,
      charityName: donation.charity ? donation.charity.name : null,
      projectId: donation.project_id,
      projectName: donation.project ? donation.project.title : null, 
      amount: parseFloat(donation.amount), 
      currency: donation.currency,
      status: donation.status,
      transactionId: donation.transaction_id,
      donatedAt: donation.donated_at,
      isAnonymous: donation.is_anonymous,
    }));

    res.json({
      donations: formattedDonations,
      total: count, 
    });
  } catch (error) {
    console.error('Error fetching user donation history:', error.message);
    next(new Error('Server error fetching donation history.'));
  }
};

const downloadDonationReceipt = async (req, res, next) => {
  const donationId = req.params.id;
  const userId = req.user.id; 

  try {
    const donation = await Donation.findOne({
      where: {
        id: donationId,
        user_id: userId, 
        status: 'completed', 
      },
    });

    if (!donation) {
      const error = new Error('Donation not found or you do not have permission to access this receipt.');
      error.statusCode = 404;
      return next(error);
    }

   
    const mockReceiptUrl = `https://example.com/receipts/${donationId}_${Date.now()}.pdf`;

    res.json({
      message: 'Receipt generated (mock URL).',
      receiptUrl: mockReceiptUrl,
      donationDetails: {
        id: donation.id,
        amount: parseFloat(donation.amount),
        currency: donation.currency,
        donatedAt: donation.donated_at,
        transactionId: donation.transaction_id,
      }
    });
  } catch (error) {
    console.error('Error generating donation receipt:', error.message);
    next(new Error('Server error generating receipt.'));
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserDonationHistory,
  downloadDonationReceipt,
};
