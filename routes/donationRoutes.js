
//donationRoutes.js

const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { authenticateToken, authorizeRole,verifyOrphanage } = require("../middleware/authMiddleware");


// Get all donations (admin view)
router.get("/", authenticateToken, donationController.getAllDonations);

// Get donations for a specific user
router.get("/user/:userId", authenticateToken, donationController.getUserDonations);

router.get("/campaigns/:user_id", authenticateToken, authorizeRole("donor"), donationController.getUserCampaigns);
//create campaign
router.post('/create/:orphanage_id', donationController.createCampaign);

router.get("/track/:donationId", authenticateToken, donationController.getDonationTracking);
module.exports = router;



router.post("/track", authenticateToken, authorizeRole("admin"), donationController.trackDonation);

