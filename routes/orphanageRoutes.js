

//orphanageRoutes.js
const express = require('express');
const router = express.Router();
const orphanageController = require('../controllers/orphanageController');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.post(
  '/add',
  authenticateToken,
  authorizeRole('admin'),
  [
    body('name').notEmpty().withMessage('Orphanage name is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('contact_email').isEmail().withMessage('Valid contact email is required'),
  ],
  orphanageController.addOrphanage
);



router.get("/donations/:id",orphanageController.getDonations)

router.get('/:id', orphanageController.getOrphanageById);


router.post('/:orphanage_id/requests', authenticateToken, orphanageController.postRequest);


router.get('/requests/:orphanageId', authenticateToken, orphanageController.getRequestsByOrphanage);
// Only orphanages can record usage
router.post('/usage', authenticateToken, orphanageController.recordDonationUsage);

router.get('/:orphanageId/orphans', orphanageController.getOrphansByOrphanageId);




router.get('/usage/:donationId', authenticateToken, orphanageController.getDonationUsageWithOrphans);

// Optional: View balance summary
router.get('/balance/:donationId', authenticateToken, orphanageController.getDonationBalance);


module.exports = router;

// View usage history for a donation
//router.get('/usage/:donationId', authenticateToken, orphanageController.getDonationUsage);