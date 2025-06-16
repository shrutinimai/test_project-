const express = require('express');
const { getAllCharities, getCharityProfile, updateCharityProfile, addCharityProject, getCharityProjects, setCharityGoal } = require('../controllers/charityController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllCharities); 
router.get('/:id', getCharityProfile); 
router.get('/:id/projects', getCharityProjects); 

router.put('/profile', protect, authorizeRoles('charity'), updateCharityProfile);
router.post('/projects', protect, authorizeRoles('charity'), addCharityProject);
router.put('/goals', protect, authorizeRoles('charity'), setCharityGoal);

module.exports = router;