

//donationController.js:
const Donation = require("../models/donationModel");
const User=require("../models/userModel");
const nodemailer = require('nodemailer');



const addDonation = (req, res) => {
  const {
    user_id,
    type,
    amount,
    orphanage_id,
    campaign_id,
    category,
    donation_for
  } = req.body;

  if (donation_for === "orphanage" && !orphanage_id) {
    return res.status(400).json({ message: "orphanage_id is required for orphanage donations" });
  }

  if (donation_for === "emergency_campaign" && !campaign_id) {
    return res.status(400).json({ message: "campaign_id is required for campaign donations" });
  }

  User.findUserById(user_id, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "donor") {
      return res.status(403).json({ message: "Access denied. Donors only." });
    }

    const proceedWithDonation = () => {
      const remaining_balance = amount;
      const data = [
        user_id,
        type,
        amount,
        orphanage_id || null,
        campaign_id || null,
        category,
        donation_for,
        remaining_balance
      ];

      Donation.insertDonation(data, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });

        const handleAfterInsert = () => {
          Donation.getDonationById(result.insertId, (err, results) => {
            if (err) return res.status(500).json({ message: err.message });

            const cleanedDonations = results.map(donation => {
              if (donation.donation_for === 'orphanage') {
                const { campaign_id, campaign_title, ...rest } = donation;
                return rest;
              } else if (donation.donation_for === 'emergency_campaign') {
                const { orphanage_id, ...rest } = donation;
                return rest;
              }
              return donation;
            });

            res.status(201).json({
              message: "Donation recorded",
              donationId: result.insertId,
              donations: cleanedDonations
            });
          });
        };

        if (donation_for === 'emergency_campaign') {
          Donation.updateCampaignAmount(campaign_id, amount, (err) => {
            if (err) {
              console.error("Failed to update campaign amount:", err.message);
              return res.status(500).json({ message: "Donation recorded, but failed to update campaign amount." });
            }
            handleAfterInsert();
          });
        } else {
          handleAfterInsert();
        }
      });
    };

    if (donation_for === 'emergency_campaign') {
      Donation.getCampaignById(campaign_id, (err, campaign) => {
        if (err || !campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        const totalAfterDonation = parseFloat(campaign.amount_raised) + parseFloat(amount);

        if (totalAfterDonation > parseFloat(campaign.goal_amount)) {
          const remaining = parseFloat(campaign.goal_amount) - parseFloat(campaign.amount_raised);
          return res.status(400).json({
            message: `Donation exceeds campaign goal. Only $${remaining.toFixed(2)} remaining.`
          });
        }

        proceedWithDonation();
      });
    } else {
      proceedWithDonation();
    }
  });
};




const getUserDonations = (req, res) => {
  const userId = req.params.userId;
  Donation.getUserDonations(userId, (err, donations) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(donations);
  });
};

const getAllDonations = (req, res) => {
  Donation.getAllDonations((err, donations) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(donations);
  });
};

const createCampaign = (req, res) => {
  const orphanage_id=req.params.orphanage_id;
  const { title, amount, ended_at } = req.body;

const data = [title, amount, ended_at, orphanage_id];

  // Step 1: Create the campaign
  Donation.createCampaign(data, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    // Step 2: Notify all donors via email
    User.getDonorEmails((err, users) => {
      if (err) return res.status(500).json({ message: "Campaign created, but failed to notify donors" });

      const emails = users.map(u => u.email);
      sendCampaignAlert(emails, title, ended_at, "abdelrahmanmasri3@gmail.com"); // Directly use the sender email from URI
    });

    res.status(201).json({ message: "Campaign created and donors notified" });
  });
};

// Email sender setup
const sendCampaignAlert = (emailList, title, endedAt, sender) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'abdelrahmanmasri3@gmail.com', 
      pass: 'rxmfywyxxnbbuyus', 
    }
  });

  const mailOptions = {
    from: `"Relief System" <${sender}>`, // Sender is now directly taken from the URI parameter
    to: emailList,
    subject: '🚨 Urgent Emergency Campaign Alert',
    text: `A new urgent campaign "${title}" has been launched by ${sender}.\nSupport it before ${endedAt}.\nVisit the platform now to contribute.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Failed to send campaign alert:", error);
    else console.log('Campaign email sent: ' + info.response);
  });
};

const getUserCampaigns = (req, res) => {
  const userId = req.params.user_id;
  Donation.getUserCampaigns(userId, (err, campaigns) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(campaigns);
  });
};

const getDonationTracking = (req, res) => {
  const donationId = req.params.donationId;
  Donation.getDonationTracking(donationId, (err, trackingData) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(trackingData);
  });
};

const getCampaignById = (req, res) => {
  const { campaign_id } = req.params; // Get the campaign_id from request parameters

  // Call the model method to get campaign details
  Donation.getCampaignById(campaign_id, (err, campaign) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Send the campaign details back in the response
    res.status(200).json({
      message: 'Campaign details retrieved successfully',
      campaign: {
        id: campaign.id,
        goal_amount: campaign.goal_amount,
        amount_raised: campaign.amount_raised
      }
    });
  });
};


module.exports = {
  addDonation,
  getUserDonations,
  getAllDonations,
getCampaignById,
 getDonationTracking,
  createCampaign,
  getUserCampaigns
};


/*
const trackDonation = (req, res) => {
  const { donation_id, description, photo_url } = req.body;
  const data = [donation_id, description, photo_url];

  Donation.insertDonationTracking(data, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: "Donation tracking added" });
  });
};

*/




/*
const addDonation = (req, res) => {
  const {
    user_id,
    type,
    amount,
    orphanage_id,
    campaign_id,
    category,
    donation_for
  } = req.body;

  if (donation_for === "orphanage" && !orphanage_id) {
    return res.status(400).json({ message: "orphanage_id is required for orphanage donations" });
  }

  if (donation_for === "emergency_campaign" && !campaign_id) {
    return res.status(400).json({ message: "campaign_id is required for campaign donations" });
  }

  User.findUserById(user_id, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "donor") {
      return res.status(403).json({ message: "Access denied. Donors only." });
    }

    const remaining_balance = amount; // directly set equal to amount
const data = [
  user_id,
  type,
  amount,
  orphanage_id || null,
  campaign_id || null,
  category,
  donation_for,
  remaining_balance
];


    Donation.insertDonation(data, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      // After inserting, fetch updated donations
      Donation.getDonationById(result.insertId, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });

        const cleanedDonations = results.map(donation => {
          if (donation.donation_for === 'orphanage') {
            const { campaign_id, campaign_title, ...rest } = donation;
            return rest;
          } else if (donation.donation_for === 'emergency_campaign') {
            const { orphanage_id, ...rest } = donation;
            return rest;
          }
          return donation;
        });

        res.status(201).json({
          message: "Donation recorded",
          donationId: result.insertId,
          donations: cleanedDonations
        });
      });
    });
  });
};

*/