
//volunteerRoutes.js

const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

// Volunteer registers a service
router.post('/services', volunteerController.registerService);

// Volunteer views matching requests
router.get('/:id/matches', volunteerController.getMatches);

// Volunteer accepts a matched request
router.post('/match/:matchId/accept', volunteerController.acceptMatch);

// Volunteer manually creates a match (new route)
router.post('/matches', volunteerController.createMatch);


module.exports = router;
