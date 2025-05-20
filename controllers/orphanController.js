//orphanController.js:


const Orphan = require("../models/orphanModel");
const db = require('../config/db');

const createOrphan = (req, res) => {
  const data = [
    req.body.name,
    req.body.age,
    req.body.education_status,
    req.body.health_condition,
    req.body.photo_url,
    req.body.orphanage_id
  ];

  Orphan.insertOrphan(data, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: "Orphan added", orphanId: result.insertId });
  });
};

const getOrphans = (req, res) => {
  Orphan.getAllOrphansWithSponsor((err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};
const sponsorOrphan = (req, res) => {
  const userId = req.body.user_id;
  const orphanId = req.params.orphanId;
  const { amount, start_date, end_date } = req.body;

  const checkRoleQuery = "SELECT role FROM users WHERE user_id = ?";
  db.query(checkRoleQuery, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error",details: err.message});
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const userRole = results[0].role;
    if (userRole !== "sponsor") {
      return res.status(403).json({ message: "Only sponsors can sponsor orphans" });
    }

    const data = [userId, orphanId, amount, start_date, end_date];
    Orphan.sponsorOrphan(data, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "Orphan sponsored successfully", sponsorshipId: result.insertId });
    });
  });
};



const updateOrphanOnly = (req, res) => {
  const orphanId = req.params.orphanId;
  const { health_condition, education_status, photo_url } = req.body;

  Orphan.updateOrphanProfile(health_condition, education_status, photo_url, orphanId, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    res.status(200).json({ message: "Orphan profile updated successfully" });
  });
};

const addOrphanToDonation = (req, res) => {
  const usageId = req.params.usageId;
  const { orphanId, notes } = req.body;

  const data = [usageId, orphanId, notes];

  Orphan.addOrphanToUsage(data, (err, result) => {
    if (err) {
      // Return a custom error message if orphan and donation orphanage don't match
      return res.status(400).json({ message: err.message });
    }
    res.json({ message: 'Orphan added to donation usage' });
  });
};

const getOrphansByDonationUsage = (req, res) => {
  const usageId = req.params.usageId;

  Orphan.getOrphansByDonationUsage(usageId, (err, orphans) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(orphans);
  });
};



const getSponsoredOrphans = (req, res) => {
  const orphanageId = req.params.orphanage_id;

  Orphan.getSponsoredOrphans(orphanageId, (err, results) => {
    if (err) {
      console.error("Error fetching sponsored orphans:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.status(200).json({ sponsoredOrphans: results });
  });
};


const getUnSponsoredOrphans = (req, res) => {
  const orphanageId = req.params.orphanage_id;

  Orphan.getUnSponsoredOrphans(orphanageId, (err, results) => {
    if (err) {
      console.error("Error fetching unsponsored orphans:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.status(200).json({ unsponsoredOrphans: results });
  });
};



module.exports={
  createOrphan,
    getOrphans ,
    sponsorOrphan,
    updateOrphanOnly,
    addOrphanToDonation,
  getOrphansByDonationUsage,
  getSponsoredOrphans,
  getUnSponsoredOrphans
}