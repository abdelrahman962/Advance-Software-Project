// controllers/orphanageController.js
const { validationResult } = require('express-validator');
const Orphanage = require('../models/orphanageModel');
const Orphan=require("../models/orphanModel");
const addOrphanage = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, city, address, contact_email } = req.body;

  Orphanage.createOrphanage(name, city, address, contact_email, (err, result) => {
    if (err) {
      console.error('Error adding orphanage:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({ message: 'Orphanage added successfully', orphanageId: result.insertId });
  });
};

const getOrphanageById = (req, res) => {
    const { id } = req.params;
  
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid orphanage ID' });
    }
  
    Orphanage.getOrphanageById(id, (err, results) => {
      if (err) {
        console.error('Error fetching orphanage by ID:', err);
        return res.status(500).json({ message: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Orphanage not found' });
      }
  
      res.status(200).json(results[0]);
    });
  };


  const postRequest = (req, res) => {
    const orphanage_id = req.params.orphanage_id;
    const { service_needed, description, needed_date } = req.body;
  
    Orphanage.createRequest(orphanage_id, service_needed, description, needed_date, (err, result) => {
      if (err) {
        console.error('Error creating request:', err);
        return res.status(500).json({ error: 'Failed to create request' });
      }
  
      const requestId = result.insertId;
  
      Orphanage.autoMatchVolunteers(service_needed, requestId, (matchErr, matchedVolunteers) => {
        if (matchErr) {
          console.error('Error matching volunteers:', matchErr);
          return res.status(500).json({ error: 'Failed to match volunteers' });
        }
  
        res.status(201).json({
          message: 'Request posted and volunteers matched successfully.',
          requestId,
          matchedVolunteers: matchedVolunteers.map(v => v.user_id)
        });
      });
    });
  };

 



  const getRequestsByOrphanage = (req, res) => {
    const { orphanageId } = req.params;
  
    if (!orphanageId || isNaN(orphanageId)) {
      return res.status(400).json({ message: 'Invalid orphanage ID' });
    }
  
    Orphanage.getRequestsByOrphanageId(orphanageId, (err, requests) => {
      if (err) {
        console.error('Error fetching requests:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      res.status(200).json({ requests });
    });
  };

// controllers/donationController.js

// Get donations for a specific orphanage
const getDonations = (req, res) => {
  const orphanageId = req.params.id;

  // Validate orphanage ID
  if (!orphanageId || isNaN(orphanageId)) {
    return res.status(400).json({ message: 'Invalid orphanage ID' });
  }

  // Fetch donations from the model
  Orphanage.getDonationsForOrphanage(orphanageId, (err, donations) => {
    if (err) {
      console.error('Error fetching donations:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no donations found
    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this orphanage' });
    }

    // Return donations data
    res.status(200).json({ donations });
  });
};




const recordDonationUsage = (req, res) => {
  const { donation_id, usage_description, amount_used, used_date } = req.body;

  if (!donation_id || !usage_description || !amount_used || !used_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Step 1: Check balance and update donation usage
  Orphanage.recordDonationUsage(donation_id, usage_description, amount_used, used_date, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    res.status(201).json({
      message: result.message,
      newRemainingBalance: result.newRemainingBalance
    });
  });
};


const getDonationUsageWithOrphans = (req, res) => {
  const donationId = req.params.donationId;
  

  // Step 1: Get all donation usages related to this donation
  Orphanage.getDonationUsageByDonationId(donationId, (err, usages) => {
    if (err) return res.status(500).json({ message: 'Error fetching usage' });
    if (!usages || usages.length === 0) {
      return res.status(404).json({ message: 'No usage found for this donation' });
    }

    // Step 2: For each usage, get orphans
    let pending = usages.length;
    usages.forEach((usage, index) => {
      Orphan.getOrphansByDonationUsage(usage.id, (err, orphans) => {
        if (err) return res.status(500).json({ message: 'Error fetching orphans' });
        usages[index].orphans = orphans;

        if (--pending === 0) {
          res.status(200).json({ usages });
        }
      });
    });
  });
};



// Get usage history
const getDonationUsage = (req, res) => {
  const donationId = req.params.donationId;

  Orphanage.getDonationUsageByDonationId(donationId, (err, usage) => {
    if (err) return res.status(500).json({ message: 'Error fetching usage' });
    res.status(200).json({ usage });
  });
};

// (Optional) Get donation balance
const getDonationBalance = (req, res) => {
  const donationId = req.params.donationId;

  Orphanage.getDonationBalance(donationId, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching balance' });
    if (results.length === 0) return res.status(404).json({ message: 'Donation not found' });

    const { total_donated, total_used } = results[0];
    res.status(200).json({
      total_donated,
      total_used,
      remaining: total_donated - total_used
    });
  });
};

const getOrphansByOrphanageId = (req, res) => {
  const orphanageId = req.params.orphanageId;

  // Validate orphanageId (ensure it's a valid number or string, depending on your setup)
  if (!orphanageId || isNaN(orphanageId)) {
    return res.status(400).json({ message: 'Invalid orphanage ID' });
  }

  // Call model method to get orphans
  Orphanage.getOrphansByOrphanageId(orphanageId, (error, results) => {
    if (error) {
      console.error('Error fetching orphans:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No orphans found for this orphanage' });
    }

    return res.status(200).json({ orphans: results });
  });
};



  
  module.exports={
addOrphanage,
getOrphanageById,
postRequest ,
getRequestsByOrphanage,
getDonations,
recordDonationUsage,
getDonationBalance,
getDonationUsage,
getOrphansByOrphanageId,
getDonationUsageWithOrphans

  }


  /*
  const postRequest = (req, res) => {
    const orphanage_id=req.params.orphanage_id;
    const {  service_needed, description, needed_date } = req.body;
  
    Orphanage.createRequest(orphanage_id, service_needed, description, needed_date, (err, result) => {
      if (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ error: 'Failed to create request' });
      } else {
        res.status(201).json({
          message: 'Request posted successfully.',
          requestId: result.insertId
        });
      }
    });
  };
  
*/


/*

const getDonationUsageWithOrphans = (req, res) => {
  const donationId = req.params.donationId;

  // Step 1: Get all donation usages related to this donation
  Orphanage.getDonationUsageByDonationId(donationId, (err, usages) => {
    if (err) return res.status(500).json({ message: 'Error fetching usage' });
    if (!usages || usages.length === 0) {
      return res.status(404).json({ message: 'No usage found for this donation' });
    }

    // Step 2: Get the orphanage ID associated with this donation
    Orphanage.getDonationBalance(donationId, (err2, balanceData) => {
      if (err2) return res.status(500).json({ message: 'Error fetching donation details' });

      const orphanageIdQuery = `
        SELECT orphanage_id FROM donations WHERE id = ?
      `;
      Orphanage.db.query(orphanageIdQuery, [donationId], (err3, donationResult) => {
        if (err3 || donationResult.length === 0) {
          return res.status(500).json({ message: 'Unable to fetch orphanage for donation' });
        }

        const orphanageId = donationResult[0].orphanage_id;

        // Step 3: Get all orphans from this orphanage
        Orphanage.getOrphansByOrphanageId(orphanageId, (err4, orphans) => {
          if (err4) return res.status(500).json({ message: 'Error fetching orphans' });

          res.status(200).json({
            usages,
            orphans,
            donationBalance: balanceData[0] || {}
          });
        });
      });
    });
  });
};



*/
