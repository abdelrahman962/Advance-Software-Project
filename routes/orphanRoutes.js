//orphanRoutes.js:

const express = require("express");
const router = express.Router();
const orphanController = require("../controllers/orphanController");
const {authenticateToken} = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authMiddleware');

// Add new orphan by admin

router.post(
  '/add',
  authenticateToken,
  authorizeRole('admin'),
  
  orphanController.createOrphan,

);


router.put(
  "/update/:orphanId",
  authenticateToken,
  authorizeRole('admin'), 
  orphanController.updateOrphanOnly
);


// Get all orphans
router.get("/", orphanController.getOrphans);

// Sponsor an orphan
router.post("/sponsor/:orphanId", authenticateToken,authorizeRole("sponsor"),orphanController.sponsorOrphan);


router.get("/sponsoredOrphans/:orphanage_id",orphanController.getSponsoredOrphans);


router.get("/unsponsoredOrphans/:orphanage_id", orphanController.getUnSponsoredOrphans);


// Add orphan to a specific donation usage
router.post(
  '/donation/:usageId/beneficiaries',
  authenticateToken,
  orphanController.addOrphanToDonation
);

// Get orphans who benefited from a donation usage
router.get(
  '/donation/:usageId/beneficiaries',
  authenticateToken,
  orphanController.getOrphansByDonationUsage
);




module.exports = router;
