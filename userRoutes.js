const express = require('express');
const { getUserProfile, updateUserProfile, getUserDonationHistory, downloadDonationReceipt } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/donations', protect, getUserDonationHistory);
router.get('/donations/:id/receipt', protect, downloadDonationReceipt);

module.exports = router;