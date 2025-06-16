const express = require('express');
const { initiateDonation, verifyDonation } = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/initiate', protect, initiateDonation); 
router.post('/verify', express.raw({ type: '*/*' }), verifyDonation);

module.exports = router;