
//userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { body } = require('express-validator');
const donationController = require("../controllers/donationController");

router.post(
  '/register',
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone_number').optional().isLength({ max: 15 }).withMessage('Phone number must not exceed 15 characters'),
    body('role').optional().isIn(['admin', 'donor', 'sponsor','volunteer']).withMessage('Role must be one of: admin, donor, sponsor,volunteer'),
  ],
  userController.register
);

router.post('/verify-email', userController.verifyEmail);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  userController.login
);

router.get('/profile', authenticateToken, userController.getProfile);

router.put(
  '/profile',
  authenticateToken, 
  [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone_number').optional().isLength({ max: 15 }).withMessage('Phone number must not exceed 15 characters')
  ],
  userController.updateProfile 
);

// Add new donation
router.post("/addDonation", authenticateToken, authorizeRole("donor"), donationController.addDonation);
router.post("/addReview",authenticateToken,authorizeRole("donor"),userController.addReview)

module.exports = router;
