const express = require('express');
const { getAllUsers, deleteUser, updateCharityStatus, deleteCharity } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);
router.put('/charities/:id/status', protect, authorizeRoles('admin'), updateCharityStatus);
router.delete('/charities/:id', protect, authorizeRoles('admin'), deleteCharity);

module.exports = router;